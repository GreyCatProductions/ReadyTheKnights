import { GameRoomState } from "./schema/GameRoomState.js";
import { BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";

export function tryAssignWorker(state: GameRoomState, unitId: string, nodeId: string) {
    const worker = state.workers.get(unitId);
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

export function unassignWorker(state: GameRoomState, unitId: string) {
    const worker = state.workers.get(unitId);
    if (!worker || !worker.assignedBuilding) return;

    // Find the node the unit is currently on and decrement worker count
    for (const node of state.map.nodes.values()) {
        const building = node.buildings.get(worker.assignedBuilding);
        if (building && building.ownerId === worker.ownerId) {
            building.workerCount = Math.max(0, building.workerCount - 1);
            break;
        }
    }
    
    worker.assignedBuilding = "";
}
