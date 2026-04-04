import { Building, GameRoomState, Player } from "../../server/src/rooms/schema/GameRoomState";

const RESOURCES: { key: "wood" | "food"; label: string; icon: string }[] = [
    { key: "wood", label: "Wood", icon: "🪵" },
    { key: "food", label: "Food", icon: "🌾" },
];

const panel = document.getElementById("resource-panel")!;

export function updateResourcePanel(player: Player, buildings: Building[], state: GameRoomState, sessionId: string) {
    const maxPopulation = buildings.reduce((sum, b) => sum + (b.populationMaxIncrease ?? 0), 0);
    const population = [...state.units.values()].filter(u => u.ownerId === sessionId).length;

    const rows = RESOURCES
        .map(r => `<div class="res-row"><span class="res-icon">${r.icon}</span>
            <span class="res-label">${r.label}</span>
            <span class="res-value">${player.resources[r.key] ?? 0}</span></div>`);

    rows.unshift(`<div class="res-row"><span class="res-icon">🏠</span>
        <span class="res-label">Max population</span>
        <span class="res-value">${population} / ${maxPopulation}</span></div>`);

    panel.innerHTML = rows.join("");
}
