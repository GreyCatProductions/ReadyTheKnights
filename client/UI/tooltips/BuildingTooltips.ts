import { BuildingType } from "../../../shared/Buildings.js";

export const BUILDING_TOOLTIPS: Partial<Record<BuildingType, { name: string; description: string; e_description: string }>> = {
    [BuildingType.Base]: {
        name: "Stronghold",
        description: "You live and rule here. If it gets demolished, you lose. Spawns one unit per day.",
        e_description: "Demolish this building using the 'Demolish' edict to eliminate that opponent. The stronghold can not be damaged by anything else."
    },
    [BuildingType.Windmill1]: {
        name: "Windmill",
        description: "Produces food each day. Assign workers to increase output.",
        e_description: "Destroy or sabotage it to halt their food supply! You can also capture it for your own good."
    },
    [BuildingType.House]: {
        name: "Houses",
        description: "Raises the population cap",
        e_description: "Destroy or sabotage it to reduce their maximum population!"
    },
    [BuildingType.Lumber_yard]: {
        name: "Lumber Yard",
        description: "Produces wood each day. Assign workers to increase output.",
        e_description: "Destroy or sabotage it to reduce their wood supply!"
    },
};
