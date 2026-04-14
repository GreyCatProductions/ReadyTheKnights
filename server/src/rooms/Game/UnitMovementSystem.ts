import { GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { CELL_SIZE, worldToGrid } from "../../../../shared/Constants.js";
import { unassignWorker, tickWorker } from "./WorkerSystem.js";
import { getRandomPath, getExitPath } from "./Pathfinding.js";

const SPEED = 40; // pixels per second
const ARRIVAL_THRESHOLD = 4;
const MIN_WAIT_MS = 1000;
const MAX_WAIT_MS = 5000;

const paths = new Map<string, { x: number; y: number }[]>();
const waitUntil = new Map<string, number>();
const lastPhysNodeId = new Map<string, string>();
const macroPaths = new Map<string, string[]>();

function handleArrival(id: string, node: GameNode, fromX: number, fromY: number): boolean {
    const now = Date.now();
    const wait = waitUntil.get(id);
    if (!wait) {
        waitUntil.set(id, now + MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS));
        return true;
    }
    if (now < wait) return true;
    waitUntil.delete(id);
    paths.set(id, getRandomPath(node, fromX, fromY));
    return false;
}

function handleNodeChange(state: GameRoomState, unit: { posX: number; posY: number }, id: string, isWorker: boolean): void {
    const { col, row } = worldToGrid(unit.posX, unit.posY);
    const physNodeId = `${col},${row}`;
    const prevPhysNodeId = lastPhysNodeId.get(id);
    if (physNodeId === prevPhysNodeId) return;

    lastPhysNodeId.set(id, physNodeId);

    // Advance macro path when the unit physically enters the expected next node
    const macroPath = macroPaths.get(id);
    if (macroPath && macroPath.length > 0) {
        const nextNode = state.nodes.get(macroPath[0]);
        if (nextNode && nextNode.column === col && nextNode.row === row) {
            macroPath.shift();
            paths.delete(id); // force recalculation of exit path for new node
            if (macroPath.length === 0) macroPaths.delete(id);
        }
    }

    if (prevPhysNodeId !== undefined && isWorker) {
        unassignWorker(state, id);
        const worker = state.workers.get(id);
        if (worker) tickWorker(state, worker, id);
    }
}

function getNodeIdAtGrid(state: GameRoomState, col: number, row: number): string | undefined {
    let result: string | undefined;
    state.nodes.forEach((node, id) => {
        if (node.column === col && node.row === row) result = id;
    });
    return result;
}

// Node-level A*: returns the sequence of nodeIds from fromNode (exclusive) to toNode (inclusive).
function getNodePath(state: GameRoomState, fromNodeId: string, toNodeId: string): string[] | null {
    if (fromNodeId === toNodeId) return [];

    const fromNode = state.nodes.get(fromNodeId);
    const toNode = state.nodes.get(toNodeId);
    if (!fromNode || !toNode) return null;

    const posToId = new Map<string, string>();
    state.nodes.forEach((node, id) => posToId.set(`${node.column},${node.row}`, id));

    const targetCol = toNode.column;
    const targetRow = toNode.row;
    const heuristic = (node: GameNode) =>
        Math.abs(node.column - targetCol) + Math.abs(node.row - targetRow);

    const gScore = new Map<string, number>([[fromNodeId, 0]]);
    const cameFrom = new Map<string, string>();
    const open: { id: string; f: number }[] = [{ id: fromNodeId, f: heuristic(fromNode) }];

    while (open.length > 0) {
        let minI = 0;
        for (let i = 1; i < open.length; i++) {
            if (open[i].f < open[minI].f) minI = i;
        }
        const { id: curId } = open[minI];
        open.splice(minI, 1);

        if (curId === toNodeId) {
            const path: string[] = [];
            let cur = toNodeId;
            while (cur !== fromNodeId) {
                path.push(cur);
                cur = cameFrom.get(cur)!;
            }
            path.reverse();
            return path;
        }

        const curNode = state.nodes.get(curId)!;
        const g = gScore.get(curId)!;

        for (const [dc, dr] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const neighborId = posToId.get(`${curNode.column + dc},${curNode.row + dr}`);
            if (!neighborId) continue;

            const tentG = g + 1;
            if (tentG < (gScore.get(neighborId) ?? Infinity)) {
                gScore.set(neighborId, tentG);
                cameFrom.set(neighborId, curId);
                const neighborNode = state.nodes.get(neighborId)!;
                open.push({ id: neighborId, f: tentG + heuristic(neighborNode) });
            }
        }
    }

    return null;
}

