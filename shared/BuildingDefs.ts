export type BuildingDef = {
    category: "spawn" | "resource" | "defense";
    spawnPerDay?: number;         
    resourceType?: "wood" | null;        
    resourcePerWorker?: number | null;
};

export const BUILDING_DEFS: Record<string, BuildingDef> = 
{
    base: {category: "spawn", spawnPerDay: 1, resourceType: null, resourcePerWorker: null}
};
