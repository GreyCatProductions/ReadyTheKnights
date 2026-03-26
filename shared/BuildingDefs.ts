import { Edict } from "./Edicts.js";
import { ResourceType } from "./Resources.js";
import { BuildingType } from "./Buildings.js";

export type EvolutionConfig = {
    daysToEvolve: number;
    evolvesInto: BuildingType;
    decorative: BuildingType;
};

export type BuildingDef = {
    daysToBuild: number;
    spawnPerDay?: number;
    resourceType?: ResourceType | null;
    resourcePerWorker?: number | null;
    maxWorkers?: Number | null;
    populationMaxIncrease?: number | null;
    evolution?: EvolutionConfig;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { daysToBuild: 0, spawnPerDay: 1, resourceType: null, populationMaxIncrease: 10, resourcePerWorker: null },

    [BuildingType.Windmill1]: { daysToBuild: 3, resourceType: "food", resourcePerWorker: 1, maxWorkers: 3, evolution: { daysToEvolve: 5, evolvesInto: BuildingType.Windmill2, decorative: BuildingType.Windmill1Deco } },
    [BuildingType.Windmill2]: { daysToBuild: 0, resourceType: "food", resourcePerWorker: 2, maxWorkers: 5 },
    [BuildingType.Windmill1Deco]: { daysToBuild: 0 },

    [BuildingType.Houses]: { daysToBuild: 3, spawnPerDay: 1, resourceType: null, populationMaxIncrease: 5, resourcePerWorker: null, evolution: { daysToEvolve: 5, evolvesInto: BuildingType.HousesEvolved, decorative: BuildingType.HousesDeco } },
    [BuildingType.HousesEvolved]: { daysToBuild: 0, spawnPerDay: 2, resourceType: null, populationMaxIncrease: 12, resourcePerWorker: null },
    [BuildingType.HousesDeco]: { daysToBuild: 0 },

    [BuildingType.Lumber_yard]: { daysToBuild: 3, resourceType: "wood", resourcePerWorker: 1, maxWorkers: 2, evolution: { daysToEvolve: 5, evolvesInto: BuildingType.LumberYardEvolved, decorative: BuildingType.LumberYardDeco } },
    [BuildingType.LumberYardEvolved]: { daysToBuild: 0, resourceType: "wood", resourcePerWorker: 2, maxWorkers: 4 },
    [BuildingType.LumberYardDeco]: { daysToBuild: 0 },
};
