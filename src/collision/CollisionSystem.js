import * as THREE from 'three';
import {
    BLOCKING_COLLIDER_TYPES,
    COLLIDER_TYPES,
    DEFAULT_PLAYER_COLLIDER,
    PLAYER_COLLIDER_MODES
} from './types.js';
import { COLLISION_LOG_BLOCKS } from '../config/playerSettings.js';

const _point = new THREE.Vector3();
const _size = new THREE.Vector3();
const _movementStep = new THREE.Vector3();
const _candidate = new THREE.Vector3();
const _broadphaseBox = new THREE.Box3();
const _capsuleStart = new THREE.Vector3();
const _capsuleEnd = new THREE.Vector3();
const _playerDebugBox = new THREE.Box3();
const _playerDebugSize = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();

function colliderBlocksMovement(type) {
    return BLOCKING_COLLIDER_TYPES.has(type);
}

function createColliderLabel(text, position, color) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.font = '32px sans-serif';
    context.fillStyle = 'rgba(0, 0, 0, 0.65)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.fillText(text.slice(0, 42), 18, 52);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = `label-${text}`;
    sprite.position.copy(position);
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
}

function distanceFromPointToBox(point, box) {
    box.clampPoint(point, _closestPoint);
    return _closestPoint.distanceTo(point);
}

function distanceToInterval(value, min, max) {
    if (value < min) return min - value;
    if (value > max) return value - max;
    return 0;
}

function intervalDistance(minA, maxA, minB, maxB) {
    if (maxA < minB) return minB - maxA;
    if (maxB < minA) return minA - maxB;
    return 0;
}

function intersectsSphereBox(center, radius, box) {
    box.clampPoint(center, _point);
    return _point.distanceToSquared(center) <= radius * radius;
}

function intersectsVerticalCapsuleBox(start, end, radius, box) {
    const dx = distanceToInterval(start.x, box.min.x, box.max.x);
    const dz = distanceToInterval(start.z, box.min.z, box.max.z);
    const dy = intervalDistance(
        Math.min(start.y, end.y),
        Math.max(start.y, end.y),
        box.min.y,
        box.max.y
    );

    return dx * dx + dy * dy + dz * dz <= radius * radius;
}

export class CollisionSystem {
    constructor({
        scene = null,
        player = {},
        spatialCellSize = 4,
        useSpatialIndex = true
    } = {}) {
        this.scene = scene;
        this.player = { ...DEFAULT_PLAYER_COLLIDER, ...player };
        this.colliders = [];
        this.dynamicColliders = new Set();
        this.spatialCellSize = spatialCellSize;
        this.useSpatialIndex = useSpatialIndex;
        this.spatialIndex = new Map();
        this.indexDirty = true;

        this.debugEnabled = false;
        this.logBlockedCollisions = COLLISION_LOG_BLOCKS;
        this.lastLoggedColliderId = null;
        this.lastBlockedCollider = null;
        this.highlightedColliderId = null;
        this.debugGroup = new THREE.Group();
        this.debugGroup.name = 'CollisionDebug';
        this.playerDebugHelper = null;
    }

    addCollider(box, options = {}) {
        const collider = {
            id: options.id ?? `collider-${this.colliders.length + 1}`,
            box: box.clone(),
            type: options.type ?? COLLIDER_TYPES.OBSTACLE,
            enabled: options.enabled ?? true,
            blocksMovement: options.blocksMovement ?? colliderBlocksMovement(options.type ?? COLLIDER_TYPES.OBSTACLE),
            supportsPlayer: options.supportsPlayer ?? (options.type === COLLIDER_TYPES.FLOOR || options.type === COLLIDER_TYPES.STEP),
            isStatic: options.isStatic ?? true,
            source: options.source ?? 'manual',
            userData: options.userData ?? {}
        };

        this.colliders.push(collider);
        if (!collider.isStatic) this.dynamicColliders.add(collider);
        this.indexDirty = true;
        if (this.debugEnabled) this.refreshDebugHelpers();
        return collider;
    }

    addColliders(colliders) {
        return colliders.map((collider) => this.addCollider(collider.box, collider));
    }

    clear() {
        this.colliders.length = 0;
        this.dynamicColliders.clear();
        this.spatialIndex.clear();
        this.indexDirty = true;
        this.refreshDebugHelpers();
    }

    updateColliderBox(id, box) {
        const collider = this.colliders.find((item) => item.id === id);
        if (!collider) return false;
        collider.box.copy(box);
        this.indexDirty = true;
        return true;
    }

