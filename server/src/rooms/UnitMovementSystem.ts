import { GameRoomState } from "./schema/GameRoomState.js";
import { CELL_SIZE, worldToGrid } from "../../../shared/Constants.js";
import { unassignWorker, tickWorker } from "./WorkerSystem.js";

const SPEED = 40; // pixels per second
const ARRIVAL_THRESHOLD = 4;
const MIN_WAIT_MS = 1000;
const MAX_WAIT_MS = 5000;

type Target = { x: number; y: number };
const targets        = new Map<string, Target>();
const waitUntil      = new Map<string, number>();
const lastPhysNodeId = new Map<string, string>();

function randomPointOnNode(col: number, row: number): Target {
    const margin = 16;
    return {
        x: col * CELL_SIZE + margin + Math.random() * (CELL_SIZE - margin * 2),
        y: row * CELL_SIZE + margin + Math.random() * (CELL_SIZE - margin * 2),
    };
}

function tickUnit(
    state: GameRoomState,
    unit: { posX: number; posY: number; nodeId: string },
    id: string,
    dt: number,
    isWorker: boolean,
) {
    const node = state.nodes.get(unit.nodeId);
    if (!node) return;

    if (!targets.has(id)) targets.set(id, randomPointOnNode(node.column, node.row));

    const target = targets.get(id)!;
    const dx = target.x - unit.posX;
    const dy = target.y - unit.posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ARRIVAL_THRESHOLD) {
        const now = Date.now();
        const wait = waitUntil.get(id);
        if (!wait) {
            waitUntil.set(id, now + MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS));
            return;
        }
        if (now < wait) return;
        waitUntil.delete(id);
        targets.set(id, randomPointOnNode(node.column, node.row));
        return;
    }

    unit.posX += (dx / dist) * SPEED * dt;
    unit.posY += (dy / dist) * SPEED * dt;

    const { col, row } = worldToGrid(unit.posX, unit.posY);
    const physNodeId = `${col},${row}`;
    const prevPhysNodeId = lastPhysNodeId.get(id);
    if (physNodeId !== prevPhysNodeId) {
        lastPhysNodeId.set(id, physNodeId);
        if (prevPhysNodeId !== undefined && isWorker) {
            unassignWorker(state, id);
            const worker = state.workers.get(id);
            if (worker) tickWorker(state, worker, id);
        }
    }
}

export function tickUnitMovement(state: GameRoomState, deltaMs: number) {
    const dt = deltaMs / 1000;
    state.troops.forEach((unit, id)  => tickUnit(state, unit, id, dt, false));
    state.workers.forEach((unit, id) => tickUnit(state, unit, id, dt, true));
}

export function removeUnitTarget(id: string, state?: GameRoomState) {
    targets.delete(id);
    waitUntil.delete(id);
    lastPhysNodeId.delete(id);
    if (state) unassignWorker(state, id);
}
