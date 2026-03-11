import { Building, GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { BuildingDef, BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { spawnUnit } from "./UnitFactory.js";

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
        spawnUnit(state, node.ownerId, nodeId);
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
