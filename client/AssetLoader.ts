import { AnimatedSprite, Assets, Rectangle, Texture } from "pixi.js";
import { Edict } from "../shared/Edicts.js";

const FRAME_SIZE = 64;

export function makeAnimatedSprite(alias: string, frameCount: number, animationSpeed = 0.01): AnimatedSprite | null {
    const base = Assets.get(alias) as Texture;
    if(!base) return null;

    const frames: Texture[] = [];
    for (let i = 0; i < frameCount; i++) {
        frames.push(new Texture({
            source: base.source,
            frame: new Rectangle(0, i * FRAME_SIZE, FRAME_SIZE, FRAME_SIZE),
        }));
    }
    const anim = new AnimatedSprite(frames);
    anim.animationSpeed = animationSpeed;
    anim.play();
    return anim;
}

// Buildings with frame count > 1 will be rendered as AnimatedSprite
export const BUILDING_FRAMES: Partial<Record<string, number>> = {
    windmill: 2,
};

export const BUILDING_COLOR: Partial<Record<string, number>> = {
    base: 0xaaaaaa,
    windmill: 0xf5c518,
    house: 0x55cc55,
    lumber_yard: 0xa0522d,
};

export const EDICT_SPRITE: Record<Edict, string> = {
    [Edict.HarvestEdict]: "wheat",
    [Edict.LumberEdict]: "wood",
    [Edict.SettleEdict]: "worker",
    [Edict.ClearEdict]: "clear",
    [Edict.GrantEdict]: "wheat",
};

const SPRITE_MANIFEST: Record<string, string> = {
    base:        '/sprites/buildings/base.png',
    windmill:    '/sprites/buildings/windmill.png',
    lumber_yard: '/sprites/buildings/lumber_evolution1.png',
    house: '/sprites/buildings/house.png',
    scaffolding: '/sprites/buildings/scaffolding.png',
    construction: '/sprites/buildings/construction.png',

    wheat:  '/sprites/edicts/wheat.png',
    wood:   '/sprites/edicts/wood.png',
    worker: '/sprites/edicts/worker.png',
    clear:  '/sprites/edicts/clear.png',

    grass17: '/sprites/world/grass17.png',
};

export async function LoadAssets() {
    for (const [alias, src] of Object.entries(SPRITE_MANIFEST)) {
        Assets.add({ alias, src });
    }
    await Assets.load(Object.keys(SPRITE_MANIFEST));
}