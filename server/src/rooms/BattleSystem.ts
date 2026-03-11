import { GameRoomState, GameNode } from "./schema/GameRoomState.js";
import { removeUnitTarget } from "./UnitMovementSystem.js";
import { CELL_SIZE } from "../../../shared/Constants.js";

const COMBAT_INTERVAL_MS = 500;
const CAPTURE_TIME_MS = 5000;

let timeSinceLastCombat = 0;

// nodeId -> { contesterId, elapsed ms }
const captureProgress = new Map<string, { contesterId: string; elapsed: number }>();

/**
 * Makes a map to address nodes by their coordinates. 
 */
function buildNodePosMap(state: GameRoomState): Map<string, string> {
    const map = new Map<string, string>();
    state.map.nodes.forEach((node, id) => map.set(`${node.column},${node.row}`, id));
    return map;
}

/** Groups unit IDs by their physical node, then by owner.
 *  Result: nodeId → ownerId → unitId[] */
function buildUnitsByNode(state: GameRoomState, nodeAtPos: Map<string, string>): Map<string, Map<string, string[]>> {
    const unitsByNode = new Map<string, Map<string, string[]>>();

    state.units.forEach((unit, id) => {
        const col = Math.floor(unit.posX / CELL_SIZE);
        const row = Math.floor(unit.posY / CELL_SIZE);
        const nodeId = nodeAtPos.get(`${col},${row}`);
        if (!nodeId) return;

        if (!unitsByNode.has(nodeId)) unitsByNode.set(nodeId, new Map());
        const byOwner = unitsByNode.get(nodeId)!;

        if (!byOwner.has(unit.ownerId)) byOwner.set(unit.ownerId, []);
        byOwner.get(unit.ownerId)!.push(id);
    });

    return unitsByNode;
}

function clearCaptureState(nodeId: string, node: GameNode) {
    captureProgress.delete(nodeId);
    node.contestedBy = "";
    node.captureProgress = 0;
}

function tickCapture(state: GameRoomState, unitsByNode: Map<string, Map<string, string[]>>, deltaMs: number) {
    unitsByNode.forEach((byOwner, nodeId) => {
        const node = state.map.nodes.get(nodeId);
        if (!node) return;

        // Multiple players present
        if (byOwner.size !== 1) {
            clearCaptureState(nodeId, node);
            return;
        }

        const [ownerId] = byOwner.keys();

        // Already owned by this player
        if (node.ownerId === ownerId) {
            clearCaptureState(nodeId, node);
            return;
        }

        // Advance or start capture progress
        const progress = captureProgress.get(nodeId);
        if (progress && progress.contesterId === ownerId) {
            progress.elapsed += deltaMs;
            node.contestedBy = ownerId;
            node.captureProgress = Math.min(progress.elapsed / CAPTURE_TIME_MS, 1);

            if (progress.elapsed >= CAPTURE_TIME_MS) {
                node.ownerId = ownerId;
                clearCaptureState(nodeId, node);
                console.log(`${nodeId} captured by ${ownerId}`);
            }
        } else {
            // New or different contester
            captureProgress.set(nodeId, { contesterId: ownerId, elapsed: deltaMs });
            node.contestedBy = ownerId;
            node.captureProgress = 0;
        }
    });

    // Clear progress for nodes where no contester
    for (const [nodeId, prog] of captureProgress) {
        const byOwner = unitsByNode.get(nodeId);
        if (!byOwner?.has(prog.contesterId)) {
            const node = state.map.nodes.get(nodeId);
            if (node) clearCaptureState(nodeId, node);
            else captureProgress.delete(nodeId);
        }
    }
}

function tickCombat(state: GameRoomState, unitsByNode: Map<string, Map<string, string[]>>, nodeAtPos: Map<string, string>) {
    unitsByNode.forEach((byOwner, nodeId) => {
        if (byOwner.size <= 1) return;

        // Kill one unit per side simultaneously
        for (const unitIds of byOwner.values()) {
            const id = unitIds[unitIds.length - 1];
            removeUnitTarget(id);
            state.units.delete(id);
        }
    });
}

export function tickBattles(state: GameRoomState, deltaMs: number) {
    const nodeAtPos = buildNodePosMap(state);
    const unitsByNode = buildUnitsByNode(state, nodeAtPos);

    tickCapture(state, unitsByNode, deltaMs);

    timeSinceLastCombat += deltaMs;
    if (timeSinceLastCombat >= COMBAT_INTERVAL_MS) {
        timeSinceLastCombat -= COMBAT_INTERVAL_MS;
        tickCombat(state, unitsByNode, nodeAtPos);
    }
}
