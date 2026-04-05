import { Building, GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { BuildingDef, BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";
import { spawnWorker } from "./UnitFactory.js";
import { Edict, EDICT_BUILDINGS } from "../../../shared/Edicts.js";
import { placeBuilding } from "./BuildingFactory.js";
import { worldToGrid } from "../../../shared/Constants.js";
import { tryAssignWorker } from "./WorkerSystem.js";

export function tickNodes(state: GameRoomState) {
    state.map.nodes.forEach((node, nodeId) => {
        node.buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (!def) return;

            if (building.resourcesNeeded.wood > 0 || building.resourcesNeeded.food > 0) return;

            if (building.daysToBuild > 0) {
                building.daysToBuild--;
                if (building.daysToBuild === 0) {
                    state.workers.forEach((worker, workerId) => {
                        if (worker.ownerId !== building.ownerId || worker.assignedBuilding) return;
                        const { col, row } = worldToGrid(worker.posX, worker.posY);
                        if (col === node.column && row === node.row)
                            tryAssignWorker(state, workerId, nodeId);
                    });
                }
                return;
            }

            if (!def.spawnPerDay && !def.resourceType) return;
            if (def.spawnPerDay)  handleSpawn(building, def, node, nodeId, state);
            if (def.resourceType) handleResource(building, def, node, state);
        });

        if (node.edict) handleEdict(node, nodeId, state);
    });
}

export function fulfillDemand(building: Building, state: GameRoomState) {
    const player = state.players.get(building.ownerId);
    if (!player) return;

    if (building.resourcesNeeded.wood > 0) {
        const pay = Math.min(building.resourcesNeeded.wood, player.resources.wood);
        player.resources.wood      -= pay;
        building.resourcesNeeded.wood -= pay;
    }
    if (building.resourcesNeeded.food > 0) {
        const pay = Math.min(building.resourcesNeeded.food, player.resources.food);
        player.resources.food      -= pay;
        building.resourcesNeeded.food -= pay;
    }
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

    const troops = [...state.troops.values()].filter(u => u.ownerId === node.ownerId).length;
    const workers = [...state.workers.values()].filter(u => u.ownerId === node.ownerId).length;
    let counter = troops + workers;
    
    const maxPop = getMaxPopulation(node.ownerId, state);

    for (let i = 0; i < def.spawnPerDay; i++) {
        if(maxPop <= counter) return
        spawnWorker(state, node.ownerId, nodeId);
        counter++;
    }
}

function handleResource(b: Building, def: BuildingDef, node: GameNode, state: GameRoomState) {
    if (!def.resourceType || !def.resourcePerWorker) return;
    const player = state.players.get(b.ownerId);
    if (!player) return;
    const produced = b.workerCount * def.resourcePerWorker;
    if (def.resourceType === "wood") player.resources.wood += produced;
    if (def.resourceType === "food") player.resources.food += produced;
}

function handleEdict(node: GameNode, nodeId: string, state: GameRoomState) {
    const buildingType = EDICT_BUILDINGS[node.edict as Edict];
    if (!buildingType) return;
    if (node.buildings.has(buildingType)) return;

    placeBuilding(node, buildingType, node.ownerId, state, nodeId);
    console.log(`Built ${buildingType} on ${nodeId} from edict "${node.edict}"`);
}
