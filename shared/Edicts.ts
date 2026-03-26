import { BuildingType } from "./Buildings.js";

export const Edict = {
    HarvestEdict: "Harvest Edict",
    LumberEdict:  "Lumber Edict",
    SettleEdict:  "Settle Edict",
    ClearEdict: "Clear Edict",
} as const;

export const EDICT_BUILDINGS: Record<Edict, BuildingType | null> = {
    [Edict.HarvestEdict]: BuildingType.Windmill1,
    [Edict.LumberEdict]: BuildingType.Lumber_yard,
    [Edict.SettleEdict]: BuildingType.Houses,
    [Edict.ClearEdict]: null,
};

export type Edict = typeof Edict[keyof typeof Edict];
