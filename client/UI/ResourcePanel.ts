import { Player } from "../../server/src/rooms/schema/GameRoomState";

const RESOURCES: { key: keyof Player; label: string; icon: string }[] = [
    { key: "manpower", label: "Manpower", icon: "⚔" },
    { key: "wood",     label: "Wood",     icon: "🪵" },
];

const panel = document.getElementById("resource-panel")!;

export function updateResourcePanel(player: Player) {
    panel.innerHTML = RESOURCES
        .map(r => `<div class="res-row"><span class="res-icon">${r.icon}</span>
            <span class="res-label">${r.label}</span>
            <span class="res-value">${player[r.key] ?? 0}</span></div>`)
        .join("");
}
