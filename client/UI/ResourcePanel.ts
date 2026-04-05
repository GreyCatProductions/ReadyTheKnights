import { Building, GameRoomState, Player } from "../../server/src/rooms/schema/GameRoomState";
import { UnitType } from "../../shared/Units.js";

const RESOURCES: { key: "wood" | "food"; label: string; icon: string }[] = [
    { key: "wood", label: "Wood", icon: "🪵" },
    { key: "food", label: "Food", icon: "🌾" },
];

const UNIT_LABELS: Partial<Record<UnitType, string>> = {
    [UnitType.ArmedPeasant]: "Armed Peasant",
    [UnitType.Spearman]:     "Spearman",
    [UnitType.Maceman]:      "Maceman",
    [UnitType.Pikeman]:      "Pikeman",
    [UnitType.Swordsman]:    "Swordsman",
    [UnitType.Knight]:       "Knight",
};

const panel = document.getElementById("resource-panel")!;

export function updateResourcePanel(player: Player, buildings: Building[], state: GameRoomState, sessionId: string) {
    const maxPopulation = buildings.reduce((sum, b) => sum + (b.populationMaxIncrease ?? 0), 0);

    const workerCount = [...state.workers.values()].filter(u => u.ownerId === sessionId).length;

    // Count troops by type
    const troopCounts = new Map<string, number>();
    state.troops.forEach(u => {
        if (u.ownerId !== sessionId) return;
        troopCounts.set(u.type, (troopCounts.get(u.type) ?? 0) + 1);
    });
    const totalTroops = [...troopCounts.values()].reduce((s, n) => s + n, 0);

    const rows = RESOURCES
        .map(r => `<div class="res-row"><span class="res-icon">${r.icon}</span>
            <span class="res-label">${r.label}</span>
            <span class="res-value">${player.resources[r.key] ?? 0}</span></div>`);

    // Population row
    rows.unshift(`<div class="res-row"><span class="res-icon">🏠</span>
        <span class="res-label">Population</span>
        <span class="res-value">${workerCount + totalTroops} / ${maxPopulation}</span></div>`);

    // Workers row
    rows.push(`<div class="res-row"><span class="res-icon">⚒️</span>
        <span class="res-label">Workers</span>
        <span class="res-value">${workerCount}</span></div>`);

    // Per-type troop rows
    for (const [type, count] of troopCounts) {
        const label = UNIT_LABELS[type as UnitType] ?? type;
        rows.push(`<div class="res-row"><span class="res-icon">⚔️</span>
            <span class="res-label">${label}</span>
            <span class="res-value">${count}</span></div>`);
    }

    panel.innerHTML = rows.join("");
}
