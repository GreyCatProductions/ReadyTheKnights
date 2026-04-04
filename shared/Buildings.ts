export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export const BuildingType = {
    Base: "base",
    Windmill1: "windmill",
    House: "house",
    Lumber_yard: "lumber_yard",
} as const;