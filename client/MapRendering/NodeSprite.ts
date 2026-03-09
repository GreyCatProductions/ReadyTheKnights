import { Container, Graphics, Rectangle, Text } from "pixi.js";
import { GameNode, NodeStats } from "../../server/src/rooms/schema/GameRoomState";
import { CELL_SIZE } from "../index";
import { showContextMenu } from "../UI/ContextMenu";

const X_PADDING = 8;
const Y_PADDING = -8;
const ROW_HEIGHT = 16;

const NODE_RESOURCES: { key: keyof NodeStats; icon: string }[] = [
    { key: "foodPerRound", icon: "🍎" },
    { key: "menPerRound", icon: "⚔️" },
    { key: "woodPerRound", icon: "🪵"},
];

export class NodeSprite extends Container {

    private bg: Graphics;

    constructor(node: GameNode) {
        super();

        this.x = node.column * CELL_SIZE;
        this.y = node.row * CELL_SIZE;
        this.hitArea = new Rectangle(0, 0, CELL_SIZE, CELL_SIZE);
        this.eventMode = 'static';

        this.on('pointerdown', (e) => {
            e.stopPropagation();
            if (e.button === 0) this.onLeftClick(node);
            if (e.button === 2) this.onRightClick(node, e.clientX, e.clientY);
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

        this.addChild(this.bg);
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

    setBackground(color: number) {
        this.bg.clear();
        this.bg.rect(0, 0, CELL_SIZE, CELL_SIZE).fill(color);
    }

    onLeftClick(node: GameNode) {
        console.log('Left click:', node.name);
    }

    onRightClick(node: GameNode, screenX: number, screenY: number) {
        showContextMenu(node, screenX, screenY);
    }
}
