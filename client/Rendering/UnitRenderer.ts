import { Application, Graphics, Container } from "pixi.js";
import { Callbacks } from "@colyseus/schema";
import { GameRoomState } from "../../server/src/rooms/schema/GameRoomState";
import { BUILDING_COLOR } from "../AssetLoader.js";

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
    function drawUnit(g: Graphics, unit: { ownerId: string; assignedBuilding: string; hp: number; maxHp: number }) {
        g.clear();
        g.circle(0, 0, 8).fill(getOwnerColor(unit.ownerId));
        const buildingColor = BUILDING_COLOR[unit.assignedBuilding];
        if (buildingColor) g.circle(0, 0, 4).fill(buildingColor);

        if (unit.hp < unit.maxHp) {
            const BAR_W = 16, BAR_H = 3, BAR_Y = -14;
            const ratio = Math.max(0, unit.hp / unit.maxHp);
            const barColor = ratio > 0.5
                ? 0x44cc44
                : ratio > 0.25 ? 0xddaa00 : 0xdd2222;
            g.rect(-BAR_W / 2, BAR_Y, BAR_W, BAR_H).fill(0x222222);
            g.rect(-BAR_W / 2, BAR_Y, BAR_W * ratio, BAR_H).fill(barColor);
        }
    }

    callbacks.onAdd(state, "units", (unit, id) => {
        const g = new Graphics();
        drawUnit(g, unit);
        g.x = unit.posX;
        g.y = unit.posY;
        unitLayer.addChild(g);
        unitGraphics.set(id, g);

        callbacks.onChange(unit, () => {
            const g = unitGraphics.get(id);
            if (g) drawUnit(g, unit);
        });
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
