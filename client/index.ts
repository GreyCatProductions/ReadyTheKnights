import { Client, Room } from "@colyseus/sdk";
import { Assets, Application, Container, Graphics } from "pixi.js";
import { GameMap, GameNode, GameRoomState } from "../server/src/rooms/schema/GameRoomState";
import { NodeSprite } from "./MapRendering/NodeSprite";
import { updateResourcePanel } from "./UI/ResourcePanel";
import { Callbacks } from "@colyseus/schema";
import { CELL_SIZE } from "../shared/Constants"

const MARGIN = 256;

const client = new Client("ws://localhost:2567");
let room: Room<GameRoomState> | null = null;
const app = new Application();

let mapBounds = { left: 0, right: 0, top: 0, bottom: 0 };
const nodeSprites = new Map<string, NodeSprite>();
const unitGraphics = new Map<string, Graphics>();
const ownerColors = new Map<string, number>();

function getOwnerColor(ownerId: string): number {
    if (!ownerColors.has(ownerId)) ownerColors.set(ownerId, Math.random() * 0xffffff);
    return ownerColors.get(ownerId)!;
}


(async () => {
    await app.init({
        resizeTo: window,
        backgroundColor: 0x898989,
    });

    document.getElementById("game")!.appendChild(app.canvas);

    const world = new Container();
    const unitLayer = new Container();
    app.stage.addChild(world);
    app.stage.addChild(unitLayer);

    document.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault());

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
        unitLayer.x = world.x;
        unitLayer.y = world.y;
        lastX = e.clientX;
        lastY = e.clientY;
        clampWorld(world);
    });
    app.canvas.addEventListener("pointerup", (e: PointerEvent) => { if (e.button !== 0) return; isPanning = false; });
    app.canvas.addEventListener("pointerleave", () => { isPanning = false; });

    Assets.add({ alias: 'base', src: 'sprites/buildings/base.png' });
    await Assets.load('base');

    console.log("Joining room...");
    room = await client.joinOrCreate("my_room");
    console.log("Joined successfully!");

    room.onStateChange.once((state) => {
        renderMap(state.map, world);

        const callbacks = Callbacks.get(room!);

        callbacks.onAdd(state.map, "nodes", (node, id) => {
            refreshNode(id, node);
            callbacks.onChange(node, () => refreshNode(id, node));
            callbacks.onAdd(node, "buildings", () => refreshNode(id, node));
            callbacks.onRemove(node, "buildings", () => refreshNode(id, node));
        });

        callbacks.onAdd(state, "units", (unit, id) => {
            const g = new Graphics();
            g.circle(0, 0, 8).fill(getOwnerColor(unit.ownerId));
            unitLayer.addChild(g);
            unitGraphics.set(id, g);
        });
        callbacks.onRemove(state, "units", (_unit, id) => {
            const g = unitGraphics.get(id);
            if (g) { unitLayer.removeChild(g); g.destroy(); unitGraphics.delete(id); }
        });
    });

    const timerEl = document.getElementById("timer")!;
    const dayEl = document.getElementById("day")!;
    const statePanel = document.getElementById("state-panel")!;
    let dayEndTimestamp = 0;
    let currentDay = 0;

    room.onStateChange((state) => {
        dayEndTimestamp = state.dayEndTimestamp;
        currentDay = state.currentDay;
        dayEl.textContent = `Day ${currentDay}`;

        const me = state.players.get(room!.sessionId);
        if (me) updateResourcePanel(me);

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

    app.ticker.add(() => {
        if (!room || !room.state.units) return;
        room.state.units.forEach((unit, id) => {
            const g = unitGraphics.get(id);
            const nodeSprite = nodeSprites.get(unit.nodeId);
            if (!g || !nodeSprite) return;
            g.x = nodeSprite.x + unit.posX;
            g.y = nodeSprite.y + unit.posY;
        });
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

    map.nodes.forEach((node, id) => {
        minCol = Math.min(minCol, node.column);
        maxCol = Math.max(maxCol, node.column);
        minRow = Math.min(minRow, node.row);
        maxRow = Math.max(maxRow, node.row);

        const sprite = new NodeSprite(node, id);
        nodeSprites.set(id, sprite);
        world.addChild(sprite);
    });

    mapBounds = {
        left: minCol * CELL_SIZE,
        right: (maxCol + 1) * CELL_SIZE,
        top: minRow * CELL_SIZE,
        bottom: (maxRow + 1) * CELL_SIZE,
    };

    console.log("Map drawn!");
}


function refreshNode(id: string, node: GameNode) {
    const sprite = nodeSprites.get(id);
    if (!sprite) return;
    const color = node.ownerId === room!.sessionId ? 0x2255cc
        : node.ownerId !== "" ? 0xcc2222
            : 0x555555;
    sprite.setBackground(color);
    sprite.updateBuildings(node.buildings);
}

