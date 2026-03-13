import { Building, GameNode } from "./schema/GameRoomState.js";
import { BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { CELL_SIZE } from "../../../shared/Constants.js";

export function createBuilding(type: string, ownerId: string): Building {
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

export function placeBuilding(node: GameNode, type: string, ownerId: string): Building {
    const b = createBuilding(type, ownerId);
    node.buildings.set(type, b);
    return b;
}
