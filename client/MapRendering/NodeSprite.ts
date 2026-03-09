import { Container, Graphics, Rectangle, Text } from "pixi.js";
import { GameNode } from "../../server/src/rooms/schema/GameRoomState";
import { CELL_SIZE } from "../index";
import { showContextMenu } from "../UI/ContextMenu";

export class NodeSprite extends Container {

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

        const rect = new Graphics();
        rect.rect(0, 0, CELL_SIZE, CELL_SIZE).stroke({ width: 2, color: 0x000000 });

        const label = new Text({
            text: node.name,
            style: { fill: '#ffffff', fontSize: 18 },
            anchor: 0.5,
        });
        label.x = CELL_SIZE / 2;
        label.y = CELL_SIZE / 2;

        this.addChild(rect);
        this.addChild(label);
    }

    onLeftClick(node: GameNode) {
        console.log('Left click:', node.name);
    }

    onRightClick(node: GameNode, screenX: number, screenY: number) {
        showContextMenu(node, screenX, screenY);
    }
}
