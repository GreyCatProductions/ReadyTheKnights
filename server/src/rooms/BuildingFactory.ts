import { Building, GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { BUILDING_DEFS, BuildingType } from "../../../shared/BuildingDefs.js";
import { CELL_SIZE, worldToGrid } from "../../../shared/Constants.js";
import { tryAssignWorker } from "./WorkerSystem.js";

export function createBuilding(type: BuildingType, ownerId: string): Building {
    const def = BUILDING_DEFS[type];
    if (!def) throw new Error(`Unknown building type: ${type}`);

    const b = new Building();
    b.type    = type;
    b.ownerId = ownerId;
    b.posX    = CELL_SIZE / 2;
    b.posY    = CELL_SIZE / 2;
    b.populationMaxIncrease = def.populationMaxIncrease ?? 0;
    return b;
}

export function placeBuilding(node: GameNode, type: BuildingType, ownerId: string, state?: GameRoomState, nodeId?: string): Building {
    const b = createBuilding(type, ownerId);
    node.buildings.set(type, b);

    if (state && nodeId) {
        state.units.forEach((unit, id) => {
            if (unit.assignedBuilding || unit.ownerId !== ownerId) return;
            const { col, row } = worldToGrid(unit.posX, unit.posY);
            if (col === node.column && row === node.row)
                tryAssignWorker(state, id, nodeId);
        });
    }

    return b;
}
