import { AnimatedSprite, Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { Building, GameNode, NodeStats } from "../../server/src/rooms/schema/GameRoomState";
import { MapSchema } from "@colyseus/schema";
import { showContextMenu } from "../UI/ContextMenu";
import { NODE_RESOURCES } from "../UI/SpriteKeyMap";
import { CELL_SIZE } from "../../shared/Constants.js";
import { TroopMoveOverlay } from "./TroopMoveOverlay";
import { BUILDING_COLOR, BUILDING_FRAMES, CONSTRUCTION_SPRITES, EDICT_SPRITE, makeAnimatedSprite } from "../AssetLoader.js";
import { BUILDING_DEFS, BuildingType } from "../../shared/BuildingDefs.js";


const X_PADDING = 8;
const Y_PADDING = -8;
const ROW_HEIGHT = 16;

export class NodeSprite extends Container {

    private bg: Graphics;
    private buildingLayer: Container;
    private captureBar: Graphics;
    private edictIcon: Sprite;
    private workerLabel: Container = new Container();

    constructor(
        node: GameNode,
        nodeId: string,
        sessionId: string,
        overlay?: TroopMoveOverlay,
    ) {
        super();

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

        this.bg = new Graphics();
        this.bg.rect(0, 0, CELL_SIZE, CELL_SIZE).fill(0x555555);

        const rect = new Graphics();
        rect.rect(0, 0, CELL_SIZE, CELL_SIZE).stroke({ width: 2, color: 0x000000 });

        const label = new Text({
            text: node.name,
            style: { fill: '#ffffff', fontSize: 18 },
            anchor: 0.5,
        });
        label.x = CELL_SIZE / 2;
        label.y = CELL_SIZE / 2;

        this.buildingLayer = new Container();
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

        this.addChild(this.bg);
        this.addChild(this.buildingLayer);
        this.addChild(rect);
        this.addChild(label);
        this.addChild(this.captureBar);
        this.addChild(this.edictIcon);
        this.addChild(this.workerLabel);

        NODE_RESOURCES.forEach(({ key, icon }, i) => {
            const value = Number(node.stats[key]) || 0;
            if (!value) return;
            const y = CELL_SIZE - Y_PADDING - ROW_HEIGHT * (NODE_RESOURCES.length - i);

            const iconText = new Text({ text: icon, style: { fill: '#ffffff', fontSize: 13 } });
            const valText = new Text({ text: String(value), style: { fill: '#ffffff', fontSize: 13 } });
            iconText.x = X_PADDING;
            valText.x = X_PADDING + 22;
            iconText.y = valText.y = y;

            this.addChild(iconText);
            this.addChild(valText);
        });
    }

    updateBuildings(buildings: MapSchema<Building>) {
        this.buildingLayer.removeChildren();
        buildings.forEach((building) => {
            let alias: string;
            if (building.constructionDaysLeft > 0) {
                const stages = CONSTRUCTION_SPRITES[building.type];
                const idx = stages ? stages.length - building.constructionDaysLeft : -1;
                alias = (stages && idx >= 0) ? stages[idx]! : building.type;
            } else {
                alias = building.type;
            }

            const frameCount = BUILDING_FRAMES[alias];
            const sprite = frameCount
                ? makeAnimatedSprite(alias, frameCount)
                : new Sprite(Texture.from(alias));
            sprite.x = building.posX;
            sprite.y = building.posY;
            (sprite as Sprite).anchor.set(0.5);
            this.buildingLayer.addChild(sprite);
        });
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

    setBackground(color: number) {
        this.bg.clear();
        this.bg.rect(0, 0, CELL_SIZE, CELL_SIZE).fill(color);
    }
}
