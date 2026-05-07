import * as THREE from 'three';
import { COLLIDER_TYPES } from './types.js';
import {
    CENTRAL_PATH_HALF_WIDTH,
    COLLIDER_SHRINK,
    TABLE_COLLIDER_MAX_HEIGHT,
    TABLE_COLLIDER_SHRINK_XZ
} from '../config/playerSettings.js';

const DEFAULT_GLTF_COLLIDER_NAME_PATTERN = /collision|collider|physics|table|bench|banc|pillar|column|poteau|fireplace|door|stair|step|gros[_-]?obstacle|large[_-]?obstacle/i;
const DEFAULT_GLTF_DECORATIVE_PATTERN = /table\d*props|plate|assiette|horn|corne|shield|bouclier|chandelier|candle|bougie|lamp|torche|fire_lambert|decor|ornament|gold|dor|wall[_-]?object|suspend|hanging|artifact|artefact|supportbeam|mouldingwall|window/i;
const TABLE_MESH_PATTERN = /(^|[\s>_])table\d*($|[\s>_])|(^|[\s>_])bench\d*($|[\s>_])/i;
const TABLE_PROP_PATTERN = /props|plate|assiette|horn|corne|cup|goblet|drinking|food|bowl|candle|fire/i;
const HANGING_HEIGHT_MIN_Y = -2.0;

export const VIKING_HALL_COLLIDER_LAYOUT = Object.freeze([
    {
        id: 'bounds-left-wall',
        type: COLLIDER_TYPES.WALL,
        min: [-8.9, -4.2, -14.65],
        max: [-8.25, 2.7, 14.65]
    },
    {
        id: 'bounds-right-wall',
        type: COLLIDER_TYPES.WALL,
        min: [8.1, -4.2, -14.65],
        max: [8.9, 2.7, 14.65]
    },
    {
        id: 'bounds-back-wall',
        type: COLLIDER_TYPES.WALL,
        min: [-8.9, -4.2, -14.75],
        max: [8.9, 2.7, -14.3]
    },
    {
        id: 'bounds-front-wall',
        type: COLLIDER_TYPES.WALL,
        min: [-8.9, -4.2, 14.25],
        max: [8.9, 2.7, 14.75]
    },
    {
        id: 'bounds-ceiling',
        type: COLLIDER_TYPES.CEILING,
        min: [-8.9, 1.95, -14.65],
        max: [8.9, 2.35, 14.65]
    },
    {
        id: 'floor-main',
        type: COLLIDER_TYPES.FLOOR,
        min: [-8.35, -3.82, -14.35],
        max: [8.35, -3.72, 14.35],
        blocksMovement: false,
        supportsPlayer: true
    }
]);

export function createBoxCollider({ id, min, max, type = COLLIDER_TYPES.OBSTACLE, ...options }) {
    return {
        id,
        type,
        box: new THREE.Box3(
            new THREE.Vector3(min[0], min[1], min[2]),
            new THREE.Vector3(max[0], max[1], max[2])
        ),
        ...options
    };
}

export function createWallColliders({
    collisionSystem = null,
    layout = VIKING_HALL_COLLIDER_LAYOUT,
    source = 'viking-hall-layout'
} = {}) {
    const colliders = layout.map((definition) => createBoxCollider({
        ...definition,
        source
    }));

    if (collisionSystem) {
        collisionSystem.addColliders(colliders);
    }

    return colliders;
}

