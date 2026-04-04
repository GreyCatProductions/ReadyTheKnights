import { ResourceType } from "./Resources.js";
import { BuildingType } from "./Buildings.js";

export type BuildingDef = {
    daysToBuild?: number;
    spawnPerDay?: number;
    resourceType?: ResourceType | null;
    resourcePerWorker?: number | null;
    maxWorkers?: Number | null;
    populationMaxIncrease?: number | null;
    woodCost?: number;
    foodCost?: number;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { daysToBuild: 0, spawnPerDay: 1, populationMaxIncrease: 10 },

    [BuildingType.Windmill1]: { daysToBuild: 3, resourceType: "food", resourcePerWorker: 1, maxWorkers: 3, woodCost: 3 },

    [BuildingType.House]: { daysToBuild: 2, spawnPerDay: 1, populationMaxIncrease: 5, woodCost: 2 },

    [BuildingType.Lumber_yard]: { daysToBuild: 2, resourceType: "wood", resourcePerWorker: 1, maxWorkers: 2, foodCost: 2 },
};
