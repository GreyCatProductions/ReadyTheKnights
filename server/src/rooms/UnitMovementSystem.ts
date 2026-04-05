import { GameRoomState } from "./schema/GameRoomState.js";
import { CELL_SIZE, worldToGrid } from "../../../shared/Constants.js";
import { tryAssignWorker, unassignWorker } from "./WorkerSystem.js";

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

export function tickUnitMovement(state: GameRoomState, deltaMs: number) {
    const dt = deltaMs / 1000;

    state.workers.forEach((unit, id) => {
        const node = state.map.nodes.get(unit.nodeId);
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

        // Detect node crossing
        const { col, row } = worldToGrid(unit.posX, unit.posY);
        const physNodeId = `${col},${row}`;
        const prevPhysNodeId = lastPhysNodeId.get(id);
        if (physNodeId !== prevPhysNodeId) {
            lastPhysNodeId.set(id, physNodeId);
            if (prevPhysNodeId !== undefined) {
                unassignWorker(state, id);
                // Find nodeId for the new physical position
                for (const [nid, n] of state.map.nodes) {
                    if (n.column === col && n.row === row) {
                        tryAssignWorker(state, id, nid);
                        break;
                    }
                }
            }
        }
    });
}

export function removeUnitTarget(id: string, state?: GameRoomState) {
    targets.delete(id);
    waitUntil.delete(id);
    lastPhysNodeId.delete(id);
    if (state) unassignWorker(state, id);
}
