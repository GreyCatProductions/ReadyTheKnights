import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { Building } from "../../server/src/rooms/schema/GameRoomState";
import { BUILDING_FRAMES, makeAnimatedSprite } from "../AssetLoader.js";

export function makeBuilding(building: Building): Sprite | null {
    const alias = building.type;
    const frameCount = BUILDING_FRAMES[alias];
    const sprite = frameCount
        ? makeAnimatedSprite(alias, frameCount)
        : new Sprite(Texture.from(alias));
    if (!sprite) return null;
    sprite.x = building.posX;
    sprite.y = building.posY;
    (sprite as Sprite).anchor.set(0.5);
    return sprite;
}

export function makeDemandBubble(building: Building): Container {
    const ICON = 14;
    const PAD  = 4;
    const demands: { spriteKey: string; amount: number }[] = [];
    if (building.resourcesNeeded.wood > 0) demands.push({ spriteKey: "wood",  amount: building.resourcesNeeded.wood });
    if (building.resourcesNeeded.food > 0) demands.push({ spriteKey: "wheat", amount: building.resourcesNeeded.food });

    const bubble = new Container();
    let offsetX = PAD;
    for (const { spriteKey, amount } of demands) {
        const icon = new Sprite(Texture.from(spriteKey));
        icon.width  = ICON;
        icon.height = ICON;
        icon.x = offsetX;
        icon.y = PAD;
        bubble.addChild(icon);
        offsetX += ICON + 2;

        const label = new Text({ text: `${amount}`, style: { fill: 0xffffff, fontSize: 11 } });
        label.x = offsetX;
        label.y = PAD + 1;
        bubble.addChild(label);
        offsetX += label.width + PAD;
    }

    const W = offsetX;
    const H = ICON + PAD * 2;
    const bg = new Graphics();
    bg.roundRect(0, 0, W, H, 4).fill({ color: 0x000000, alpha: 0.7 });
    bubble.addChildAt(bg, 0);

    bubble.x = building.posX - W / 2;
    bubble.y = building.posY - 36;
    return bubble;
}

export function makeConstructionProgress(building: Building): Container {
    const RADIUS = 14;
    const c = new Container();
    c.x = building.posX;
    c.y = building.posY - 24;

    const arc = new Graphics();
    arc.circle(0, 0, RADIUS).fill({ color: 0x000000, alpha: 0.6 });
    c.addChild(arc);

    const label = new Text({
        text: `${building.daysToBuild}`,
        style: { fill: 0xffffff, fontSize: 13, fontWeight: "bold" },
    });
    label.anchor.set(0.5);
    c.addChild(label);

    return c;
}

export function makeSprite(building: Building, textureName: string): Sprite {
    const sprite = new Sprite(Texture.from(textureName));
    sprite.x = building.posX;
    sprite.y = building.posY;
    sprite.anchor.set(0.5);
    return sprite;
}
