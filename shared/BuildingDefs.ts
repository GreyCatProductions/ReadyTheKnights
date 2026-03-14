import { Edict } from "./Edicts.js";
import { BuildingType } from "./Buildings.js"

export type BuildingDef = {
    category: "spawn" | "resource" | "defense";
    spawnPerDay?: number;
    resourceType?: "wood" | "wheat" | null;
    resourcePerWorker?: number | null;
    maxWorkers?: Number | null;
    populationMaxIncrease?: number | null;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { category: "spawn", spawnPerDay: 1, resourceType: null, populationMaxIncrease: 10, resourcePerWorker: null },
    [BuildingType.Windmill]: { category: "resource", spawnPerDay: 0, resourceType: "wheat", populationMaxIncrease: 0, resourcePerWorker: 1, maxWorkers: 3 },
    [BuildingType.Houses]: { category: "spawn", spawnPerDay: 1, resourceType: null, populationMaxIncrease: 5, resourcePerWorker: null },
};

export const EDICT_BUILDINGS: Record<Edict, BuildingType> = {
    [Edict.HarvestEdict]: BuildingType.Windmill,
    [Edict.LumberEdict]: BuildingType.Windmill,
    [Edict.SettleEdict]: BuildingType.Houses,
};
