import { Edict } from "../../../shared/Edicts.js";

export const EDICT_TOOLTIPS: Record<Edict, { name: string; description: string }> = {
    [Edict.HarvestEdict]: {
        name: "Harvest Edict",
        description: "Order your folk to harvest food in that area. Requires an area with food.",
    },
    [Edict.LumberEdict]: {
        name: "Lumber Edict",
        description: "Order your folk to chop wood in that area. Requires a forest.",
    },
    [Edict.SettleEdict]: {
        name: "Settle Edict",
        description: "Order your folk to build their homes here. Increases max population.",
    },
    [Edict.ClearEdict]: {
        name: "Clear Edict",
        description: "Remove the current edict from the area.",
    },
    [Edict.GrantEdict]: {
        name: "Grant Edict",
        description: "Grant the resources needed by buildings in this area.",
    },
};
