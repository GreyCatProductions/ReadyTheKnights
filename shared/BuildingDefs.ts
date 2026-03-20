import { Edict } from "./Edicts.js";

export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export const BuildingType = {
    Base: "base",
    Windmill1: "windmill",
    Windmill2: "windmill_evolved",
    Windmill1Deco: "windmill_deco",
    Houses: "houses",
    HousesEvolved: "houses_evolved",
    HousesDeco: "houses_deco",
    Lumber_yard: "lumber_yard",
    LumberYardEvolved: "lumber_yard_evolved",
    LumberYardDeco: "lumber_yard_deco",
} as const;

export type EvolutionConfig = {
    daysToEvolve: number;
    evolvesInto: BuildingType;
    decorative: BuildingType;
};

export type BuildingDef = {
    category: "spawn" | "resource" | "defense" | "decorative";
    daysToBuild: number;
    spawnPerDay?: number;
    resourceType?: "wood" | "food" | null;
    resourcePerWorker?: number | null;
    maxWorkers?: Number | null;
    populationMaxIncrease?: number | null;
    evolution?: EvolutionConfig;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { category: "spawn", daysToBuild: 0, spawnPerDay: 1, resourceType: null, populationMaxIncrease: 10, resourcePerWorker: null },

    [BuildingType.Windmill1]: { category: "resource", daysToBuild: 3, resourceType: "food", resourcePerWorker: 1, maxWorkers: 3, evolution: { daysToEvolve: 5, evolvesInto: BuildingType.Windmill2, decorative: BuildingType.Windmill1Deco } },
    [BuildingType.Windmill2]: { category: "resource", daysToBuild: 0, resourceType: "food", resourcePerWorker: 2, maxWorkers: 5 },
    [BuildingType.Windmill1Deco]: { category: "decorative", daysToBuild: 0 },

    [BuildingType.Houses]: { category: "spawn", daysToBuild: 3, spawnPerDay: 1, resourceType: null, populationMaxIncrease: 5, resourcePerWorker: null, evolution: { daysToEvolve: 5, evolvesInto: BuildingType.HousesEvolved, decorative: BuildingType.HousesDeco } },
    [BuildingType.HousesEvolved]: { category: "spawn", daysToBuild: 0, spawnPerDay: 2, resourceType: null, populationMaxIncrease: 12, resourcePerWorker: null },
    [BuildingType.HousesDeco]: { category: "decorative", daysToBuild: 0 },

    [BuildingType.Lumber_yard]: { category: "resource", daysToBuild: 3, resourceType: "wood", resourcePerWorker: 1, maxWorkers: 2, evolution: { daysToEvolve: 5, evolvesInto: BuildingType.LumberYardEvolved, decorative: BuildingType.LumberYardDeco } },
    [BuildingType.LumberYardEvolved]: { category: "resource", daysToBuild: 0, resourceType: "wood", resourcePerWorker: 2, maxWorkers: 4 },
    [BuildingType.LumberYardDeco]: { category: "decorative", daysToBuild: 0 },
};

export const EDICT_BUILDINGS: Record<Edict, BuildingType | null> = {
    [Edict.HarvestEdict]: BuildingType.Windmill1,
    [Edict.LumberEdict]: BuildingType.Lumber_yard,
    [Edict.SettleEdict]: BuildingType.Houses,
    [Edict.ClearEdict]: null,
};
