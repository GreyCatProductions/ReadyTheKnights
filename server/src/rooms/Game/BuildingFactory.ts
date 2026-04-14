import { Building, GameRoomState } from "./schema/GameRoomState.js";
import { BUILDING_DEFS } from "../../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../../shared/Buildings.js";
import { CELL_SIZE} from "../../../../shared/Constants.js";
import { v4 as uuid } from "uuid";
import { clearWalkabilityCache } from "./Pathfinding.js";

export function createBuilding(type: BuildingType, ownerId: string): Building {
    const def = BUILDING_DEFS[type];
    if (!def) throw new Error(`Unknown building type: ${type}`);

    const b = new Building();
    b.type    = type;
    b.ownerId = ownerId;
    b.posX    = CELL_SIZE / 2;
    b.posY    = CELL_SIZE / 2;
    b.populationMaxIncrease = def.populationMaxIncrease ?? 0;
    b.resourcesNeeded.wood = def.woodCost ?? 0;
    b.resourcesNeeded.food = def.foodCost ?? 0;
    b.daysToBuild = def.daysToBuild ?? 1;

    return b;
}

export function placeBuilding(type: BuildingType, ownerId: string, state: GameRoomState, nodeId: string): Building {
    const node = state.nodes.get(nodeId)
    if(!node)
        return

    const b = createBuilding(type, ownerId);
    b.id = uuid();
    b.nodeId = nodeId;
    node.buildings.set(b.id, b);
    clearWalkabilityCache(nodeId);
    return b;
}
