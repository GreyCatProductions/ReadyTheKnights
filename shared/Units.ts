export const UnitType = {
    Worker: "worker",
    ArmedPeasant: "armedPeasant",
    Spearman:  "spearman",
    Maceman:   "maceman",
    Pikeman:   "pikeman",
    Swordsman: "swordsman",
    Knight:    "knight",
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];
