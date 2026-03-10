import { Building, GameNode, GameRoomState, Unit } from "./schema/GameRoomState.js";
import { BuildingDef, BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { v4 as uuid } from "uuid"
import { CELL_SIZE } from "../../../shared/Constants.js"

export function processBuildings(state: GameRoomState) {
    state.map.nodes.forEach((node, nodeId) => {
        node.buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type];
            if (!def) return;

            if (def.category === "spawn")    handleSpawn(building, def, node, nodeId, state);
            if (def.category === "resource") handleResource(building, def, node, state);
            if (def.category === "defense")  handleDefense(building, def, node, state);
        });
    });
}

function handleSpawn(b: Building, def: BuildingDef, node: GameNode, nodeId: string, state: GameRoomState) {
    if (!def.spawnPerDay) return;
    for (let i = 0; i < def.spawnPerDay; i++) {
        const unit = new Unit();
        unit.ownerId = node.ownerId;
        unit.nodeId = nodeId;
        unit.posX = node.column * CELL_SIZE + CELL_SIZE / 2;
        unit.posY = node.row    * CELL_SIZE + CELL_SIZE / 2;
        console.log("Spawned unit at " + unit.posX + " | " + unit.posY);
        state.units.set(uuid(), unit);
    }
}

function handleResource(b: Building, def: BuildingDef, node: GameNode, state: GameRoomState) {
    if (!def.resourceType || !def.resourcePerWorker) return;
    const player = state.players.get(b.ownerId);
    if (!player) return;
    const produced = b.workerCount * def.resourcePerWorker;
    if (def.resourceType === "wood") player.wood += produced;
}

function handleDefense(b: Building, def: BuildingDef, node: GameNode, state: GameRoomState) {
    // TODO: combat resolution
}