export function createCollidersFromGLTF(root, {
    collisionSystem = null,
    include = DEFAULT_GLTF_COLLIDER_NAME_PATTERN,
    exclude = DEFAULT_GLTF_DECORATIVE_PATTERN,
    minSize = 0.08,
    shrink = COLLIDER_SHRINK,
    tableShrinkXZ = TABLE_COLLIDER_SHRINK_XZ,
    tableMaxHeight = TABLE_COLLIDER_MAX_HEIGHT,
    centralPathHalfWidth = CENTRAL_PATH_HALF_WIDTH,
    protectCentralPath = true,
    source = 'gltf',
    type = COLLIDER_TYPES.OBSTACLE,
    blocksMovement = undefined,
    supportsPlayer = false
} = {}) {
    const colliders = [];
    root.updateMatrixWorld(true);

    root.traverse((object) => {
        if (!object.isMesh) return;

        const objectPath = getObjectPath(object);
        const searchableName = `${object.name ?? ''} ${object.parent?.name ?? ''} ${objectPath}`;
        const explicitlyPhysical = object.userData?.collision === true
            || object.userData?.collider === true
            || object.userData?.blocksMovement === true;
        const recognizedPhysical = matchesFilter(searchableName, object, include);
        const decorative = matchesFilter(searchableName, object, exclude);
        const inferredType = inferColliderType(searchableName, type);
        const isTable = inferredType === COLLIDER_TYPES.TABLE;
        const isNonBlockingDecor = inferredType === COLLIDER_TYPES.SMALL_DECOR
            || inferredType === COLLIDER_TYPES.HANGING_DECOR
            || inferredType === COLLIDER_TYPES.FLOOR_DECOR
            || inferredType === COLLIDER_TYPES.DECORATIVE
            || inferredType === COLLIDER_TYPES.TRIGGER;

        if (!explicitlyPhysical && (!recognizedPhysical || (decorative && !isTable))) return;

        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;

        if (isHangingDecor(box, inferredType)) return;

        if (isTable) {
            tuneTableBox(box, tableShrinkXZ, tableMaxHeight);
        } else {
            shrinkBox(box, shrink);
        }

        const size = box.getSize(new THREE.Vector3());
        if (size.x < minSize && size.y < minSize && size.z < minSize) return;

        const isFloor = inferredType === COLLIDER_TYPES.FLOOR;
        const collider = {
            id: `${source}:${object.uuid}`,
            box,
            type: inferredType,
            blocksMovement: blocksMovement ?? (!isFloor && !isNonBlockingDecor),
            supportsPlayer: isFloor || supportsPlayer,
            source,
            userData: {
                objectName: object.name,
                parentName: object.parent?.name,
                objectPath,
                explicitlyPhysical,
                recognizedPhysical
            }
        };

        const splitColliders = protectCentralPath
            ? splitColliderAroundCentralPath(collider, centralPathHalfWidth)
            : [collider];

        colliders.push(...splitColliders);
    });

    if (collisionSystem && colliders.length > 0) {
        collisionSystem.addColliders(colliders);
    }

    return colliders;
}

export function createColliderForObject(object, {
    collisionSystem = null,
    id = object.name || object.uuid,
    type = COLLIDER_TYPES.OBSTACLE,
    padding = 0.08,
    source = 'object',
    isStatic = false
} = {}) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    if (padding !== 0) box.expandByScalar(padding);

    const collider = {
        id,
        box,
        type,
        source,
        isStatic
    };

    if (collisionSystem) {
        return collisionSystem.addCollider(collider.box, collider);
    }

    return collider;
}

export function createThreeMeshBVHStrategyNotes() {
    return [
        'Install three-mesh-bvh and call geometry.computeBoundsTree() on heavy static meshes.',
        'Use shapecast() with the player capsule to test triangle-level collision only after this Box3 broad phase.',
        'Keep Box3 room bounds as a cheap first pass, then query BVH for detailed stairs, arches, and irregular walls.'
    ];
}

function shrinkBox(box, amount) {
    if (!amount || amount <= 0) return box;

    const size = box.getSize(new THREE.Vector3());
    const shrink = new THREE.Vector3(
        Math.min(amount, Math.max(0, size.x * 0.45)),
        Math.min(amount, Math.max(0, size.y * 0.45)),
        Math.min(amount, Math.max(0, size.z * 0.45))
    );

    box.min.add(shrink);
    box.max.sub(shrink);
    return box;
}

function tuneTableBox(box, shrinkXZ, maxHeight) {
    if (shrinkXZ > 0) {
        const size = box.getSize(new THREE.Vector3());
        const shrink = new THREE.Vector3(
            Math.min(shrinkXZ, Math.max(0, size.x * 0.42)),
            0,
            Math.min(shrinkXZ, Math.max(0, size.z * 0.42))
        );
        box.min.add(shrink);
        box.max.sub(shrink);
    }

    const height = box.max.y - box.min.y;
    if (maxHeight > 0 && height > maxHeight) {
        box.max.y = box.min.y + maxHeight;
    }

    return box;
}

