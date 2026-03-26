import { Container } from "pixi.js";
import { GameMap, GameNode } from "../../server/src/rooms/schema/GameRoomState";
import { NodeSprite } from "./NodeSprite";
import { TroopMoveOverlay } from "./TroopMoveOverlay";
import { CELL_SIZE } from "../../shared/Constants";

export const nodeSprites = new Map<string, NodeSprite>();
export let mapBounds = { left: 0, right: 0, top: 0, bottom: 0 };

export function renderMap(map: GameMap, world: Container, sessionId: string, overlay?: TroopMoveOverlay) {
    let minCol = Infinity, maxCol = -Infinity;
    let minRow = Infinity, maxRow = -Infinity;

    map.nodes.forEach((node, id) => {
        minCol = Math.min(minCol, node.column);
        maxCol = Math.max(maxCol, node.column);
        minRow = Math.min(minRow, node.row);
        maxRow = Math.max(maxRow, node.row);

        const sprite = new NodeSprite(node, id, sessionId, overlay);
        sprite.updateStats(node.stats);
        nodeSprites.set(id, sprite);
        world.addChild(sprite);
    });

    mapBounds = {
        left:   minCol * CELL_SIZE,
        right:  (maxCol + 1) * CELL_SIZE,
        top:    minRow * CELL_SIZE,
        bottom: (maxRow + 1) * CELL_SIZE,
    };
}

export function refreshNode(id: string, node: GameNode, sessionId: string, unitCount: number = 0) {
    const sprite = nodeSprites.get(id);
    if (!sprite) return;
    const color = node.ownerId === sessionId ? 0x2255cc
        : node.ownerId !== "" ? 0xcc2222
        : 0x555555;
    sprite.setBackground(color);
    sprite.updateBuildings(node.buildings);
    sprite.updateCaptureBar(node.captureProgress, node.contestedBy, sessionId);
    sprite.updateEdict(node.edict);
    sprite.updateWorkerLabel(node.buildings, unitCount);
}
