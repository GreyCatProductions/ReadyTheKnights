export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export const BuildingType = {
    Base: "base",
    Windmill1: "windmill",
    Houses: "houses",
    Lumber_yard: "lumber_yard",
} as const;