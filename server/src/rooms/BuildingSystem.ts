import { Building, GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { BuildingDef, BUILDING_DEFS, EDICT_BUILDINGS, BuildingType } from "../../../shared/BuildingDefs.js";
import { spawnUnit } from "./UnitFactory.js";
import { Edict } from "../../../shared/Edicts.js";
import { placeBuilding } from "./BuildingFactory.js";
import { worldToGrid } from "../../../shared/Constants.js";
import { tryAssignWorker } from "./WorkerSystem.js";

export function tickNodes(state: GameRoomState) {
    state.map.nodes.forEach((node, nodeId) => {
        node.buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (!def) return;

            if (!node.edict) return;
            
            if (building.constructionDaysLeft > 0) {
                building.constructionDaysLeft--;
                if (building.constructionDaysLeft === 0) {
                    state.units.forEach((unit, unitId) => {
                        const { col, row } = worldToGrid(unit.posX, unit.posY);
                        if (col === node.column && row === node.row)
                            tryAssignWorker(state, unitId, nodeId);
                    });
                }
                return;
            }

            if (def.category === "spawn")    handleSpawn(building, def, node, nodeId, state);
            if (def.category === "resource") handleResource(building, def, node, state);
            if (def.category === "defense")  handleDefense(building, def, node, state);
        });

        if (node.edict) handleEdict(node, nodeId, state);
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
    if (def.resourceType === "food") player.food += produced;
}

function handleDefense(b: Building, def: BuildingDef, node: GameNode, state: GameRoomState) {
    // TODO: combat resolution
}

function handleEdict(node: GameNode, nodeId: string, state: GameRoomState) {
    const buildingType = EDICT_BUILDINGS[node.edict as Edict];
    if (!buildingType) return;
    if (node.buildings.has(buildingType)) return;

    placeBuilding(node, buildingType, node.ownerId, state, nodeId);
    console.log(`Built ${buildingType} on ${nodeId} from edict "${node.edict}"`);
}
