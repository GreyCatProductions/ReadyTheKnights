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
    [Edict.AnnexEdict]: {
        name: "Annex Edict",
        description: "This area is ours now! It will take some time for the inhabitants to adjust to the new rule.",
    },
    [Edict.ScorchEdict]: {
        name: "Scorch Edict",
        description: "Burn everything on this area to the ground. No survivors will be left. After burning an area it will take some time for it to be useful again.",
    },
};
