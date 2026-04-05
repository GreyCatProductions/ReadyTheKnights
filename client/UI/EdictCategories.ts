import { Edict } from "../../shared/Edicts.js";

export const EdictCategory = {
    Resource: "Resource",
    War:      "War",
    Other:    "Other",
} as const;
export type EdictCategory = typeof EdictCategory[keyof typeof EdictCategory];

export const EDICT_CATEGORY: Record<Edict, EdictCategory> = {
    [Edict.HarvestEdict]: EdictCategory.Resource,
    [Edict.LumberEdict]:  EdictCategory.Resource,
    [Edict.SettleEdict]:  EdictCategory.Resource,
    [Edict.ClearEdict]:   EdictCategory.Other,
    [Edict.GrantEdict]:   EdictCategory.Other,
};

export const CATEGORY_COLOR: Record<EdictCategory, number> = {
    [EdictCategory.Resource]: 0x2a4a2a,
    [EdictCategory.War]:      0x4a1a1a,
    [EdictCategory.Other]:    0x2a2a4a,
};

export const CATEGORY_ACCENT: Record<EdictCategory, number> = {
    [EdictCategory.Resource]: 0x44aa44,
    [EdictCategory.War]:      0xaa2222,
    [EdictCategory.Other]:    0x4466cc,
};
