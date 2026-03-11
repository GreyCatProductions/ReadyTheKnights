export const CELL_SIZE = 128;

export function worldToGrid(posX: number, posY: number): { col: number; row: number } {
    return {
        col: Math.floor(posX / CELL_SIZE),
        row: Math.floor(posY / CELL_SIZE),
    };
}