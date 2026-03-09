import { Client, Room } from "@colyseus/sdk";
import { Application, Container, Text } from "pixi.js";
import { GameMap, GameRoomState } from "../server/src/rooms/schema/GameRoomState";
import { NodeSprite } from "./MapRendering/NodeSprite";

export const CELL_SIZE = 128;
const MARGIN = 256;

const client = new Client("ws://localhost:2567");
let room: Room<GameRoomState> | null = null;
const app = new Application();

let mapBounds = { left: 0, right: 0, top: 0, bottom: 0 };


(async () => {
    await app.init({
        resizeTo: window,
        backgroundColor: 0x898989,
    });

    document.getElementById("game")!.appendChild(app.canvas);

    const world = new Container();
    app.stage.addChild(world);

    app.canvas.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault());

    let isPanning = false;
    let lastX = 0, lastY = 0;

    app.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
        if (e.button !== 0) return;
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });
    app.canvas.addEventListener("pointermove", (e: PointerEvent) => {
        if (!isPanning) return;
        world.x += e.clientX - lastX;
        world.y += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        clampWorld(world);
    });
    app.canvas.addEventListener("pointerup",    (e: PointerEvent) => { if (e.button !== 0) return; isPanning = false; });
    app.canvas.addEventListener("pointerleave", () => { isPanning = false; });

    console.log("Joining room...");
    room = await client.joinOrCreate("my_room");
    console.log("Joined successfully!");

    room.onStateChange.once((state) => {
        renderMap(state.map, world);
    });

    const timerEl    = document.getElementById("timer")!;
    const dayEl      = document.getElementById("day")!;
    const statePanel = document.getElementById("state-panel")!;
    let dayEndTimestamp = 0;
    let currentDay = 0;

    room.onStateChange((state) => {
        dayEndTimestamp = state.dayEndTimestamp;
        currentDay      = state.currentDay;
        dayEl.textContent = `Day ${currentDay}`;

        const playerIds = [...state.players.keys()];
        statePanel.textContent =
            `Day: ${state.currentDay}\n` +
            `dayEndTimestamp: ${dayEndTimestamp - Date.now()}\n` +
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
})();

function clampWorld(world: Container) {
    world.x = Math.max(world.x, MARGIN - mapBounds.right);
    world.x = Math.min(world.x, app.screen.width - mapBounds.left - MARGIN);
    world.y = Math.max(world.y, MARGIN - mapBounds.bottom);
    world.y = Math.min(world.y, app.screen.height - mapBounds.top - MARGIN);
}

function renderMap(map: GameMap, world: Container) {
    let minCol = Infinity, maxCol = -Infinity;
    let minRow = Infinity, maxRow = -Infinity;

    map.nodes.forEach((node) => {
        minCol = Math.min(minCol, node.column);
        maxCol = Math.max(maxCol, node.column);
        minRow = Math.min(minRow, node.row);
        maxRow = Math.max(maxRow, node.row);

        world.addChild(new NodeSprite(node));
    });

    mapBounds = {
        left:   minCol * CELL_SIZE,
        right:  (maxCol + 1) * CELL_SIZE,
        top:    minRow * CELL_SIZE,
        bottom: (maxRow + 1) * CELL_SIZE,
    };

    console.log("Map drawn!");
}
