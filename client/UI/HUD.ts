import { Application } from "pixi.js";
import { Room } from "@colyseus/sdk";
import { GameRoomState } from "../../server/src/rooms/schema/GameRoomState";
import { updateResourcePanel } from "./ResourcePanel";

export function setupHUD(app: Application, room: Room<GameRoomState>) {
    const timerEl   = document.getElementById("timer")!;
    const dayEl     = document.getElementById("day")!;
    const statePanel = document.getElementById("state-panel")!;

    let dayEndTimestamp = 0;

    room.onStateChange((state) => {
        dayEndTimestamp = state.dayEndTimestamp;
        dayEl.textContent = `Day ${state.currentDay}`;

        const me = state.players.get(room.sessionId);
        const buildings = [...state.map.nodes.values()].flatMap(node => [...node.buildings.values()]).filter(u => u.ownerId === room.sessionId);
        if (me) updateResourcePanel(me, buildings, state, room.sessionId);

        const playerIds = [...state.players.keys()];
        statePanel.textContent =
            `Day: ${state.currentDay}\n` +
            `Time left: ${Math.max(0, Math.floor((dayEndTimestamp - Date.now()) / 1000))}s\n` +
            `Players (${state.players.size}):\n` +
            (playerIds.length ? playerIds.map(id => `  ${id}`).join('\n') : '  none') + '\n' +
            `Nodes: ${state.map.nodes.size}`;
    });

    app.ticker.add(() => {
        if (!dayEndTimestamp) return;
        const remaining = Math.max(0, Math.floor((dayEndTimestamp - Date.now()) / 1000));
        const m = Math.floor(remaining / 60);
        const s = String(remaining % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
    });
}