function splitColliderAroundCentralPath(collider, halfWidth) {
    if (!collider.blocksMovement || !intersectsCentralPath(collider.box, halfWidth)) {
        return [collider];
    }

    const canLiveInCenter = collider.type === COLLIDER_TYPES.LARGE_OBSTACLE
        && (collider.box.max.x - collider.box.min.x) <= halfWidth;
    if (canLiveInCenter) return [collider];

    if (collider.type !== COLLIDER_TYPES.TABLE && collider.type !== COLLIDER_TYPES.STAIRS) {
        return [collider];
    }

    const pieces = [];
    const minPieceWidth = 0.2;

    if (collider.box.min.x < -halfWidth) {
        const leftBox = collider.box.clone();
        leftBox.max.x = Math.min(leftBox.max.x, -halfWidth);
        if (leftBox.max.x - leftBox.min.x >= minPieceWidth) {
            pieces.push(cloneColliderPiece(collider, leftBox, 'left-of-path'));
        }
    }

    if (collider.box.max.x > halfWidth) {
        const rightBox = collider.box.clone();
        rightBox.min.x = Math.max(rightBox.min.x, halfWidth);
        if (rightBox.max.x - rightBox.min.x >= minPieceWidth) {
            pieces.push(cloneColliderPiece(collider, rightBox, 'right-of-path'));
        }
    }

    if (pieces.length === 0) {
        return [{
            ...collider,
            blocksMovement: false,
            type: COLLIDER_TYPES.FLOOR_DECOR,
            userData: {
                ...collider.userData,
                centralPathSuppressed: true
            }
        }];
    }

    return pieces;
}

function cloneColliderPiece(collider, box, suffix) {
    return {
        ...collider,
        id: `${collider.id}:${suffix}`,
        box,
        userData: {
            ...collider.userData,
            centralPathSplit: suffix
        }
    };
}

function intersectsCentralPath(box, halfWidth) {
    return box.min.x < halfWidth && box.max.x > -halfWidth;
}

function isHangingDecor(box, type) {
    if (type === COLLIDER_TYPES.CEILING || type === COLLIDER_TYPES.WALL || type === COLLIDER_TYPES.LARGE_OBSTACLE) {
        return false;
    }

    return box.min.y > HANGING_HEIGHT_MIN_Y;
}

function getObjectPath(object) {
    const names = [];
    let current = object;
    while (current) {
        if (current.name) names.push(current.name);
        current = current.parent;
    }
    return names.reverse().join(' > ');
}

function matchesFilter(name, object, filter) {
    if (filter === true) return true;
    if (filter === false || filter == null) return false;
    if (filter instanceof RegExp) return filter.test(name);
    if (typeof filter === 'function') return filter(name, object);
    if (Array.isArray(filter)) return filter.some((entry) => matchesFilter(name, object, entry));
    return String(name).toLowerCase().includes(String(filter).toLowerCase());
}

function inferColliderType(name, fallbackType) {
    if (/trigger/i.test(name)) return COLLIDER_TYPES.TRIGGER;
    if (/supportbeam|chandelier|torch|torche|suspend|hanging/i.test(name)) return COLLIDER_TYPES.HANGING_DECOR;
    if (/table\d*props|plate|assiette|horn|corne|cup|goblet|drinking|food|bowl|shield|bouclier|artifact|artefact/i.test(name)) return COLLIDER_TYPES.SMALL_DECOR;
    if (/firewood|pCylinder/i.test(name)) return COLLIDER_TYPES.FLOOR_DECOR;
    if (TABLE_MESH_PATTERN.test(name) && !TABLE_PROP_PATTERN.test(name) && !/supportbeam|tablewood/i.test(name.replace(/table\d*_tablewood/ig, ''))) {
        return COLLIDER_TYPES.TABLE;
    }
    if (/fireplace|noblechair|pillar|column|poteau/i.test(name)) return COLLIDER_TYPES.LARGE_OBSTACLE;
    if (/stair|step/i.test(name)) return COLLIDER_TYPES.STAIRS;
    if (/decor|ornament|prop/i.test(name)) return COLLIDER_TYPES.DECORATIVE;
    if (/floor|sol/i.test(name)) return COLLIDER_TYPES.FLOOR;
    if (/ceiling|plafond/i.test(name)) return COLLIDER_TYPES.CEILING;
    if (/door|porte/i.test(name)) return COLLIDER_TYPES.DOOR;
    if (/wall|mur|bounds/i.test(name)) return COLLIDER_TYPES.WALL;
    return fallbackType;
}
