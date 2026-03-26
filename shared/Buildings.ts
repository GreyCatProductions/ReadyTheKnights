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