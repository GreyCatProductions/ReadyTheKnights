import { Application, Container, Graphics } from "pixi.js";
import { GameRoomState } from "../../server/src/rooms/schema/GameRoomState";
import { CELL_SIZE, BUILDING_OBSTACLE_RADIUS, TREE_OBSTACLE_RADIUS, UNIT_OBSTACLE_RADIUS } from "../../shared/Constants";

let enabled = false;
let debugLayer: Container | null = null;

export function setupDebugOverlay(app: Application, world: Container, state: GameRoomState) {
    debugLayer = new Container();
    world.addChild(debugLayer);

    window.addEventListener("keydown", (e) => {
        if (e.key !== "d" && e.key !== "D") return;
        enabled = !enabled;
        if (!enabled) debugLayer!.removeChildren();
    });

    app.ticker.add(() => {
        if (!enabled || !debugLayer) return;
        debugLayer.removeChildren();

        state.nodes.forEach((node) => {
            const originX = node.column * CELL_SIZE;
            const originY = node.row * CELL_SIZE;

            node.buildings.forEach((b) => {
                const g = new Graphics();
                const cx = originX + b.posX;
                const cy = originY + b.posY;
                g.circle(cx, cy, BUILDING_OBSTACLE_RADIUS).stroke({ color: 0xff4400, alpha: 0.7, width: 1 });
                g.circle(cx, cy, BUILDING_OBSTACLE_RADIUS + UNIT_OBSTACLE_RADIUS).stroke({ color: 0xff4400, alpha: 0.3, width: 1 });
                debugLayer!.addChild(g);
            });

            node.worldObjects.forEach((obj) => {
                if (obj.type !== "tree") return;
                const g = new Graphics();
                const cx = originX + obj.posX;
                const cy = originY + obj.posY;
                g.circle(cx, cy, TREE_OBSTACLE_RADIUS).stroke({ color: 0x00cc44, alpha: 0.7, width: 1 });
                g.circle(cx, cy, TREE_OBSTACLE_RADIUS + UNIT_OBSTACLE_RADIUS).stroke({ color: 0x00cc44, alpha: 0.3, width: 1 });
                debugLayer!.addChild(g);
            });
        });
    });
}
