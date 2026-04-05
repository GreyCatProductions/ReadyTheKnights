import { GameRoomState } from "./schema/GameRoomState.js";
import { BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";

export function tryAssignWorker(state: GameRoomState, unitId: string, nodeId: string) {
    const unit = state.units.get(unitId);
    const node = state.map.nodes.get(nodeId);
    if (!unit || !node || unit.ownerId !== node.ownerId) return;

    for (const [buildingKey, building] of node.buildings) {
        const def = BUILDING_DEFS[building.type as BuildingType];
        if (!def?.maxWorkers || building.daysToBuild > 0) continue;

        if (building.workerCount < (def.maxWorkers as number)) {
            building.workerCount++;
            unit.assignedBuilding = buildingKey;
            return;
        }
    }
}

export function unassignWorker(state: GameRoomState, unitId: string) {
    const unit = state.units.get(unitId);
    if (!unit || !unit.assignedBuilding) return;

    // Find the node the unit is currently on and decrement worker count
    for (const node of state.map.nodes.values()) {
        const building = node.buildings.get(unit.assignedBuilding);
        if (building && building.ownerId === unit.ownerId) {
            building.workerCount = Math.max(0, building.workerCount - 1);
            break;
        }
    }
    
    unit.assignedBuilding = "";
}
