import { Assets } from "pixi.js";
import { Edict } from "../shared/Edicts.js";

export const EDICT_SPRITE: Record<Edict, string> = {
    [Edict.HarvestEdict]: "wheat",
    [Edict.LumberEdict]:  "wheat",
    [Edict.SettleEdict]:  "wheat",
};

export async function LoadAssets()
{
    Assets.add({ alias: 'base', src: '/sprites/buildings/base.png' });
    Assets.add({ alias: 'wheat', src: '/sprites/edicts/wheat.png' });
    await Assets.load(['base', 'wheat']);
}