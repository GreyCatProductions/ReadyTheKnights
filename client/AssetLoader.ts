import { AnimatedSprite, Assets, Rectangle, Texture } from "pixi.js";
import { Edict } from "../shared/Edicts.js";

const FRAME_SIZE = 64;

export function makeAnimatedSprite(alias: string, frameCount: number, animationSpeed = 0.01): AnimatedSprite {
    const base = Assets.get(alias) as Texture;
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
    houses: 0x55cc55,
    lumber_yard: 0xa0522d,
};

export const EDICT_SPRITE: Record<Edict, string> = {
    [Edict.HarvestEdict]: "wheat",
    [Edict.LumberEdict]: "wood",
    [Edict.SettleEdict]: "wheat",
    [Edict.ClearEdict]: "clear",
};

export const CONSTRUCTION_SPRITES: Partial<Record<string, string[]>> = {
    lumber_yard: ['lumber_construction1', 'lumber_construction2', 'lumber_construction3'],
};

const SPRITE_MANIFEST: Record<string, string> = {
    base:                 '/sprites/buildings/base.png',
    windmill:             '/sprites/buildings/windmill.png',
    lumber_yard:          '/sprites/buildings/lumber/construction/lumber_construction3.png',
    lumber_construction1: '/sprites/buildings/lumber/construction/lumber_construction1.png',
    lumber_construction2: '/sprites/buildings/lumber/construction/lumber_construction2.png',
    lumber_construction3: '/sprites/buildings/lumber/construction/lumber_construction3.png',
    lumber_evolution1:    '/sprites/buildings/lumber/evolution1/lumber_evolution1.png',
    lumber_evolution2:    '/sprites/buildings/lumber/evolution2/lumber_evolution2.png',

    wheat:  '/sprites/edicts/wheat.png',
    wood:   '/sprites/edicts/wood.png',
    clear:  '/sprites/edicts/clear.png',
};

export async function LoadAssets() {
    for (const [alias, src] of Object.entries(SPRITE_MANIFEST)) {
        Assets.add({ alias, src });
    }
    await Assets.load(Object.keys(SPRITE_MANIFEST));
}