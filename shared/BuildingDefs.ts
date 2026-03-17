import { Edict } from "./Edicts.js";

export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export const BuildingType = {
    Base:       "base",
    Windmill: "windmill",
    Houses:     "houses",
    Lumber_yard: "lumber_yard"
} as const;

export type BuildingDef = {
    category: "spawn" | "resource" | "defense";
    daysToBuild: number;
    spawnPerDay?: number;
    resourceType?: "wood" | "food" | null;
    resourcePerWorker?: number | null;
    maxWorkers?: Number | null;
    populationMaxIncrease?: number | null;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { category: "spawn", daysToBuild: 0, spawnPerDay: 1, resourceType: null, populationMaxIncrease: 10, resourcePerWorker: null },
    [BuildingType.Windmill]: { category: "resource", daysToBuild: 3, resourceType: "food", resourcePerWorker: 1, maxWorkers: 3 },
    [BuildingType.Houses]: { category: "spawn", daysToBuild: 3, spawnPerDay: 1, resourceType: null, populationMaxIncrease: 5, resourcePerWorker: null },
    [BuildingType.Lumber_yard]: { category: "resource", daysToBuild: 3, resourceType: "wood", resourcePerWorker: 1, maxWorkers: 2 },
};

export const EDICT_BUILDINGS: Record<Edict, BuildingType> = {
    [Edict.HarvestEdict]: BuildingType.Windmill,
    [Edict.LumberEdict]: BuildingType.Lumber_yard,
    [Edict.SettleEdict]: BuildingType.Houses,
};
