export const CELL_SIZE = 128+64;

export const BUILDING_OBSTACLE_RADIUS = 48;
export const TREE_OBSTACLE_RADIUS = 24;

export function worldToGrid(posX: number, posY: number): { col: number; row: number } {
    return {
        col: Math.floor(posX / CELL_SIZE),
        row: Math.floor(posY / CELL_SIZE),
    };
}