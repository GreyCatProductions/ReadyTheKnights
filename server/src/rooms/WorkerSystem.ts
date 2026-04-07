import { GameRoomState, Worker } from "./schema/GameRoomState.js";
import { BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";
import { worldToGrid } from "../../../shared/Constants.js";

let nodeAtPos: Map<string, string> | null = null;

export function getNodeAtPos(state: GameRoomState): Map<string, string> {
    if (!nodeAtPos) {
        nodeAtPos = new Map();
        state.map.nodes.forEach((node, id) => nodeAtPos!.set(`${node.column},${node.row}`, id));
    }
    return nodeAtPos;
}

export function tryAssignWorker(state: GameRoomState, workerId: string, nodeId: string) {
    const worker = state.workers.get(workerId);
    const node = state.map.nodes.get(nodeId);
    if (!worker || !node || worker.ownerId !== node.ownerId) return;

    for (const [buildingKey, building] of node.buildings) {
        const def = BUILDING_DEFS[building.type as BuildingType];
        if (!def?.maxWorkers || building.daysToBuild > 0) continue;

        if (building.workerCount < (def.maxWorkers as number)) {
            building.workerCount++;
            worker.assignedBuilding = buildingKey;
            return;
        }
    }
}

export function unassignWorker(state: GameRoomState, workerId: string) {
    const worker = state.workers.get(workerId);
    if (!worker || !worker.assignedBuilding) return;

    for (const node of state.map.nodes.values()) {
        const building = node.buildings.get(worker.assignedBuilding);
        if (building && building.ownerId === worker.ownerId) {
            building.workerCount = Math.max(0, building.workerCount - 1);
            break;
        }
    }

    worker.assignedBuilding = "";
}

function nodeHasOpenWork(node: ReturnType<GameRoomState["map"]["nodes"]["get"]>): boolean {
    if (!node) return false;
    for (const [, building] of node.buildings) {
        const def = BUILDING_DEFS[building.type as BuildingType];
        if (!def?.maxWorkers || building.daysToBuild > 0) continue;
        if (building.workerCount < (def.maxWorkers as number)) return true;
    }
    return false;
}

function bfsToWork(state: GameRoomState, startNodeId: string, ownerId: string, nodeAtPos: Map<string, string>): string | null {

    const visited = new Set<string>([startNodeId]);
    //nodeId, firstStepNodeId
    const queue: [string, string][] = [];

    // Seed BFS with direct neighbors of start
    const startNode = state.map.nodes.get(startNodeId);
    if (!startNode) return null;

    for (const nid of getNeighbors(startNode, nodeAtPos)) {
        const n = state.map.nodes.get(nid);
        if (!n || n.ownerId !== ownerId) continue;
        visited.add(nid);
        queue.push([nid, nid]);
    }

    while (queue.length > 0) {
        const [nodeId, firstStep] = queue.shift()!;
        const node = state.map.nodes.get(nodeId);
        if (!node || node.ownerId !== ownerId) continue;

        if (nodeHasOpenWork(node)) return firstStep;

        for (const nid of getNeighbors(node, nodeAtPos)) {
            if (visited.has(nid)) continue;
            const n = state.map.nodes.get(nid);
            if (!n || n.ownerId !== ownerId) continue;
            visited.add(nid);
            queue.push([nid, firstStep]);
        }
    }

    return null;
}

function getNeighbors(node: { column: number; row: number }, nodeAtPos: Map<string, string>): string[] {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const result: string[] = [];
    for (const [dc, dr] of dirs) {
        const nid = nodeAtPos.get(`${node.column + dc},${node.row + dr}`);
        if (nid) result.push(nid);
    }
    return result;
}

export function tickWorkers(state: GameRoomState) {
    const map = getNodeAtPos(state);
    state.workers.forEach((worker, workerId) => tickWorker(state, worker, workerId, map));
}

export function tickWorker(state: GameRoomState, worker: Worker, workerId: string, map: Map<string, string>) {
    if (worker.assignedBuilding) return;

    const { col, row } = worldToGrid(worker.posX, worker.posY);
    const currentNodeId = map.get(`${col},${row}`) ?? null;
    if (!currentNodeId) return;

    tryAssignWorker(state, workerId, currentNodeId);
    if (worker.assignedBuilding) return;

    const nextStep = bfsToWork(state, currentNodeId, worker.ownerId, map);
    if (nextStep) worker.nodeId = nextStep;
}
