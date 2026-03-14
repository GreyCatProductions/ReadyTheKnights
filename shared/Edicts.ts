export const Edict = {
    HarvestEdict: "Harvest Edict",
    LumberEdict:  "Lumber Edict",
    SettleEdict:  "Settle Edict",
} as const;

export type Edict = typeof Edict[keyof typeof Edict];
