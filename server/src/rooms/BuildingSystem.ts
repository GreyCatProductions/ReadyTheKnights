import { Building, GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { BuildingDef, BUILDING_DEFS } from "../../../shared/BuildingDefs.js";
import { BuildingType } from "../../../shared/Buildings.js";
import { spawnUnit } from "./UnitFactory.js";
import { Edict, EDICT_BUILDINGS } from "../../../shared/Edicts.js";
import { placeBuilding } from "./BuildingFactory.js";
import { worldToGrid, CELL_SIZE } from "../../../shared/Constants.js";
import { tryAssignWorker } from "./WorkerSystem.js";

// Positions for decorative buildings, relative to node cell center
const DECO_OFFSETS = [
    { x:   0, y: -48 },
    { x:  46, y: -15 },
    { x:  28, y:  39 },
    { x: -28, y:  39 },
    { x: -46, y: -15 },
];

export function tickNodes(state: GameRoomState) {
    state.map.nodes.forEach((node, nodeId) => {
        const evolutionQueue: Array<{ key: string; building: Building; def: BuildingDef }> = [];

        node.buildings.forEach((building, key) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (!def || (!def.spawnPerDay && !def.resourceType && !def.evolution)) return;

            if (node.edict) {
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
            }

            if (def.spawnPerDay)  handleSpawn(building, def, node, nodeId, state);
            if (def.resourceType) handleResource(building, def, node, state);
            if (def.evolution)               evolutionQueue.push({ key, building, def });
        });

        for (const { key, building, def } of evolutionQueue) {
            handleEvolution(key, building, def, node);
        }

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

    const unitCount = [...state.units.values()].filter(u => u.ownerId === node.ownerId).length;
    let counter = unitCount;
    const maxPop = getMaxPopulation(node.ownerId, state);

    for (let i = 0; i < def.spawnPerDay; i++) {
        if(maxPop <= counter) return
        spawnUnit(state, node.ownerId, nodeId);
        counter++;
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


function handleEvolution(key: string, building: Building, def: BuildingDef, node: GameNode) {
    const { evolution } = def;
    if (!evolution) return;

    building.daysActive++;

    const decoIndex = building.daysActive - 1;
    if (decoIndex < DECO_OFFSETS.length) {
        const offset = DECO_OFFSETS[decoIndex];
        const deco = new Building();
        deco.type    = evolution.decorative;
        deco.ownerId = building.ownerId;
        deco.posX    = CELL_SIZE / 2 + offset.x;
        deco.posY    = CELL_SIZE / 2 + offset.y;
        node.buildings.set(`${key}_deco_${decoIndex}`, deco);
    }

    if (building.daysActive >= evolution.daysToEvolve) {
        for (let i = 0; i < DECO_OFFSETS.length; i++) {
            node.buildings.delete(`${key}_deco_${i}`);
        }

        const evolvedDef = BUILDING_DEFS[evolution.evolvesInto];
        building.type                  = evolution.evolvesInto;
        building.populationMaxIncrease = evolvedDef.populationMaxIncrease ?? 0;
        building.daysActive            = 0;

        console.log(`Building ${key} evolved into ${evolution.evolvesInto}`);
    }
}

function handleEdict(node: GameNode, nodeId: string, state: GameRoomState) {
    const buildingType = EDICT_BUILDINGS[node.edict as Edict];
    if (!buildingType) return;
    if (node.buildings.has(buildingType)) return;

    placeBuilding(node, buildingType, node.ownerId, state, nodeId);
    console.log(`Built ${buildingType} on ${nodeId} from edict "${node.edict}"`);
}
