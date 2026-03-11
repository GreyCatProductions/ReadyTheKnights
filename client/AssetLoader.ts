import { Assets } from "pixi.js";

export async function LoadAssets()
{
    Assets.add({ alias: 'base', src: 'sprites/buildings/base.png' });
    await Assets.load('base');
}