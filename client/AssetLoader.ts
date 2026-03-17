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
    base:        0xaaaaaa,
    windmill:    0xf5c518,
    houses:      0x55cc55,
    lumber_yard: 0xa0522d,
};

export const EDICT_SPRITE: Record<Edict, string> = {
    [Edict.HarvestEdict]: "wheat",
    [Edict.LumberEdict]:  "wood",
    [Edict.SettleEdict]:  "wheat",
};

export const CONSTRUCTION_SPRITES: Partial<Record<string, string[]>> = {
    lumber_yard: ['lumber1', 'lumber2', 'lumber3'],
};

export async function LoadAssets()
{
    Assets.add({ alias: 'base',       src: '/sprites/buildings/base.png' });
    Assets.add({ alias: 'windmill',   src: '/sprites/buildings/windmill.png' });
    Assets.add({ alias: 'wheat',      src: '/sprites/edicts/wheat.png' });
    Assets.add({ alias: 'wood',       src: '/sprites/edicts/wood.png' });
    Assets.add({ alias: 'lumber_yard',src: '/sprites/buildings/lumber/lumber.png' });
    Assets.add({ alias: 'lumber1',   src: '/sprites/buildings/lumber/lumber1.png' });
    Assets.add({ alias: 'lumber2',   src: '/sprites/buildings/lumber/lumber2.png' });
    Assets.add({ alias: 'lumber3',   src: '/sprites/buildings/lumber/lumber3.png' });
    await Assets.load(['base', 'wheat', 'wood', 'windmill', 'lumber_yard', 'lumber1', 'lumber2', 'lumber3']);
}