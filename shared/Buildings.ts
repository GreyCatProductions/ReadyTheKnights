export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export const BuildingType = {
    Base:       "base",
    Windmill: "windmill",
    Houses:     "houses",
} as const;