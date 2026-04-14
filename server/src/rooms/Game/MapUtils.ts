import { CELL_SIZE, worldToGrid, BUILDING_OBSTACLE_RADIUS, TREE_OBSTACLE_RADIUS } from "../../../../shared/Constants.js";
import { GameNode } from "./schema/GameRoomState.js";

export type Obstacle = { x: number; y: number; radius: number };

export function getObstacles(node: GameNode): Obstacle[] {
    const originX = node.column * CELL_SIZE;
    const originY = node.row * CELL_SIZE;
    const obstacles: Obstacle[] = [];
    for (const b of node.buildings.values())
        obstacles.push({ x: originX + b.posX, y: originY + b.posY, radius: BUILDING_OBSTACLE_RADIUS });
    for (const obj of node.worldObjects.values())
        obstacles.push({ x: originX + obj.posX, y: originY + obj.posY, radius: TREE_OBSTACLE_RADIUS });
    return obstacles;
}