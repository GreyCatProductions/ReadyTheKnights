import { Unit, GameRoomState } from "./schema/GameRoomState.js";

const STARVATION_DAMAGE = 10;
const BASE_HEAL = 5;

export function consumeFood(state: GameRoomState) {
    // Group units by owner, sorted ascending by foodDemand (low demand eats first)
    const byPlayer = new Map<string, Unit[]>();
    state.troops.forEach(unit => {
        if (!byPlayer.has(unit.ownerId)) byPlayer.set(unit.ownerId, []);
        byPlayer.get(unit.ownerId)!.push(unit);
    });

    byPlayer.forEach((units, ownerId) => {
        const player = state.players.get(ownerId);
        if (!player) return;

        units.sort((a, b) => a.foodDemand - b.foodDemand || a.hp - b.hp);

        for (const unit of units) {
            if (player.resources.food >= unit.foodDemand) {
                player.resources.food -= unit.foodDemand;
                unit.hp = Math.min(unit.maxHp, unit.hp + BASE_HEAL);
            } else {
                player.resources.food = 0;
                unit.hp -= STARVATION_DAMAGE;
            }
        }
    });
}
