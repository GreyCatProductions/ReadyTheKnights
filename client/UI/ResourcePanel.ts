import { Building, Player } from "../../server/src/rooms/schema/GameRoomState";

const RESOURCES: { key: keyof Player; label: string; icon: string }[] = [
    { key: "population", label: "Population", icon: "⚔" },
    { key: "wood",     label: "Wood",     icon: "🪵" },
    { key: "food", label: "Food", icon: "🌾"},
];

const panel = document.getElementById("resource-panel")!;

export function updateResourcePanel(player: Player, buildings: Building[]) {
    const maxPopulation = buildings.reduce((sum, b) => sum + (b.populationMaxIncrease ?? 0), 0);

    const rows = RESOURCES
        .map(r => `<div class="res-row"><span class="res-icon">${r.icon}</span>
            <span class="res-label">${r.label}</span>
            <span class="res-value">${player[r.key] ?? 0}</span></div>`);

    rows.unshift(`<div class="res-row"><span class="res-icon">🏠</span>
        <span class="res-label">Max population</span>
        <span class="res-value">${maxPopulation}</span></div>`);

    panel.innerHTML = rows.join("");
}
