import {
    CAMERA_EYE_HEIGHT,
    PLAYER_HEIGHT,
    PLAYER_RADIUS
} from '../config/playerSettings.js';

export const COLLIDER_TYPES = Object.freeze({
    WALL: 'wall',
    DOOR: 'door',
    BOUNDS: 'bounds',
    OBSTACLE: 'obstacle',
    TABLE: 'table',
    LARGE_OBSTACLE: 'largeObstacle',
    FLOOR: 'floor',
    CEILING: 'ceiling',
    STEP: 'step',
    STAIRS: 'stairs',
    DECORATIVE: 'decorative',
    SMALL_DECOR: 'smallDecor',
    HANGING_DECOR: 'hangingDecor',
    FLOOR_DECOR: 'floorDecor',
    TRIGGER: 'trigger'
});

export const BLOCKING_COLLIDER_TYPES = Object.freeze(new Set([
    COLLIDER_TYPES.WALL,
    COLLIDER_TYPES.DOOR,
    COLLIDER_TYPES.BOUNDS,
    COLLIDER_TYPES.CEILING,
    COLLIDER_TYPES.OBSTACLE,
    COLLIDER_TYPES.TABLE,
    COLLIDER_TYPES.LARGE_OBSTACLE,
    COLLIDER_TYPES.STAIRS
]));

export const PLAYER_COLLIDER_MODES = Object.freeze({
    SPHERE: 'sphere',
    CAPSULE: 'capsule'
});

export const DEFAULT_PLAYER_COLLIDER = Object.freeze({
    mode: PLAYER_COLLIDER_MODES.CAPSULE,
    radius: PLAYER_RADIUS,
    height: PLAYER_HEIGHT,
    eyeHeight: CAMERA_EYE_HEIGHT,
    skinWidth: 0.025,
    maxStepHeight: 0.35,
    floorSnapDistance: 0.18
});

export const DEFAULT_COLLIDER_COLOR = Object.freeze({
    [COLLIDER_TYPES.WALL]: 0xff3b30,
    [COLLIDER_TYPES.DOOR]: 0xff9500,
    [COLLIDER_TYPES.BOUNDS]: 0x5ac8fa,
    [COLLIDER_TYPES.OBSTACLE]: 0xffcc00,
    [COLLIDER_TYPES.TABLE]: 0xffcc00,
    [COLLIDER_TYPES.LARGE_OBSTACLE]: 0xffcc00,
    [COLLIDER_TYPES.FLOOR]: 0x34c759,
    [COLLIDER_TYPES.CEILING]: 0xff3b30,
    [COLLIDER_TYPES.STEP]: 0xaf52de,
    [COLLIDER_TYPES.STAIRS]: 0xaf52de,
    [COLLIDER_TYPES.DECORATIVE]: 0xffcc00,
    [COLLIDER_TYPES.SMALL_DECOR]: 0xffcc00,
    [COLLIDER_TYPES.HANGING_DECOR]: 0xffcc00,
    [COLLIDER_TYPES.FLOOR_DECOR]: 0xffcc00,
    [COLLIDER_TYPES.TRIGGER]: 0xffcc00
});
