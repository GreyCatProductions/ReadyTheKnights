import { Application, Graphics, Container } from "pixi.js";
import { Callbacks } from "@colyseus/schema";
import { GameRoomState } from "../../server/src/rooms/schema/GameRoomState";

const unitGraphics = new Map<string, Graphics>();
const ownerColors = new Map<string, number>();
const LERP = 0.2;
const SNAP_PX_DISTANCE = 16; //snap to target if further than that

function getOwnerColor(ownerId: string): number {
    if (!ownerColors.has(ownerId)) ownerColors.set(ownerId, Math.random() * 0xffffff);
    return ownerColors.get(ownerId)!;
}

export function setupUnitRenderer(
    app: Application,
    state: GameRoomState,
    unitLayer: Container,
    callbacks: ReturnType<typeof Callbacks.get>
) {
    callbacks.onAdd(state, "units", (unit, id) => {
        const g = new Graphics();
        g.circle(0, 0, 8).fill(getOwnerColor(unit.ownerId));
        g.x = unit.posX;
        g.y = unit.posY;
        unitLayer.addChild(g);
        unitGraphics.set(id, g);
    });

    callbacks.onRemove(state, "units", (_unit, id) => {
        const g = unitGraphics.get(id);
        if (g) { unitLayer.removeChild(g); g.destroy(); unitGraphics.delete(id); }
    });

    app.ticker.add(() => {
        state.units.forEach((unit, id) => {
            const g = unitGraphics.get(id);
            const targetX = unit.posX;
            const targetY = unit.posY;

            if (!g) return;

            const rawDx = targetX - g.x;
            const rawDy = targetY - g.y;

            if (Math.abs(rawDx) + Math.abs(rawDy) > SNAP_PX_DISTANCE) {
                g.x = targetX;
                g.y = targetY;
            } else {
                g.x += rawDx * LERP;
                g.y += rawDy * LERP;
            }
        });
    });
}
