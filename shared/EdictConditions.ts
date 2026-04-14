import { GameNode } from "../server/src/rooms/Game/schema/GameRoomState.js";
import { Edict } from "./Edicts.js";
import { BuildingType } from "./Buildings.js";

type ConditionFn = (node: GameNode, sessionId: string) => boolean;

export const EDICT_CONDITIONS: Record<Edict, ConditionFn> = {
    [Edict.HarvestEdict]: (node, sessionId) =>
        IsOwner(node, sessionId) &&
        !node.edict &&
        !node.buildings.has(BuildingType.Base) &&
        node.stats.hasFood,

    [Edict.LumberEdict]: (node, sessionId) =>
        IsOwner(node, sessionId) &&
        !node.edict &&
        !node.buildings.has(BuildingType.Base) &&
        node.stats.hasWood,

    [Edict.SettleEdict]: (node, sessionId) =>
        IsOwner(node, sessionId) &&
        !node.edict &&
        !node.buildings.has(BuildingType.Base),

    [Edict.ClearEdict]: (node, sessionId) =>
        IsOwner(node, sessionId) &&
        !!node.edict,

    [Edict.GrantEdict]: (node, sessionId) =>
        IsOwner(node, sessionId) &&
        [...node.buildings.values()].some(
            b => b.resourcesNeeded.wood > 0 || b.resourcesNeeded.food > 0
        ),
    
    [Edict.ScorchEdict]: (node, sessionId) =>
        false,

    [Edict.AnnexEdict]: (nodeSprites, sessionId) =>
        false,
};

function IsOwner(node: GameNode, sessionId: string)
{
    return node.ownerId === sessionId
}
