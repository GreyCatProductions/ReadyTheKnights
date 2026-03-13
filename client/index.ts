import { Client } from "@colyseus/sdk";
import { Application, Container } from "pixi.js";
import { GameRoomState } from "../server/src/rooms/schema/GameRoomState";
import { Callbacks } from "@colyseus/schema";
import { renderMap, refreshNode } from "./Rendering/MapRenderer";
import { setupUnitRenderer } from "./Rendering/UnitRenderer";
import { setupTroopMoveOverlay } from "./Rendering/TroopMoveOverlay";
import { setupHUD } from "./UI/HUD";
import { setupCardHand } from "./UI/CardHand";
import { setupCamera } from "./Camera";
import { LoadAssets } from "./AssetLoader";

export { CELL_SIZE } from "../shared/Constants";

const client = new Client("ws://localhost:2567");
const app = new Application();

(async () => {
    await app.init({ resizeTo: window, backgroundColor: 0x898989 });
    document.getElementById("game")!.appendChild(app.canvas);
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    const world = new Container();
    const unitLayer = new Container();
    app.stage.addChild(world);
    app.stage.addChild(unitLayer);

    setupCamera(app, world, unitLayer);
    const overlay = setupTroopMoveOverlay(app, world, (from, to, count) => {
        console.log("Requesting to send troops", { from, to, count });
        room.send("move_troops", { from, to, count });
    });

    await LoadAssets();

    console.log("Joining room...");
    const room = await client.joinOrCreate<GameRoomState>("my_room");
    console.log("Joined successfully!");

    room.onStateChange.once((state) => {
        renderMap(state.map, world, room.sessionId, overlay);

        const callbacks = Callbacks.get(room);

        callbacks.onAdd(state.map, "nodes", (node, id) => {
            refreshNode(id, node, room.sessionId);
            callbacks.onChange(node, () => refreshNode(id, node, room.sessionId));
            callbacks.onAdd(node, "buildings", () => refreshNode(id, node, room.sessionId));
            callbacks.onRemove(node, "buildings", () => refreshNode(id, node, room.sessionId));
        });

        setupUnitRenderer(app, state, unitLayer, callbacks);
    });

    setupHUD(app, room);
    setupCardHand(app, [
        { label: "Card 1" },
        { label: "Card 2" },
        { label: "Card 3" },
    ]);
})();
