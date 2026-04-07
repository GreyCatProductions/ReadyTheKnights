import { GameRoomState, Troop, Worker } from "./schema/GameRoomState.js";
import { v4 as uuid } from "uuid";
import { CELL_SIZE } from "../../../shared/Constants.js";
import { UNIT_DEFS } from "../../../shared/UnitDefs.js";
import { UnitType } from "../../../shared/Units.js";

export function spawnSoldier(state: GameRoomState, ownerId: string, nodeId: string, type: UnitType): void {
    const node = state.nodes.get(nodeId);
    if (!node) return;

    const def = UNIT_DEFS[type];
    const troop = new Troop();
    troop.type    = type;
    troop.ownerId = ownerId;
    troop.nodeId = nodeId;
    troop.posX = node.column * CELL_SIZE + CELL_SIZE / 2;
    troop.posY = node.row * CELL_SIZE + CELL_SIZE / 2;
    troop.hp = def.hp;
    troop.maxHp = def.hp;
    troop.foodDemand = def.foodDemand;
    troop.damage = def.damage ?? 0;
    state.troops.set(uuid(), troop);
}

export function spawnWorker(state: GameRoomState, ownerId: string, nodeId: string): void {
    const node = state.nodes.get(nodeId);
    if (!node) return;

    const def = UNIT_DEFS[UnitType.Worker];
    const worker = new Worker();
    worker.ownerId = ownerId;
    worker.nodeId = nodeId;
    worker.posX = node.column * CELL_SIZE + CELL_SIZE / 2;
    worker.posY = node.row * CELL_SIZE + CELL_SIZE / 2;
    worker.hp = def.hp;
    worker.maxHp = def.hp;
    worker.foodDemand = def.foodDemand;
    state.workers.set(uuid(), worker);
}
