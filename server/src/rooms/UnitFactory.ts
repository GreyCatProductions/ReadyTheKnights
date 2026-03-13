import { GameRoomState, Unit } from "./schema/GameRoomState.js";
import { v4 as uuid } from "uuid";
import { CELL_SIZE } from "../../../shared/Constants.js";

export function spawnUnit(state: GameRoomState, ownerId: string, nodeId: string): void {
    const node = state.map.nodes.get(nodeId);
    if (!node) return;

    const unit = new Unit();
    unit.ownerId = ownerId;
    unit.nodeId  = nodeId;
    unit.posX    = node.column * CELL_SIZE + CELL_SIZE / 2;
    unit.posY    = node.row    * CELL_SIZE + CELL_SIZE / 2;
    state.units.set(uuid(), unit);

    const player = state.players.get(ownerId);
    if (player) player.population += 1;
}
