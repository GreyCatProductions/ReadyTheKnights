import { Client } from "@colyseus/sdk";
import { Application, Container } from "pixi.js";
import { GameRoomState } from "../server/src/rooms/schema/GameRoomState";
import { Callbacks } from "@colyseus/schema";
import { renderMap, refreshNode, nodeSprites } from "./Rendering/MapRenderer";
import { CELL_SIZE, worldToGrid } from "../shared/Constants";
import { setupUnitRenderer } from "./Rendering/UnitRenderer";
import { setupTroopMoveOverlay } from "./Rendering/TroopMoveOverlay";
import { setupHUD } from "./UI/HUD";
import { setupCardHand as setupOrders } from "./UI/CardHand";
import { setupCamera } from "./Camera";
import { LoadAssets } from "./AssetLoader";
import { Edict } from "../shared/Edicts";


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
            callbacks.onAdd(node, "buildings", (building) => {
                refreshNode(id, node, room.sessionId);
                callbacks.onChange(building, () => nodeSprites.get(id)?.updateWorkerLabel(node.buildings));
            });
            callbacks.onRemove(node, "buildings", () => refreshNode(id, node, room.sessionId));
        });

        setupUnitRenderer(app, state, unitLayer, callbacks);
    });

    setupHUD(app, room);
    setupOrders(app, [
        { edict: Edict.HarvestEdict },
        { edict: Edict.LumberEdict },
        { edict: Edict.SettleEdict },
    ], (card, screenX, screenY) => {
        const worldX = screenX - world.x;
        const worldY = screenY - world.y;
        const { col, row } = worldToGrid(worldX, worldY);
        const nodeId = [...nodeSprites.entries()]
            .find(([, sprite]) => sprite.x / CELL_SIZE === col && sprite.y / CELL_SIZE === row)?.[0];
        if (!nodeId) return;
        console.log(`Issuing ${card.edict} to node ${nodeId}`);
        room.send("edict", { nodeId, edict: card.edict });
    });
})();
