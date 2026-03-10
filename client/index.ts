import { Client } from "@colyseus/sdk";
import { Assets, Application, Container } from "pixi.js";
import { GameRoomState } from "../server/src/rooms/schema/GameRoomState";
import { Callbacks } from "@colyseus/schema";
import { renderMap, refreshNode } from "./Rendering/MapRenderer";
import { setupUnitRenderer } from "./Rendering/UnitRenderer";
import { setupHUD } from "./UI/HUD";
import { setupCamera } from "./Camera";

export { CELL_SIZE } from "../shared/Constants";

const client = new Client("ws://localhost:2567");
const app = new Application();

(async () => {
    await app.init({ resizeTo: window, backgroundColor: 0x898989 });
    document.getElementById("game")!.appendChild(app.canvas);
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    const world     = new Container();
    const unitLayer = new Container();
    app.stage.addChild(world);
    app.stage.addChild(unitLayer);

    setupCamera(app, world, unitLayer);

    Assets.add({ alias: 'base', src: 'sprites/buildings/base.png' });
    await Assets.load('base');

    console.log("Joining room...");
    const room = await client.joinOrCreate<GameRoomState>("my_room");
    console.log("Joined successfully!");

    room.onStateChange.once((state) => {
        renderMap(state.map, world);

        const callbacks = Callbacks.get(room);

        callbacks.onAdd(state.map, "nodes", (node, id) => {
            refreshNode(id, node, room.sessionId);
            callbacks.onChange(node,     () => refreshNode(id, node, room.sessionId));
            callbacks.onAdd(node,    "buildings", () => refreshNode(id, node, room.sessionId));
            callbacks.onRemove(node, "buildings", () => refreshNode(id, node, room.sessionId));
        });

        setupUnitRenderer(app, state, unitLayer, callbacks);
    });

    setupHUD(app, room);
})();
