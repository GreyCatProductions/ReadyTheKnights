import { AnimatedSprite, Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { Building, GameNode, NodeStats } from "../../server/src/rooms/schema/GameRoomState";
import { MapSchema } from "@colyseus/schema";
import { showContextMenu } from "../UI/ContextMenu";
import { RESOURCE_SPRITES } from "../UI/SpriteKeyMap";
import { CELL_SIZE } from "../../shared/Constants.js";
import { TroopMoveOverlay } from "./TroopMoveOverlay";
import { BUILDING_COLOR, BUILDING_FRAMES, EDICT_SPRITE, makeAnimatedSprite } from "../AssetLoader.js";
import { BUILDING_DEFS} from "../../shared/BuildingDefs.js";
import { BuildingType } from "../../shared/Buildings.js";
import { attachTooltip } from "../UI/Tooltip.js";
import { BUILDING_TOOLTIPS } from "../UI/tooltips/BuildingTooltips.js";


const X_PADDING = 8;
const Y_PADDING = -8;
const ROW_HEIGHT = 16;

export class NodeSprite extends Container {

    private bgSprite: Sprite;
    private bgTint: Graphics;
    private buildingLayer: Container;
    private resourceLayer: Container;
    private statsLayer: Container;
    private captureBar: Graphics;
    private edictIcon: Sprite;
    private workerLabel: Container = new Container();
    private stage: Container;
    private sessionId: string;
    private buildingTooltips: Container[] = [];

    constructor(
        node: GameNode,
        nodeId: string,
        sessionId: string,
        overlay?: TroopMoveOverlay,
        stage?: Container,
    ) {
        super();
        this.stage = stage ?? this;
        this.sessionId = sessionId;

        this.x = node.column * CELL_SIZE;
        this.y = node.row * CELL_SIZE;
        this.hitArea = new Rectangle(0, 0, CELL_SIZE, CELL_SIZE);
        this.eventMode = 'static';

        const CONTEXT_MENU_MAX_DRAG = 8;
        let rightDownX = 0, rightDownY = 0;

        this.on('pointerdown', (e) => {
            if (e.button === 2) {
                rightDownX = e.x;
                rightDownY = e.y;
                overlay?.beginDrag(nodeId, node.column, node.row, e.x, e.y);
            }
        });

        this.on('pointerup', (e) => {
            e.stopPropagation();
            if (e.button === 2) {
                if (overlay?.isDragging) {
                    overlay.completeDrag(nodeId);
                    return;
                }
                const dx = e.x - rightDownX;
                const dy = e.y - rightDownY;
                if (Math.sqrt(dx * dx + dy * dy) <= CONTEXT_MENU_MAX_DRAG)
                    showContextMenu(node, sessionId, e.x, e.y);
            }
        });

        this.bgSprite = new Sprite(Texture.from("grass17"));
        this.bgSprite.width = CELL_SIZE;
        this.bgSprite.height = CELL_SIZE;
        this.bgTint = new Graphics();

        const rect = new Graphics();
        rect.rect(0, 0, CELL_SIZE, CELL_SIZE).stroke({ width: 2, color: 0x000000 });

        const label = new Text({
            text: node.name,
            style: { fill: '#ffffff', fontSize: 18 },
            anchor: 0.5,
        });
        label.eventMode = 'none';
        label.x = CELL_SIZE / 2;
        label.y = CELL_SIZE / 6;

        this.buildingLayer = new Container();
        this.resourceLayer = new Container();
        this.resourceLayer.y = CELL_SIZE - 22;
        this.statsLayer = new Container();
        this.statsLayer.y = CELL_SIZE - 22;
        this.captureBar = new Graphics();

        this.edictIcon = new Sprite();
        this.edictIcon.width = 32;
        this.edictIcon.height = 32;
        this.edictIcon.x = CELL_SIZE - 36;
        this.edictIcon.y = 4;
        this.edictIcon.visible = false;

        this.workerLabel = new Container();
        this.workerLabel.x = 4;
        this.workerLabel.y = 4;

        this.addChild(this.bgSprite);
        this.addChild(this.bgTint);
        this.addChild(this.buildingLayer);
        this.addChild(this.statsLayer);
        this.addChild(this.resourceLayer);
        this.addChild(rect);
        this.addChild(label);
        this.addChild(this.captureBar);
        this.addChild(this.edictIcon);
        this.addChild(this.workerLabel);
        
    }

    updateBuildings(buildings: MapSchema<Building>) {
        this.buildingLayer.removeChildren();
        this.resourceLayer.removeChildren();
        this.buildingTooltips.forEach(t => t.parent?.removeChild(t));
        this.buildingTooltips = [];

        const resourceOutput = new Map<string, number>();

        buildings.forEach((building) => {;
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (def?.resourceType && def.resourcePerWorker) {
                const produced = building.workerCount * def.resourcePerWorker;
                resourceOutput.set(def.resourceType, (resourceOutput.get(def.resourceType) ?? 0) + produced);
            }

            if (building.resourcesNeeded.wood > 0 || building.resourcesNeeded.food > 0) {
                this.buildingLayer.addChild(makeSprite(building, "construction"));
                this.buildingLayer.addChild(makeDemandBubble(building));
            } else if (building.daysToBuild > 0) {
                this.buildingLayer.addChild(makeSprite(building, "scaffolding"));
                this.buildingLayer.addChild(makeSprite(building, "construction"));
                this.buildingLayer.addChild(makeConstructionProgress(building));
            } else {
                const sprite = makeBuilding(building);
                if (sprite) {
                    this.buildingLayer.addChild(sprite);
                    const tooltipDef = BUILDING_TOOLTIPS[building.type as BuildingType];
                    if (tooltipDef) {
                        const isOwn = building.ownerId === this.sessionId;
                        const tip = attachTooltip(sprite, this.stage, () => ({
                            name: `${isOwn ? "" : "Enemy "}${tooltipDef.name}`,
                            description: isOwn ? tooltipDef.description : tooltipDef.e_description,
                        }));
                        this.buildingTooltips.push(tip);
                    }
                }
            }
        });

        const ICON_SIZE = 18;
        let offsetX = 2;
        resourceOutput.forEach((amount, resourceType) => {
            const spriteKey = RESOURCE_SPRITES[resourceType];
            if (!spriteKey) return;
            const icon = new Sprite(Texture.from(spriteKey));
            icon.width = ICON_SIZE;
            icon.height = ICON_SIZE;
            icon.x = offsetX;
            icon.y = 0;
            this.resourceLayer.addChild(icon);
            offsetX += ICON_SIZE + 1;
            const label = new Text({ text: `+${amount}`, style: { fill: 0xffffff, fontSize: 11 } });
            label.x = offsetX;
            label.y = 3;
            this.resourceLayer.addChild(label);
            offsetX += label.width + 4;
        });
    }

    updateStats(stats: NodeStats) {
        this.statsLayer.removeChildren();
        const ICON_SIZE = 18;
        const resources: string[] = [];
        if (stats.hasFood) resources.push("wheat");
        if (stats.hasWood) resources.push("wood");
        let offsetX = CELL_SIZE - 2;
        for (const spriteKey of resources) {
            offsetX -= ICON_SIZE;
            const icon = new Sprite(Texture.from(spriteKey));
            icon.width = ICON_SIZE;
            icon.height = ICON_SIZE;
            icon.alpha = 0.75;
            icon.x = offsetX;
            icon.y = 0;
            this.statsLayer.addChild(icon);
            offsetX -= 2;
        }
    }

    Color = 0xffffff
    updateWorkerLabel(buildings: MapSchema<Building>, unitCount: number = 0) {
        this.workerLabel.removeChildren();
        let row = 0;

        if (unitCount > 0) {
            const t = new Text({ text: `${unitCount}`, style: { fill: this.Color, fontSize: 11 } });
            t.y = row * 14;
            this.workerLabel.addChild(t);
            row++;
        }

        buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (!def?.maxWorkers) return;
            const t = new Text({
                text: `${building.workerCount}/${def.maxWorkers}`,
                style: { fill: this.Color, fontSize: 11 },
            });
            t.y = row * 14;
            this.workerLabel.addChild(t);
            row++;
        });
    }

    updateCaptureBar(progress: number, contestedBy: string, sessionId: string) {
        this.captureBar.clear();
        if (progress <= 0 || !contestedBy) return;
        const BAR_H = 6;
        const color = contestedBy === sessionId ? 0x2255cc : 0xcc2222;
        // Background track
        this.captureBar.rect(0, CELL_SIZE - BAR_H, CELL_SIZE, BAR_H).fill(0x000000);
        // Filled portion
        this.captureBar.rect(0, CELL_SIZE - BAR_H, CELL_SIZE * progress, BAR_H).fill(color);
    }

    updateEdict(edict: string) {
        const spriteKey = EDICT_SPRITE[edict as keyof typeof EDICT_SPRITE];
        if (spriteKey) {
            this.edictIcon.texture = Texture.from(spriteKey);
            this.edictIcon.visible = true;
        } else {
            this.edictIcon.visible = false;
        }
    }

    setBackground(color: number, alpha = 0.35) {
        this.bgTint.clear();
        this.bgTint.rect(0, 0, CELL_SIZE, CELL_SIZE).fill({ color, alpha });
    }
}

function makeBuilding(building: Building)
{
    const alias = building.type;
    const frameCount = BUILDING_FRAMES[alias];
    const sprite = frameCount
        ? makeAnimatedSprite(alias, frameCount)
        : new Sprite(Texture.from(alias));
    if(!sprite) return;
    sprite.x = building.posX;
    sprite.y = building.posY;
    (sprite as Sprite).anchor.set(0.5);
    return sprite;
}

function makeDemandBubble(building: Building): Container {
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

function makeConstructionProgress(building: Building): Container {
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

function makeSprite(building: Building, textureName: string): Sprite{
    const sprite = new Sprite(Texture.from(textureName));
    sprite.x = building.posX;
    sprite.y = building.posY;
    (sprite as Sprite).anchor.set(0.5);
    return sprite;
}
