import { GameMapJSON } from "../../../../shared/MapCreation/MapTranslator.js";
import { GameRoomState, GameNode, WorldObject } from "../schema/GameRoomState.js";
import { CELL_SIZE } from "../../../../shared/Constants.js";

const TREE_COUNT = 4;
const TREE_MARGIN = 20;

function seededRng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = Math.imul(s, 1664525) + 1013904223 >>> 0;
        return s / 0x100000000;
    };
}

function hashId(id: string): number {
    let h = 0;
    for (const c of id) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    return h;
}

function placeTrees(node: GameNode, nodeId: string) {
    const rng = seededRng(hashId(nodeId));
    const range = CELL_SIZE - TREE_MARGIN * 2;
    for (let i = 0; i < TREE_COUNT; i++) {
        const obj = new WorldObject();
        obj.type = "tree";
        obj.posX = TREE_MARGIN + Math.floor(rng() * range);
        obj.posY = TREE_MARGIN + Math.floor(rng() * range);
        node.worldObjects.set(`${nodeId}_tree_${i}`, obj);
    }
}

export function createMap(gameMap: GameRoomState, mapJson: GameMapJSON) {
    if (!gameMap) throw new Error("Failed to create map, gameMap is NULL");

    gameMap.nodes.clear();

    for (const [id, nodeJson] of Object.entries(mapJson.nodes)) {
        const node = new GameNode();
        node.name = nodeJson.name ?? id;
        node.row = nodeJson.row;
        node.column = nodeJson.column;
        node.playerSpawnTile = nodeJson.playerSpawnTile;
        node.stats.hasFood = nodeJson.stats?.hasFood ?? false;
        node.stats.hasWood = nodeJson.stats?.hasWood ?? false;

        if (node.stats.hasWood) placeTrees(node, id);

        gameMap.nodes.set(id, node);
    }
}