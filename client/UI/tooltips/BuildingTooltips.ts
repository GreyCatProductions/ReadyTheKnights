import { BuildingType } from "../../../shared/Buildings.js";

export const BUILDING_TOOLTIPS: Partial<Record<BuildingType, { name: string; description: string }>> = {
    [BuildingType.Base]: {
        name: "Base",
        description: "Your stronghold. You live here. If it gets destroyed, you lose. Spawns one unit per day.",
    },
    [BuildingType.Windmill1]: {
        name: "Windmill",
        description: "Produces food each day.\nAssign workers to increase output.",
    },
    [BuildingType.House]: {
        name: "Houses",
        description: "Raises the population cap\n",
    },
    [BuildingType.Lumber_yard]: {
        name: "Lumber Yard",
        description: "Produces wood each day.\nAssign workers to increase output.",
    },
};
