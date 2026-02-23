import { GameMapJSON } from "../../../../shared/src/MapCreation/MapTranslator.js";
import { GameMap, GameNode } from "../schema/GameRoomState.js";

export function createMap(gameMap: GameMap, mapJson: GameMapJSON) {
    if (!gameMap) throw new Error("Failed to create map, gameMap is NULL");

    gameMap.nodes.clear();

    for (const [id, nodeJson] of Object.entries(mapJson.nodes)) {
        const node = new GameNode();
        node.name = nodeJson.name ?? id;

        node.stats.foodPerRound = nodeJson.stats?.foodPerRound ?? 0;
        node.stats.menPerRound = nodeJson.stats?.menPerRound ?? 0;
        node.neighbors.top = nodeJson.neighbors?.top ?? "";
        node.neighbors.bottom = nodeJson.neighbors?.bottom ?? "";
        node.neighbors.left = nodeJson.neighbors?.left ?? "";
        node.neighbors.right = nodeJson.neighbors?.right ?? "";

        gameMap.nodes.set(id, node);
    }
}