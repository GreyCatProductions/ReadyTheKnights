export type BuildingDef = {
    category: "spawn" | "resource" | "defense";
    spawnPerDay?: number;         
    resourceType?: "wood" | null;        
    resourcePerWorker?: number | null;
    populationMaxIncrease?: number | null;
};

export const BUILDING_DEFS: Record<string, BuildingDef> =
{
    base:         { category: "spawn",    spawnPerDay: 1,  resourceType: null,   populationMaxIncrease: 10, resourcePerWorker: null },
    lumber_mill:  { category: "resource", spawnPerDay: 0,  resourceType: "wood", populationMaxIncrease: 0,  resourcePerWorker: 2 },
    houses:       { category: "spawn",    spawnPerDay: 0,  resourceType: null,   populationMaxIncrease: 20, resourcePerWorker: null },
};

export const EDICT_BUILDING: Record<string, string> = {
    "Harvest Edict": "lumber_mill",
    "Lumber Edict":  "lumber_mill",
    "Settle Edict":  "houses",
};
