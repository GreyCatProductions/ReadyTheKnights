import { GameMapJSON } from "../../../../shared/MapCreation/MapTranslator.js";
import { GameMap, GameNode } from "../schema/GameRoomState.js";

export function createMap(gameMap: GameMap, mapJson: GameMapJSON) {
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

        gameMap.nodes.set(id, node);
    }
}