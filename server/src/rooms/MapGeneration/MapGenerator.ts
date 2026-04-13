import { GameMapJSON } from "../../../../shared/MapCreation/MapTranslator.js";
import { GameRoomState, GameNode, WorldObject } from "../schema/GameRoomState.js";
import { CELL_SIZE } from "../../../../shared/Constants.js";

const MAX_TREE_COUNT = 4;
const EDGE_MARGIN = 32;
const TREE_MIN_SPACING = 64; //total distance
const CENTER_EXCLUSION = 48; //radius

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
    const range = CELL_SIZE - EDGE_MARGIN * 2;
    const center = CELL_SIZE / 2;
    const placed: { x: number; y: number }[] = [];

    let placed_count = 0;
    for (let attempt = 0; attempt < MAX_TREE_COUNT * 20 && placed_count < MAX_TREE_COUNT; attempt++) {
        const x = EDGE_MARGIN + Math.floor(rng() * range);
        const y = EDGE_MARGIN + Math.floor(rng() * range);

        // Skip if too close to center
        const cdx = x - center, cdy = y - center;
        if (cdx * cdx + cdy * cdy < CENTER_EXCLUSION * CENTER_EXCLUSION) continue;

        // Skip if too close to another tree
        let tooClose = false;
        for (const p of placed) {
            const dx = x - p.x, dy = y - p.y;
            if (dx * dx + dy * dy < TREE_MIN_SPACING * TREE_MIN_SPACING) { tooClose = true; break; }
        }
        if (tooClose) continue;

        placed.push({ x, y });
        placed_count++;
    }

    // y sort
    placed.sort((a, b) => a.y - b.y);
    placed.forEach(({ x, y }, i) => {
        const obj = new WorldObject();
        obj.type = "tree";
        obj.posX = x;
        obj.posY = y;
        node.worldObjects.set(`${nodeId}_tree_${i}`, obj);
    });
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