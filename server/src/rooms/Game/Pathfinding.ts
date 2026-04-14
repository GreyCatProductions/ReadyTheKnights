import { CELL_SIZE } from "../../../../shared/Constants.js";
import { getObstacles } from "./MapUtils.js";
import { GameNode } from "./schema/GameRoomState.js";

const GRID_N = 16;
const CELL_PX = CELL_SIZE / GRID_N;
const UNIT_CLEARANCE = 8;
const MAX_PATH_ATTEMPTS = 8;
const GRID_MARGIN = 2; // cells to exclude from random targets near node edge
const walkabilityCache = new Map<string, boolean[]>();

export function getRandomPath(
    node: GameNode,
    posX: number,
    posY: number,
): { x: number; y: number }[] {
    const grid = getWalkabilityGrid(node);
    const { gx: startGx, gy: startGy } = worldToCell(
        posX,
        posY,
        node.column,
        node.row,
    );

    const walkable: number[] = [];
    for (let gy = GRID_MARGIN; gy < GRID_N - GRID_MARGIN; gy++) {
        for (let gx = GRID_MARGIN; gx < GRID_N - GRID_MARGIN; gx++) {
            if (grid[gy * GRID_N + gx]) walkable.push(gy * GRID_N + gx);
        }
    }
    if (walkable.length === 0) return;

    for (let attempt = 0; attempt < MAX_PATH_ATTEMPTS; attempt++) {
        const targetIdx = walkable[Math.floor(Math.random() * walkable.length)];
        const endGx = targetIdx % GRID_N;
        const endGy = Math.floor(targetIdx / GRID_N);
        if (endGx === startGx && endGy === startGy) continue;

        const raw = astar(
            grid,
            startGx,
            startGy,
            endGx,
            endGy,
            node.column,
            node.row,
        );
        if (raw && raw.length > 0) {
            return smoothPath(raw, grid, node.column, node.row, posX, posY);
        }
    }
}

export function clearWalkabilityCache(nodeId: string): void {
    walkabilityCache.delete(nodeId);
}

// A* within a node toward a specific world target (clamped to this node's grid).
// Use this to navigate toward a node-boundary exit point.
export function getExitPath(
    node: GameNode,
    posX: number,
    posY: number,
    targetWorldX: number,
    targetWorldY: number,
): { x: number; y: number }[] | null {
    const grid = getWalkabilityGrid(node);
    const { gx: startGx, gy: startGy } = worldToCell(posX, posY, node.column, node.row);
    const { gx: endGx, gy: endGy } = worldToCell(targetWorldX, targetWorldY, node.column, node.row);

    if (startGx === endGx && startGy === endGy) return [];

    const raw = astar(grid, startGx, startGy, endGx, endGy, node.column, node.row);
    if (!raw || raw.length === 0) return raw ?? null;
    return smoothPath(raw, grid, node.column, node.row, posX, posY);
}