function tickUnit(
    state: GameRoomState,
    unit: { posX: number; posY: number; nodeId: string },
    id: string,
    dt: number,
    isWorker: boolean,
) {
    const targetNode = state.nodes.get(unit.nodeId);
    if (!targetNode) return;

    const macroPath = macroPaths.get(id);

    if (macroPath && macroPath.length > 0) {
        // Cross-node traversal: navigate toward the exit of the current physical node.
        const nextNode = state.nodes.get(macroPath[0]);
        if (!nextNode) {
            macroPaths.delete(id);
            return;
        }

        if (!paths.has(id)) {
            const { col, row } = worldToGrid(unit.posX, unit.posY);
            let currentNode: GameNode | undefined;
            state.nodes.forEach(node => {
                if (node.column === col && node.row === row) currentNode = node;
            });
            if (!currentNode) return;

            // Aim for the center of the next node; worldToCell clamps it to the
            // current node's boundary, giving us the correct exit cell.
            const targetX = nextNode.column * CELL_SIZE + CELL_SIZE / 2;
            const targetY = nextNode.row * CELL_SIZE + CELL_SIZE / 2;
            const exitPath = getExitPath(currentNode, unit.posX, unit.posY, targetX, targetY);
            if (exitPath && exitPath.length > 0) paths.set(id, exitPath);
        }

        const path = paths.get(id);
        if (!path || path.length === 0) {
            paths.delete(id);
            // Already at the node edge — move straight toward next node center
            // so handleNodeChange can fire and advance the macro path.
            const targetX = nextNode.column * CELL_SIZE + CELL_SIZE / 2;
            const targetY = nextNode.row * CELL_SIZE + CELL_SIZE / 2;
            const dx = targetX - unit.posX;
            const dy = targetY - unit.posY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > ARRIVAL_THRESHOLD) {
                unit.posX += (dx / dist) * SPEED * dt;
                unit.posY += (dy / dist) * SPEED * dt;
                handleNodeChange(state, unit, id, isWorker);
            }
            return;
        }

        const wp = path[0];
        const dx = wp.x - unit.posX;
        const dy = wp.y - unit.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ARRIVAL_THRESHOLD) {
            path.shift();
            if (path.length === 0) paths.delete(id);
            return;
        }

        unit.posX += (dx / dist) * SPEED * dt;
        unit.posY += (dy / dist) * SPEED * dt;
        handleNodeChange(state, unit, id, isWorker);
        return;
    }

    // Normal random walk within the target node.
    if (!paths.has(id) && !waitUntil.has(id)) {
        paths.set(id, getRandomPath(targetNode, unit.posX, unit.posY));
    }

    const path = paths.get(id);
    if (!path || path.length === 0) {
        paths.delete(id);
        handleArrival(id, targetNode, unit.posX, unit.posY);
        return;
    }

    const wp = path[0];
    const dx = wp.x - unit.posX;
    const dy = wp.y - unit.posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ARRIVAL_THRESHOLD) {
        path.shift();
        if (path.length === 0) {
            paths.delete(id);
            handleArrival(id, targetNode, unit.posX, unit.posY);
        }
        return;
    }

    unit.posX += (dx / dist) * SPEED * dt;
    unit.posY += (dy / dist) * SPEED * dt;
    handleNodeChange(state, unit, id, isWorker);
}

export function tickUnitMovement(state: GameRoomState, deltaMs: number) {
    const dt = deltaMs / 1000;
    state.troops.forEach((unit, id) => tickUnit(state, unit, id, dt, false));
    state.workers.forEach((unit, id) => tickUnit(state, unit, id, dt, true));
}

// Call this instead of setting unit.nodeId directly when moving a unit to a new node.
// Computes the node-level A* path and stores it so the unit traverses intermediate nodes.
export function setUnitMacroPath(state: GameRoomState, id: string, toNodeId: string): void {
    const unit = state.troops.get(id) ?? state.workers.get(id);
    if (!unit) return;

    paths.delete(id);
    waitUntil.delete(id);
    macroPaths.delete(id);

    unit.nodeId = toNodeId;

    const { col, row } = worldToGrid(unit.posX, unit.posY);
    const fromNodeId = getNodeIdAtGrid(state, col, row);
    if (!fromNodeId || fromNodeId === toNodeId) return;

    const path = getNodePath(state, fromNodeId, toNodeId);
    if (path && path.length > 0) macroPaths.set(id, path);
}

export function removeUnitTarget(id: string, state?: GameRoomState) {
    paths.delete(id);
    waitUntil.delete(id);
    lastPhysNodeId.delete(id);
    macroPaths.delete(id);
    if (state) unassignWorker(state, id);
}
