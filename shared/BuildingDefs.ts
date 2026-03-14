import { Edict } from "./Edicts.js";
import { BuildingType } from "./Buildings.js"

export type BuildingDef = {
    category: "spawn" | "resource" | "defense";
    spawnPerDay?: number;
    resourceType?: "wood" | null;
    resourcePerWorker?: number | null;
    workersNeeded?: Number | null;
    populationMaxIncrease?: number | null;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { category: "spawn", spawnPerDay: 1, resourceType: null, populationMaxIncrease: 10, resourcePerWorker: null },
    [BuildingType.LumberMill]: { category: "resource", spawnPerDay: 0, resourceType: "wood", populationMaxIncrease: 0, resourcePerWorker: 2, workersNeeded: 2 },
    [BuildingType.Houses]: { category: "spawn", spawnPerDay: 1, resourceType: null, populationMaxIncrease: 5, resourcePerWorker: null },
};

export const EDICT_BUILDINGS: Record<Edict, BuildingType> = {
    [Edict.HarvestEdict]: BuildingType.LumberMill,
    [Edict.LumberEdict]: BuildingType.LumberMill,
    [Edict.SettleEdict]: BuildingType.Houses,
};
