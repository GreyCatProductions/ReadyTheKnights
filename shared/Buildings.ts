export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export const BuildingType = {
    Base:       "base",
    LumberMill: "lumber_mill",
    Houses:     "houses",
} as const;