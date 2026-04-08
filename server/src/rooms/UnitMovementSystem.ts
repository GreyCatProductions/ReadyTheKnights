import { GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { CELL_SIZE, worldToGrid } from "../../../shared/Constants.js";
import { unassignWorker, tickWorker } from "./WorkerSystem.js";

const SPEED = 40; // pixels per second
const ARRIVAL_THRESHOLD = 4;
const MIN_WAIT_MS = 1000;
const MAX_WAIT_MS = 5000;

const BUILDING_RADIUS = 40;
const TREE_RADIUS = 16;

type Target = { x: number; y: number };
type Obstacle = { x: number; y: number; radius: number };

const targets = new Map<string, Target>();
const waitUntil = new Map<string, number>();
const lastPhysNodeId = new Map<string, string>();

function getObstacles(node: GameNode): Obstacle[] {
    const originX = node.column * CELL_SIZE;
    const originY = node.row * CELL_SIZE;
    const obstacles: Obstacle[] = [];
    for (const b of node.buildings.values())
        obstacles.push({ x: originX + b.posX, y: originY + b.posY, radius: BUILDING_RADIUS });
    for (const obj of node.worldObjects.values())
        obstacles.push({ x: originX + obj.posX, y: originY + obj.posY, radius: TREE_RADIUS });
    return obstacles;
}

function isClearOfObstacles(x: number, y: number, obstacles: Obstacle[]): boolean {
    for (const { x: ox, y: oy, radius } of obstacles) {
        const dx = x - ox, dy = y - oy;
        if (dx * dx + dy * dy < radius * radius) return false;
    }
    return true;
}

function randomPointOnNode(col: number, row: number, obstacles: Obstacle[]): Target {
    const margin = 16;
    for (let attempt = 0; attempt < 10; attempt++) {
        const x = col * CELL_SIZE + margin + Math.random() * (CELL_SIZE - margin * 2);
        const y = row * CELL_SIZE + margin + Math.random() * (CELL_SIZE - margin * 2);
        if (isClearOfObstacles(x, y, obstacles)) return { x, y };
    }
    return { x: col * CELL_SIZE + margin, y: row * CELL_SIZE + margin };
}

function applyObstacleRepulsion(unit: { posX: number; posY: number }, obstacles: Obstacle[]): void {
    for (const { x: ox, y: oy, radius } of obstacles) {
        const dx = unit.posX - ox, dy = unit.posY - oy;
        const distSq = dx * dx + dy * dy;
        if (distSq < radius * radius && distSq > 0) {
            const dist = Math.sqrt(distSq);
            unit.posX += (dx / dist) * (radius - dist);
            unit.posY += (dy / dist) * (radius - dist);
        }
    }
}

function handleArrival(id: string, col: number, row: number, obstacles: Obstacle[]): boolean {
    const now = Date.now();
    const wait = waitUntil.get(id);
    if (!wait) {
        waitUntil.set(id, now + MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS));
        return true;
    }
    if (now < wait) return true;
    waitUntil.delete(id);
    targets.set(id, randomPointOnNode(col, row, obstacles));
    return false;
}

function handleNodeChange(state: GameRoomState, unit: { posX: number; posY: number }, id: string, isWorker: boolean): void {
    const { col, row } = worldToGrid(unit.posX, unit.posY);
    const physNodeId = `${col},${row}`;
    const prevPhysNodeId = lastPhysNodeId.get(id);
    if (physNodeId === prevPhysNodeId) return;

    lastPhysNodeId.set(id, physNodeId);
    if (prevPhysNodeId !== undefined && isWorker) {
        unassignWorker(state, id);
        const worker = state.workers.get(id);
        if (worker) tickWorker(state, worker, id);
    }
}

function tickUnit(
    state: GameRoomState,
    unit: { posX: number; posY: number; nodeId: string },
    id: string,
    dt: number,
    isWorker: boolean,
) {
    const node = state.nodes.get(unit.nodeId);
    if (!node) return;

    const obstacles = getObstacles(node);
    if (!targets.has(id)) targets.set(id, randomPointOnNode(node.column, node.row, obstacles));

    const target = targets.get(id)!;
    const dx = target.x - unit.posX;
    const dy = target.y - unit.posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ARRIVAL_THRESHOLD) {
        handleArrival(id, node.column, node.row, obstacles);
        return;
    }

    unit.posX += (dx / dist) * SPEED * dt;
    unit.posY += (dy / dist) * SPEED * dt;
    applyObstacleRepulsion(unit, obstacles);
    handleNodeChange(state, unit, id, isWorker);
}

export function tickUnitMovement(state: GameRoomState, deltaMs: number) {
    const dt = deltaMs / 1000;
    state.troops.forEach((unit, id) => tickUnit(state, unit, id, dt, false));
    state.workers.forEach((unit, id) => tickUnit(state, unit, id, dt, true));
}

export function removeUnitTarget(id: string, state?: GameRoomState) {
    targets.delete(id);
    waitUntil.delete(id);
    lastPhysNodeId.delete(id);
    if (state) unassignWorker(state, id);
}
