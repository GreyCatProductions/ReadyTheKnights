import { Building, GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { BuildingDef, BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";
import { spawnUnit } from "./UnitFactory.js";

export function processBuildings(state: GameRoomState) {
    state.map.nodes.forEach((node, nodeId) => {
        node.buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (!def) return;

            if (def.category === "spawn")    handleSpawn(building, def, node, nodeId, state);
            if (def.category === "resource") handleResource(building, def, node, state);
            if (def.category === "defense")  handleDefense(building, def, node, state);
        });
    });
}

function getMaxPopulation(ownerId: string, state: GameRoomState): number {
    let max = 0;
    state.map.nodes.forEach(node => {
        node.buildings.forEach(b => {
            if (b.ownerId === ownerId) max += b.populationMaxIncrease ?? 0;
        });
    });
    return max;
}

function handleSpawn(b: Building, def: BuildingDef, node: GameNode, nodeId: string, state: GameRoomState) {
    if (!def.spawnPerDay) return;
    const player = state.players.get(node.ownerId);
    if (!player) return;
    const maxPop = getMaxPopulation(node.ownerId, state);
    for (let i = 0; i < def.spawnPerDay; i++) {
        if (player.population >= maxPop) break;
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
