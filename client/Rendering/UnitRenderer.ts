import { Application, Graphics, Container } from "pixi.js";
import { Callbacks } from "@colyseus/schema";
import { GameRoomState, Troop, Worker } from "../../server/src/rooms/schema/GameRoomState";

const troopGraphics  = new Map<string, Graphics>();
const workerGraphics = new Map<string, Graphics>();
const ownerColors    = new Map<string, number>();
const LERP = 0.2;
const SNAP_PX_DISTANCE = 16;

function getOwnerColor(ownerId: string): number {
    if (!ownerColors.has(ownerId)) ownerColors.set(ownerId, Math.random() * 0xffffff);
    return ownerColors.get(ownerId)!;
}

function drawTroop(g: Graphics, unit: Troop) {
    g.clear();
    g.circle(0, 0, 8).fill(getOwnerColor(unit.ownerId));

    if (unit.hp < unit.maxHp) {
        const BAR_W = 16, BAR_H = 3, BAR_Y = -14;
        const ratio = Math.max(0, unit.hp / unit.maxHp);
        const barColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddaa00 : 0xdd2222;
        g.rect(-BAR_W / 2, BAR_Y, BAR_W, BAR_H).fill(0x222222);
        g.rect(-BAR_W / 2, BAR_Y, BAR_W * ratio, BAR_H).fill(barColor);
    }
}

function drawWorker(g: Graphics, unit: Worker) {
    g.clear();
    g.rect(-5, -5, 10, 10).fill(getOwnerColor(unit.ownerId));

    if (unit.hp < unit.maxHp) {
        const BAR_W = 16, BAR_H = 3, BAR_Y = -14;
        const ratio = Math.max(0, unit.hp / unit.maxHp);
        const barColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddaa00 : 0xdd2222;
        g.rect(-BAR_W / 2, BAR_Y, BAR_W, BAR_H).fill(0x222222);
        g.rect(-BAR_W / 2, BAR_Y, BAR_W * ratio, BAR_H).fill(barColor);
    }
}

export function setupUnitRenderer(
    app: Application,
    state: GameRoomState,
    unitLayer: Container,
    callbacks: ReturnType<typeof Callbacks.get>
) {
    // Troops
    callbacks.onAdd(state, "troops", (unit, id) => {
        const g = new Graphics();
        drawTroop(g, unit);
        g.x = unit.posX;
        g.y = unit.posY;
        unitLayer.addChild(g);
        troopGraphics.set(id, g);

        callbacks.onChange(unit, () => {
            const g = troopGraphics.get(id);
            if (g) drawTroop(g, unit);
        });
    });

    callbacks.onRemove(state, "troops", (_unit, id) => {
        const g = troopGraphics.get(id);
        if (g) { unitLayer.removeChild(g); g.destroy(); troopGraphics.delete(id); }
    });

    // Workers
    callbacks.onAdd(state, "workers", (unit, id) => {
        const g = new Graphics();
        drawWorker(g, unit);
        g.x = unit.posX;
        g.y = unit.posY;
        unitLayer.addChild(g);
        workerGraphics.set(id, g);

        callbacks.onChange(unit, () => {
            const g = workerGraphics.get(id);
            if (g) drawWorker(g, unit);
        });
    });

    callbacks.onRemove(state, "workers", (_unit, id) => {
        const g = workerGraphics.get(id);
        if (g) { unitLayer.removeChild(g); g.destroy(); workerGraphics.delete(id); }
    });

    function lerpUnit(unit: { posX: number; posY: number }, g: Graphics) {
        const dx = unit.posX - g.x;
        const dy = unit.posY - g.y;
        if (Math.abs(dx) + Math.abs(dy) > SNAP_PX_DISTANCE) {
            g.x = unit.posX; g.y = unit.posY;
        } else {
            g.x += dx * LERP; g.y += dy * LERP;
        }
    }

    app.ticker.add(() => {
        state.troops.forEach((unit, id)  => { const g = troopGraphics.get(id);  if (g) lerpUnit(unit, g); });
        state.workers.forEach((unit, id) => { const g = workerGraphics.get(id); if (g) lerpUnit(unit, g); });
    });
}
