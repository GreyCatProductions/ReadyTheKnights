import { GameNode, GameRoomState } from "./schema/GameRoomState.js";
import { CELL_SIZE, worldToGrid, BUILDING_OBSTACLE_RADIUS, TREE_OBSTACLE_RADIUS, UNIT_OBSTACLE_RADIUS } from "../../../shared/Constants.js";
import { unassignWorker, tickWorker } from "./WorkerSystem.js";

const SPEED = 40; // pixels per second
const ARRIVAL_THRESHOLD = 4;
const MIN_WAIT_MS = 1000;
const MAX_WAIT_MS = 5000;

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
        obstacles.push({ x: originX + b.posX, y: originY + b.posY, radius: BUILDING_OBSTACLE_RADIUS });
    for (const obj of node.worldObjects.values())
        obstacles.push({ x: originX + obj.posX, y: originY + obj.posY, radius: TREE_OBSTACLE_RADIUS });
    return obstacles;
}

function isClearOfObstacles(x: number, y: number, obstacles: Obstacle[]): boolean {
    for (const { x: ox, y: oy, radius } of obstacles) {
        const r = radius + UNIT_OBSTACLE_RADIUS;
        const dx = x - ox, dy = y - oy;
        if (dx * dx + dy * dy < r * r) return false;
    }
    return true;
}

function hasLineOfSight(x1: number, y1: number, x2: number, y2: number, obstacles: Obstacle[]): boolean {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return true;
    for (const { x: ox, y: oy, radius } of obstacles) {
        const r = radius + UNIT_OBSTACLE_RADIUS;
        const fx = x1 - ox, fy = y1 - oy;
        const t = Math.max(0, Math.min(1, -(fx * dx + fy * dy) / lenSq));
        const cx = fx + t * dx, cy = fy + t * dy;
        if (cx * cx + cy * cy < r * r) return false;
    }
    return true;
}

const NODE_MARGIN = 16;
const ANGLE_STEPS = 24;
const MIN_DIST = 20;

function randomPointOnNode(col: number, row: number, obstacles: Obstacle[], fromX: number, fromY: number): Target | null {
    const nodeX = col * CELL_SIZE;
    const nodeY = row * CELL_SIZE;
    const maxDist = CELL_SIZE * 0.6;
    const angleOffset = Math.random() * Math.PI * 2;
    const fromClear = isClearOfObstacles(fromX, fromY, obstacles); 

    for (let i = 0; i < ANGLE_STEPS; i++) {
        const angle = angleOffset + (i / ANGLE_STEPS) * Math.PI * 2;
        const dist = MIN_DIST + Math.random() * (maxDist - MIN_DIST);
        const x = fromX + Math.cos(angle) * dist;
        const y = fromY + Math.sin(angle) * dist;

        if (x < nodeX + NODE_MARGIN || x > nodeX + CELL_SIZE - NODE_MARGIN) continue;
        if (y < nodeY + NODE_MARGIN || y > nodeY + CELL_SIZE - NODE_MARGIN) continue;
        if (!isClearOfObstacles(x, y, obstacles)) continue;
        if (fromClear && !hasLineOfSight(fromX, fromY, x, y, obstacles)) continue;

        return { x, y };
    }
    return null;
}

function handleArrival(id: string, col: number, row: number, obstacles: Obstacle[], fromX: number, fromY: number): boolean {
    const now = Date.now();
    const wait = waitUntil.get(id);
    if (!wait) {
        waitUntil.set(id, now + MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS));
        return true;
    }
    if (now < wait) return true;
    waitUntil.delete(id);
    const pt = randomPointOnNode(col, row, obstacles, fromX, fromY);
    if (pt) targets.set(id, pt);
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
    const targetNode = state.nodes.get(unit.nodeId);
    if (!targetNode) return;

    const { col: physCol, row: physRow } = worldToGrid(unit.posX, unit.posY);
    const onTargetNode = physCol === targetNode.column && physRow === targetNode.row;
    const physNode = [...state.nodes.entries()].find(([, n]) => n.column === physCol && n.row === physRow)?.[1] ?? targetNode;
    const obstacles = getObstacles(physNode);

    // Still crossing to the target node
    if (!onTargetNode) {
        targets.delete(id);
        const cx = targetNode.column * CELL_SIZE + CELL_SIZE / 2;
        const cy = targetNode.row * CELL_SIZE + CELL_SIZE / 2;
        const dx = cx - unit.posX, dy = cy - unit.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > ARRIVAL_THRESHOLD) {
            unit.posX += (dx / dist) * SPEED * dt;
            unit.posY += (dy / dist) * SPEED * dt;
        }
        handleNodeChange(state, unit, id, isWorker);
        return;
    }

    if (!targets.has(id)) {
        const pt = randomPointOnNode(targetNode.column, targetNode.row, obstacles, unit.posX, unit.posY);
        if (pt) targets.set(id, pt);
    }

    // Invalidate target if lost LOS and not in obs
    const existing = targets.get(id);
    if (existing && isClearOfObstacles(unit.posX, unit.posY, obstacles)
        && !hasLineOfSight(unit.posX, unit.posY, existing.x, existing.y, obstacles)) {
        targets.delete(id);
        return;
    }

    const target = targets.get(id);
    if (!target) return;

    const dx = target.x - unit.posX;
    const dy = target.y - unit.posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ARRIVAL_THRESHOLD) {
        handleArrival(id, targetNode.column, targetNode.row, obstacles, unit.posX, unit.posY);
        return;
    }

    unit.posX += (dx / dist) * SPEED * dt;
    unit.posY += (dy / dist) * SPEED * dt;
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
