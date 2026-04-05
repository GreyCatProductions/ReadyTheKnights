import { UnitType } from "./Units.js";

export type UnitDef = {
    hp: number;
    foodDemand: number;
    damage: number;
    speed: number;
};

export const UNIT_DEFS: Record<UnitType, UnitDef> = {
    [UnitType.Worker]:       { hp:  50, foodDemand: 1, damage:  1, speed: 50 },
    [UnitType.ArmedPeasant]: { hp:  50, foodDemand: 1, damage:  5, speed: 50 },
    [UnitType.Spearman]:     { hp: 120, foodDemand: 1, damage:  10, speed: 30 },
    [UnitType.Maceman]:      { hp: 140, foodDemand: 1, damage: 8, speed: 70 },
    [UnitType.Pikeman]:      { hp: 130, foodDemand: 1, damage: 20, speed: 20 },
    [UnitType.Swordsman]:    { hp: 160, foodDemand: 2, damage: 15, speed: 40 },
    [UnitType.Knight]:       { hp: 250, foodDemand: 3, damage: 25, speed: 55 },
};
