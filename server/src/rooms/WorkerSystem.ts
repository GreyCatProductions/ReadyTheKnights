import { GameNode, GameRoomState, Worker } from "./schema/GameRoomState.js";
import { BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";
import { worldToGrid } from "../../../shared/Constants.js";

let nodeAtPos: Map<string, string> | null = null;

export function getNodeAtPos(state: GameRoomState): Map<string, string> {
    if (!nodeAtPos) {
        nodeAtPos = new Map();
        state.nodes.forEach((node, id) => nodeAtPos!.set(`${node.column},${node.row}`, id));
    }
    return nodeAtPos;
}

export function tryAssignWorker(state: GameRoomState, workerId: string, nodeId: string) {
    const worker = state.workers.get(workerId);
    const node = state.nodes.get(nodeId);
    if (!worker || !node || worker.ownerId !== node.ownerId) return;
    if (worker.assignedBuildingId) return;

    for (const [buildingKey, building] of node.buildings) {
        const def = BUILDING_DEFS[building.type as BuildingType];
        if (!def?.maxWorkers || building.daysToBuild > 0) continue;

        if (building.workerCount < (def.maxWorkers as number)) {
            building.workerCount++;
            worker.assignedBuildingId= buildingKey;
            return;
        }
    }
}

export function unassignWorker(state: GameRoomState, workerId: string) {
    const worker = state.workers.get(workerId);
    if (!worker || !worker.assignedBuildingId) return;

    for (const node of state.nodes.values()) {
        const building = node.buildings.get(worker.assignedBuildingId);
        if (building && building.ownerId === worker.ownerId) {
            building.workerCount = Math.max(0, building.workerCount - 1);
            break;
        }
    }

    worker.assignedBuildingId= "";
}

function findOpenBuildingKey(node: ReturnType<GameRoomState["nodes"]["get"]>): string | null {
    if (!node) return null;
    for (const [key, building] of node.buildings) {
        const def = BUILDING_DEFS[building.type as BuildingType];
        if (!def?.maxWorkers || building.daysToBuild > 0) continue;
        if (building.workerCount < (def.maxWorkers as number)) return key;
    }
    return null;
}

function bfsToWork(
    state: GameRoomState,
    startNodeId: string,
    ownerId: string,
    map: Map<string, string>,
): { nextStep: string; targetNodeId: string } | null {
    const visited = new Set<string>([startNodeId]);
    const queue: [string, string][] = []; // [nodeId, firstStep]

    const startNode = state.nodes.get(startNodeId);
    if (!startNode) return null;

    for (const nid of getNeighbors(startNode, map)) {
        const n = state.nodes.get(nid);
        if (!n || n.ownerId !== ownerId) continue;
        visited.add(nid);
        queue.push([nid, nid]);
    }

    while (queue.length > 0) {
        const [nodeId, firstStep] = queue.shift()!;
        const node = state.nodes.get(nodeId);
        if (!node || node.ownerId !== ownerId) continue;

        if (findOpenBuildingKey(node)) return { nextStep: firstStep, targetNodeId: nodeId };

        for (const nid of getNeighbors(node, map)) {
            if (visited.has(nid)) continue;
            const n = state.nodes.get(nid);
            if (!n || n.ownerId !== ownerId) continue;
            visited.add(nid);
            queue.push([nid, firstStep]);
        }
    }

    return null;
}

/** BFS to a specific target node. Returns the first step nodeId, or null if unreachable. */
function bfsStep(state: GameRoomState, fromNodeId: string, toNodeId: string, map: Map<string, string>): string | null {
    if (fromNodeId === toNodeId) return null;
    const visited = new Set<string>([fromNodeId]);
    const queue: [string, string][] = [];
    const startNode = state.nodes.get(fromNodeId);
    if (!startNode) return null;
    for (const nid of getNeighbors(startNode, map)) {
        if (!visited.has(nid)) { visited.add(nid); queue.push([nid, nid]); }
    }
    while (queue.length > 0) {
        const [nodeId, firstStep] = queue.shift()!;
        if (nodeId === toNodeId) return firstStep;
        const node = state.nodes.get(nodeId);
        if (!node) continue;
        for (const nid of getNeighbors(node, map)) {
            if (!visited.has(nid)) { visited.add(nid); queue.push([nid, firstStep]); }
        }
    }
    return null;
}

function getNeighbors(node: { column: number; row: number }, map: Map<string, string>): string[] {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const result: string[] = [];
    for (const [dc, dr] of dirs) {
        const nid = map.get(`${node.column + dc},${node.row + dr}`);
        if (nid) result.push(nid);
    }
    return result;
}

export function tickWorkers(state: GameRoomState) {
    state.workers.forEach((worker, workerId) => tickWorker(state, worker, workerId));
}

export function tickWorker(state: GameRoomState, worker: Worker, workerId: string) {
    if (worker.assignedBuildingId) {
        let buildingNodeId: string | null = null;
        state.nodes.forEach((node, nodeId) => {
            if (node.buildings.has(worker.assignedBuildingId)) buildingNodeId = nodeId;
        });

        if (!buildingNodeId) return;

        if (worker.nodeId !== buildingNodeId) {
            const map = getNodeAtPos(state);
            const { col, row } = worldToGrid(worker.posX, worker.posY);
            const currentNodeId = map.get(`${col},${row}`);
            if (currentNodeId) {
                const result = bfsStep(state, currentNodeId, buildingNodeId, map);
                if (result) worker.nodeId = result;
            }
        }
        return;
    }

    const map = getNodeAtPos(state);
    const { col, row } = worldToGrid(worker.posX, worker.posY);
    const currentNodeId = map.get(`${col},${row}`) ?? null;
    if (!currentNodeId) return;

    // Try current node first
    tryAssignWorker(state, workerId, currentNodeId);
    if (worker.assignedBuildingId) return;

    // BFS to nearest node with an open slot — claim it immediately
    const result = bfsToWork(state, currentNodeId, worker.ownerId, map);
    if (result) {
        worker.nodeId = result.nextStep;
        tryAssignWorker(state, workerId, result.targetNodeId);
    }
}