    updatePlayerCollider(position, playerOptions = {}) {
        const player = { ...this.player, ...playerOptions };
        const radius = player.radius + player.skinWidth;

        if (player.mode === PLAYER_COLLIDER_MODES.SPHERE) {
            return {
                mode: PLAYER_COLLIDER_MODES.SPHERE,
                center: position.clone(),
                radius
            };
        }

        const footY = position.y - player.eyeHeight;
        const segmentMinY = footY + radius;
        const segmentMaxY = footY + Math.max(radius, player.height - radius);

        return {
            mode: PLAYER_COLLIDER_MODES.CAPSULE,
            start: new THREE.Vector3(position.x, segmentMinY, position.z),
            end: new THREE.Vector3(position.x, segmentMaxY, position.z),
            radius
        };
    }

    checkCollision(position, options = {}) {
        const player = { ...this.player, ...options.player };
        const includeFloorCollision = options.includeFloorCollision ?? false;
        const ignoredColliderIds = options.ignoredColliderIds ?? null;
        const colliders = this.queryColliders(position, player);

        const playerCollider = this.updatePlayerCollider(position, player);

        for (const collider of colliders) {
            if (!collider.enabled) continue;
            if (ignoredColliderIds?.has(collider.id)) continue;
            if (!includeFloorCollision && !collider.blocksMovement) continue;
            if (includeFloorCollision && !collider.blocksMovement && !collider.supportsPlayer) continue;

            const intersects = playerCollider.mode === PLAYER_COLLIDER_MODES.SPHERE
                ? intersectsSphereBox(playerCollider.center, playerCollider.radius, collider.box)
                : intersectsVerticalCapsuleBox(playerCollider.start, playerCollider.end, playerCollider.radius, collider.box);

            if (intersects) {
                return {
                    collided: true,
                    collider
                };
            }
        }

        return {
            collided: false,
            collider: null
        };
    }

    resolveMovement(currentPosition, movement, options = {}) {
        const player = { ...this.player, ...options.player };
        const includeY = options.includeY ?? Math.abs(movement.y) > 0;
        const allowSteps = options.allowSteps ?? false;
        const subStepSize = options.subStepSize ?? Math.max(0.05, player.radius * 0.5);
        const maxDistance = Math.max(Math.abs(movement.x), Math.abs(movement.y), Math.abs(movement.z));
        const steps = Math.max(1, Math.ceil(maxDistance / subStepSize));

        const result = {
            position: currentPosition.clone(),
            previousPosition: currentPosition.clone(),
            collided: false,
            collider: null,
            blockedAxes: { x: false, y: false, z: false },
            usedStep: false
        };

        _movementStep.copy(movement).divideScalar(steps);

        for (let i = 0; i < steps; i += 1) {
            result.previousPosition.copy(result.position);

            if (includeY && _movementStep.y !== 0) {
                const movedY = this.tryAxisMove(result.position, 'y', _movementStep.y, {
                    player,
                    includeFloorCollision: _movementStep.y < 0,
                    allowSteps: false
                });
                if (!movedY) {
                    result.collided = true;
                    result.blockedAxes.y = true;
                    if (this.lastCollision) result.collider = this.lastCollision.collider;
                }
            }

            if (_movementStep.x !== 0) {
                const movedX = this.tryAxisMove(result.position, 'x', _movementStep.x, {
                    player,
                    includeFloorCollision: false,
                    allowSteps
                });
                if (!movedX) {
                    result.collided = true;
                    result.blockedAxes.x = true;
                    if (this.lastCollision) result.collider = this.lastCollision.collider;
                } else if (movedX === 'step') {
                    result.usedStep = true;
                }
            }

            if (_movementStep.z !== 0) {
                const movedZ = this.tryAxisMove(result.position, 'z', _movementStep.z, {
                    player,
                    includeFloorCollision: false,
                    allowSteps
                });
                if (!movedZ) {
                    result.collided = true;
                    result.blockedAxes.z = true;
                    if (this.lastCollision) result.collider = this.lastCollision.collider;
                } else if (movedZ === 'step') {
                    result.usedStep = true;
                }
            }
        }

        if (!result.collided) {
            this.lastLoggedColliderId = null;
        }

        return result;
    }

    moveWithCollision(position, movement, options = {}) {
        return this.resolveMovement(position, movement, options).position;
    }

    detectFloor(position, options = {}) {
        const player = { ...this.player, ...options.player };
        const snapDistance = options.snapDistance ?? player.floorSnapDistance;
        const footY = position.y - player.eyeHeight;
        const radius = player.radius + player.skinWidth;
        let best = null;

        for (const collider of this.queryColliders(position, player)) {
            if (!collider.enabled || !collider.supportsPlayer) continue;

            const insideX = position.x >= collider.box.min.x - radius && position.x <= collider.box.max.x + radius;
            const insideZ = position.z >= collider.box.min.z - radius && position.z <= collider.box.max.z + radius;
            if (!insideX || !insideZ) continue;

            const floorY = collider.box.max.y;
            const gap = footY - floorY;
            if (gap < -player.maxStepHeight || gap > snapDistance) continue;

            if (!best || floorY > best.floorY) {
                best = {
                    collider,
                    floorY,
                    eyeY: floorY + player.eyeHeight,
                    gap
                };
            }
        }

        return best;
    }

