import { Unit, GameRoomState } from "./schema/GameRoomState.js";

const STARVATION_DAMAGE = 10;

export function consumeFood(state: GameRoomState) {
    // Group units by owner, sorted ascending by foodDemand (low demand eats first)
    const byPlayer = new Map<string, Unit[]>();
    state.units.forEach(unit => {
        if (!byPlayer.has(unit.ownerId)) byPlayer.set(unit.ownerId, []);
        byPlayer.get(unit.ownerId)!.push(unit);
    });

    byPlayer.forEach((units, ownerId) => {
        const player = state.players.get(ownerId);
        if (!player) return;

        units.sort((a, b) => a.foodDemand - b.foodDemand);

        for (const unit of units) {
            if (player.food >= unit.foodDemand) {
                player.food -= unit.foodDemand;
            } else {
                player.food = 0;
                unit.hp -= STARVATION_DAMAGE;
            }
        }
    });
}
