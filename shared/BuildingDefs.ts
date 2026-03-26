import { ResourceType } from "./Resources.js";
import { BuildingType } from "./Buildings.js";

export type BuildingDef = {
    spawnPerDay?: number;
    resourceType?: ResourceType | null;
    resourcePerWorker?: number | null;
    maxWorkers?: Number | null;
    populationMaxIncrease?: number | null;
};

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> =
{
    [BuildingType.Base]: { spawnPerDay: 1, resourceType: null, populationMaxIncrease: 10, resourcePerWorker: null },

    [BuildingType.Windmill1]: { resourceType: "food", resourcePerWorker: 1, maxWorkers: 3 },

    [BuildingType.Houses]: { spawnPerDay: 1, resourceType: null, populationMaxIncrease: 5, resourcePerWorker: null },

    [BuildingType.Lumber_yard]: { resourceType: "wood", resourcePerWorker: 1, maxWorkers: 2 },
};
