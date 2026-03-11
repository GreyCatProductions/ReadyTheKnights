import { Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { Building, GameNode, NodeStats } from "../../server/src/rooms/schema/GameRoomState";
import { MapSchema } from "@colyseus/schema";
import { showContextMenu } from "../UI/ContextMenu";
import { NODE_RESOURCES } from "../UI/SpriteKeyMap";
import { CELL_SIZE } from "../../shared/Constants.js";


const X_PADDING = 8;
const Y_PADDING = -8;
const ROW_HEIGHT = 16;

export class NodeSprite extends Container {

    private bg: Graphics;
    private buildingLayer: Container;

    constructor(
        node: GameNode,
        sessionId: string,
    ) {
        super();

        this.x = node.column * CELL_SIZE;
        this.y = node.row * CELL_SIZE;
        this.hitArea = new Rectangle(0, 0, CELL_SIZE, CELL_SIZE);
        this.eventMode = 'static';

        const RIGHT_CLICK_MAX_DRAG = 32;
        let rightDownX = 0, rightDownY = 0;

        this.on('pointerdown', (e) => {
            if (e.button === 2) { rightDownX = e.x; rightDownY = e.y; }
        });

        this.on('pointerup', (e) => {
            e.stopPropagation();
            if (e.button === 2) {
                const dx = e.x - rightDownX;
                const dy = e.y - rightDownY;
                if (Math.sqrt(dx * dx + dy * dy) <= RIGHT_CLICK_MAX_DRAG)
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

        this.addChild(this.bg);
        this.addChild(this.buildingLayer);
        this.addChild(rect);
        this.addChild(label);

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
        let i = 0;
        buildings.forEach((building) => {
            const t = new Sprite(Texture.from(building.type));
            t.x = building.posX;
            t.y = building.posY;
            t.anchor = 0.5;
            this.buildingLayer.addChild(t);
            i++;
        });
    }

    setBackground(color: number) {
        this.bg.clear();
        this.bg.rect(0, 0, CELL_SIZE, CELL_SIZE).fill(color);
    }
}