function astar(
    grid: boolean[],
    startGx: number,
    startGy: number,
    endGx: number,
    endGy: number,
    nodeCol: number,
    nodeRow: number,
): { x: number; y: number }[] | null {
    // If start blocked, find nearest walkable cell via BFS
    let sx = startGx,
        sy = startGy;
    if (!grid[sy * GRID_N + sx]) {
        const bfsQueue: [number, number][] = [[sx, sy]];
        const bfsVisited = new Uint8Array(GRID_N * GRID_N);
        bfsVisited[sy * GRID_N + sx] = 1;
        let found = false;
        outer: while (bfsQueue.length > 0) {
            const [cx, cy] = bfsQueue.shift()!;
            for (const [ddx, ddy] of [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
                [-1, -1],
                [1, -1],
                [-1, 1],
                [1, 1],
            ]) {
                const nx = cx + ddx,
                    ny = cy + ddy;
                if (nx < 0 || nx >= GRID_N || ny < 0 || ny >= GRID_N) continue;
                const ni = ny * GRID_N + nx;
                if (bfsVisited[ni]) continue;
                bfsVisited[ni] = 1;
                if (grid[ni]) {
                    sx = nx;
                    sy = ny;
                    found = true;
                    break outer;
                }
                bfsQueue.push([nx, ny]);
            }
        }
        if (!found) return null;
    }

    if (!grid[endGy * GRID_N + endGx]) return null;

    const gScore = new Float32Array(GRID_N * GRID_N).fill(Infinity);
    const cameFrom = new Int16Array(GRID_N * GRID_N).fill(-1);
    const closed = new Uint8Array(GRID_N * GRID_N);

    const startIdx = sy * GRID_N + sx;
    gScore[startIdx] = 0;

    const heuristic = (ax: number, ay: number) => {
        const dx = ax - endGx,
            dy = ay - endGy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const open: { idx: number; f: number }[] = [
        { idx: startIdx, f: heuristic(sx, sy) },
    ];

    const SQRT2 = Math.SQRT2;
    const DIRS: [number, number, number][] = [
        [-1, 0, 1],
        [1, 0, 1],
        [0, -1, 1],
        [0, 1, 1],
        [-1, -1, SQRT2],
        [1, -1, SQRT2],
        [-1, 1, SQRT2],
        [1, 1, SQRT2],
    ];

    while (open.length > 0) {
        let minF = Infinity,
            minI = 0;
        for (let i = 0; i < open.length; i++) {
            if (open[i].f < minF) {
                minF = open[i].f;
                minI = i;
            }
        }
        const { idx } = open[minI];
        open.splice(minI, 1);

        if (closed[idx]) continue;
        closed[idx] = 1;

        const cgx = idx % GRID_N,
            cgy = Math.floor(idx / GRID_N);

        if (cgx === endGx && cgy === endGy) {
            const waypoints: { x: number; y: number }[] = [];
            let cur = idx;
            while (cur !== -1) {
                const wx = cur % GRID_N,
                    wy = Math.floor(cur / GRID_N);
                waypoints.push(cellToWorld(wx, wy, nodeCol, nodeRow));
                cur = cameFrom[cur];
            }
            waypoints.reverse();
            waypoints.shift(); // drop start cell
            return waypoints;
        }

        for (const [ddx, ddy, cost] of DIRS) {
            const nx = cgx + ddx,
                ny = cgy + ddy;
            if (nx < 0 || nx >= GRID_N || ny < 0 || ny >= GRID_N) continue;
            const ni = ny * GRID_N + nx;
            if (!grid[ni] || closed[ni]) continue;

            // Prevent corner-cutting through diagonal gaps
            if (ddx !== 0 && ddy !== 0) {
                if (!grid[cgy * GRID_N + nx] || !grid[ny * GRID_N + cgx]) continue;
            }

            const tentG = gScore[idx] + cost;
            if (tentG < gScore[ni]) {
                gScore[ni] = tentG;
                cameFrom[ni] = idx;
                open.push({ idx: ni, f: tentG + heuristic(nx, ny) });
            }
        }
    }

    return null;
}

function bresenhamGridLOS(
    grid: boolean[],
    ax: number,
    ay: number,
    bx: number,
    by: number,
): boolean {
    let x = ax,
        y = ay;
    const dx = Math.abs(bx - ax),
        dy = Math.abs(by - ay);
    const sx = bx > ax ? 1 : -1,
        sy = by > ay ? 1 : -1;
    let err = dx - dy;
    while (true) {
        if (!grid[y * GRID_N + x]) return false;
        if (x === bx && y === by) return true;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

// removes not needed waypoints using los to increase smooth paths and less blocky
function smoothPath(
    path: { x: number; y: number }[],
    grid: boolean[],
    nodeCol: number,
    nodeRow: number,
    startX: number,
    startY: number,
): { x: number; y: number }[] {
    if (path.length <= 1) return path;

    const full = [{ x: startX, y: startY }, ...path];
    const result: { x: number; y: number }[] = [];

    let i = 0;
    while (i < full.length - 1) {
        let furthest = i + 1;
        for (let j = i + 2; j < full.length; j++) {
            const { gx: ax, gy: ay } = worldToCell(
                full[i].x,
                full[i].y,
                nodeCol,
                nodeRow,
            );
            const { gx: bx, gy: by } = worldToCell(
                full[j].x,
                full[j].y,
                nodeCol,
                nodeRow,
            );
            if (bresenhamGridLOS(grid, ax, ay, bx, by)) furthest = j;
            else break;
        }
        result.push(full[furthest]);
        i = furthest;
    }

    return result;
}

function worldToCell(
    worldX: number,
    worldY: number,
    nodeCol: number,
    nodeRow: number,
): { gx: number; gy: number } {
    const localX = worldX - nodeCol * CELL_SIZE;
    const localY = worldY - nodeRow * CELL_SIZE;
    return {
        gx: Math.max(0, Math.min(GRID_N - 1, Math.floor(localX / CELL_PX))),
        gy: Math.max(0, Math.min(GRID_N - 1, Math.floor(localY / CELL_PX))),
    };
}

function cellToWorld(
    gx: number,
    gy: number,
    nodeCol: number,
    nodeRow: number,
): { x: number; y: number } {
    return {
        x: nodeCol * CELL_SIZE + gx * CELL_PX + CELL_PX / 2,
        y: nodeRow * CELL_SIZE + gy * CELL_PX + CELL_PX / 2,
    };
}

function buildWalkabilityGrid(node: GameNode): boolean[] {
    const obstacles = getObstacles(node);
    const grid = new Array<boolean>(GRID_N * GRID_N).fill(true);
    for (let gy = 0; gy < GRID_N; gy++) {
        for (let gx = 0; gx < GRID_N; gx++) {
            const { x: wx, y: wy } = cellToWorld(gx, gy, node.column, node.row);
            for (const { x: ox, y: oy, radius } of obstacles) {
                const er = radius + UNIT_CLEARANCE;
                const dx = wx - ox,
                    dy = wy - oy;
                if (dx * dx + dy * dy < er * er) {
                    grid[gy * GRID_N + gx] = false;
                    break;
                }
            }
        }
    }
    return grid;
}

function getWalkabilityGrid(node: GameNode): boolean[] {
    let grid = walkabilityCache.get(node.id);
    if (!grid) {
        grid = buildWalkabilityGrid(node);
        walkabilityCache.set(node.id, grid);
    }
    return grid;
}