    tryAxisMove(position, axis, delta, options) {
        _candidate.copy(position);
        _candidate[axis] += delta;

        const collision = this.checkCollision(_candidate, {
            player: options.player,
            includeFloorCollision: options.includeFloorCollision
        });

        if (!collision.collided) {
            position.copy(_candidate);
            this.lastCollision = null;
            return true;
        }

        this.lastCollision = collision;
        this.lastBlockedCollider = collision.collider;
        this.logCollisionBlock(collision.collider, axis, _candidate);

        if (options.allowSteps && axis !== 'y') {
            const stepped = this.tryStepMove(position, axis, delta, options.player);
            if (stepped) return 'step';
        }

        return false;
    }

    logCollisionBlock(collider, axis, attemptedPosition) {
        if (!this.logBlockedCollisions || !collider) return;

        const key = `${collider.id}:${axis}`;
        if (this.lastLoggedColliderId === key) return;
        this.lastLoggedColliderId = key;

        const size = collider.box.getSize(new THREE.Vector3());
        const center = collider.box.getCenter(new THREE.Vector3());
        const distanceToPlayer = distanceFromPointToBox(attemptedPosition, collider.box);
        console.warn('[Collision bloque]', {
            id: collider.id,
            type: collider.type,
            source: collider.source,
            axis,
            blocksMovement: collider.blocksMovement,
            size: {
                x: Number(size.x.toFixed(3)),
                y: Number(size.y.toFixed(3)),
                z: Number(size.z.toFixed(3))
            },
            center: {
                x: Number(center.x.toFixed(3)),
                y: Number(center.y.toFixed(3)),
                z: Number(center.z.toFixed(3))
            },
            min: {
                x: Number(collider.box.min.x.toFixed(3)),
                y: Number(collider.box.min.y.toFixed(3)),
                z: Number(collider.box.min.z.toFixed(3))
            },
            max: {
                x: Number(collider.box.max.x.toFixed(3)),
                y: Number(collider.box.max.y.toFixed(3)),
                z: Number(collider.box.max.z.toFixed(3))
            },
            distanceToPlayer: Number(distanceToPlayer.toFixed(3)),
            attemptedPosition: {
                x: Number(attemptedPosition.x.toFixed(3)),
                y: Number(attemptedPosition.y.toFixed(3)),
                z: Number(attemptedPosition.z.toFixed(3))
            },
            userData: collider.userData
        });
    }

    tryStepMove(position, axis, delta, player) {
        const stepHeight = player.maxStepHeight;
        if (stepHeight <= 0) return false;

        _candidate.copy(position);
        _candidate.y += stepHeight;

        if (this.checkCollision(_candidate, { player, includeFloorCollision: true }).collided) {
            return false;
        }

        _candidate[axis] += delta;
        if (this.checkCollision(_candidate, { player, includeFloorCollision: true }).collided) {
            return false;
        }

        const floor = this.detectFloor(_candidate, {
            player,
            snapDistance: stepHeight + player.floorSnapDistance
        });

        if (!floor) return false;
        if (floor.eyeY < position.y - 0.05 || floor.eyeY > position.y + stepHeight + 0.05) return false;

        _candidate.y = floor.eyeY;
        position.copy(_candidate);
        return true;
    }

    queryColliders(position, player = this.player) {
        if (!this.useSpatialIndex) return this.colliders;
        if (this.indexDirty) this.rebuildSpatialIndex();

        this.getPlayerBroadphaseBox(position, player, _broadphaseBox);

        const minX = Math.floor(_broadphaseBox.min.x / this.spatialCellSize);
        const maxX = Math.floor(_broadphaseBox.max.x / this.spatialCellSize);
        const minZ = Math.floor(_broadphaseBox.min.z / this.spatialCellSize);
        const maxZ = Math.floor(_broadphaseBox.max.z / this.spatialCellSize);
        const found = new Set();

        for (let x = minX; x <= maxX; x += 1) {
            for (let z = minZ; z <= maxZ; z += 1) {
                const bucket = this.spatialIndex.get(`${x}:${z}`);
                if (!bucket) continue;
                for (const collider of bucket) found.add(collider);
            }
        }

        for (const collider of this.dynamicColliders) found.add(collider);
        return found;
    }

    rebuildSpatialIndex() {
        this.spatialIndex.clear();

        for (const collider of this.colliders) {
            if (!collider.enabled || !collider.isStatic) continue;

            const minX = Math.floor(collider.box.min.x / this.spatialCellSize);
            const maxX = Math.floor(collider.box.max.x / this.spatialCellSize);
            const minZ = Math.floor(collider.box.min.z / this.spatialCellSize);
            const maxZ = Math.floor(collider.box.max.z / this.spatialCellSize);

            for (let x = minX; x <= maxX; x += 1) {
                for (let z = minZ; z <= maxZ; z += 1) {
                    const key = `${x}:${z}`;
                    if (!this.spatialIndex.has(key)) this.spatialIndex.set(key, []);
                    this.spatialIndex.get(key).push(collider);
                }
            }
        }

        this.indexDirty = false;
    }

    getPlayerBroadphaseBox(position, player, target) {
        const radius = player.radius + player.skinWidth + 0.05;

        if (player.mode === PLAYER_COLLIDER_MODES.SPHERE) {
            target.setFromCenterAndSize(
                position,
                _size.set(radius * 2, radius * 2, radius * 2)
            );
            return target;
        }

        const footY = position.y - player.eyeHeight;
        target.min.set(position.x - radius, footY, position.z - radius);
        target.max.set(position.x + radius, footY + player.height, position.z + radius);
        return target;
    }

    enableColliderDebug(enabled = true, scene = this.scene, playerObject = null) {
        this.debugEnabled = enabled;
        this.debugPlayerObject = playerObject;

        if (enabled && scene && !this.debugGroup.parent) {
            scene.add(this.debugGroup);
        }

        if (!enabled && this.debugGroup.parent) {
            this.debugGroup.parent.remove(this.debugGroup);
        }

        this.refreshDebugHelpers();
    }

    highlightLastBlockedCollider() {
        if (!this.lastBlockedCollider) return false;

        this.highlightedColliderId = this.lastBlockedCollider.id;
        if (!this.debugEnabled) {
            this.enableColliderDebug(true, this.scene, this.debugPlayerObject);
        } else {
            this.refreshDebugHelpers();
        }

        return true;
    }

    refreshDebugHelpers() {
        while (this.debugGroup.children.length > 0) {
            const helper = this.debugGroup.children.pop();
            helper.geometry?.dispose?.();
            helper.material?.map?.dispose?.();
            helper.material?.dispose?.();
        }
        this.playerDebugHelper = null;

        if (!this.debugEnabled) return;

        for (const collider of this.colliders) {
            const isHighlighted = collider.id === this.highlightedColliderId;
            const helperColor = isHighlighted
                ? 0xff0000
                : this.highlightedColliderId
                    ? 0xffcc00
                    : collider.blocksMovement ? 0xff2d20 : 0xffcc00;
            const helper = new THREE.Box3Helper(
                collider.box,
                helperColor
            );
            helper.name = `debug-${collider.id}`;
            helper.userData.colliderId = collider.id;
            helper.userData.colliderType = collider.type;
            helper.userData.label = `${collider.id} (${collider.type})`;
            this.debugGroup.add(helper);

            const center = collider.box.getCenter(new THREE.Vector3());
            center.y = collider.box.max.y + 0.18;
            const label = createColliderLabel(
                `${collider.id} / ${collider.type}`,
                center,
                isHighlighted ? '#ff0000' : collider.blocksMovement ? '#ff3b30' : '#ffcc00'
            );
            if (label) this.debugGroup.add(label);
        }

        this.playerDebugHelper = new THREE.Box3Helper(_playerDebugBox, 0x0a84ff);
        this.playerDebugHelper.name = 'debug-player-collider';
        this.debugGroup.add(this.playerDebugHelper);
        this.updatePlayerDebugHelper();
    }

    updatePlayerDebugHelper(position = this.debugPlayerObject?.position) {
        if (!this.debugEnabled || !this.playerDebugHelper || !position) return;

        this.getPlayerBroadphaseBox(position, this.player, _playerDebugBox);
        _playerDebugBox.getSize(_playerDebugSize);
        if (_playerDebugSize.lengthSq() === 0) return;
        this.playerDebugHelper.box.copy(_playerDebugBox);
    }
}

export function updatePlayerCollider(collisionSystem, position, playerOptions = {}) {
    return collisionSystem.updatePlayerCollider(position, playerOptions);
}

export function checkCollision(collisionSystem, position, options = {}) {
    return collisionSystem.checkCollision(position, options);
}

export function resolveMovement(collisionSystem, position, movement, options = {}) {
    return collisionSystem.resolveMovement(position, movement, options);
}

export function moveWithCollision(collisionSystem, position, movement, options = {}) {
    return collisionSystem.moveWithCollision(position, movement, options);
}

export function enableColliderDebug(collisionSystem, scene, enabled = true, playerObject = null) {
    collisionSystem.enableColliderDebug(enabled, scene, playerObject);
}
