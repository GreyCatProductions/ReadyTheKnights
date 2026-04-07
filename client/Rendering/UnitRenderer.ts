import { Application, Graphics, Container, Text, TextStyle } from "pixi.js";
import { Callbacks } from "@colyseus/schema";
import { GameRoomState, Troop, Worker } from "../../server/src/rooms/schema/GameRoomState";
import { BUILDING_TOOLTIPS } from "../UI/tooltips/BuildingTooltips.js";
import { BuildingType } from "../../shared/Buildings.js";
import { attachTooltip } from "../UI/Tooltip.js";
import { CELL_SIZE } from "../../shared/Constants.js";
import { findBuildingById } from "../../shared/BuildingUtils.js";

const troopGraphics  = new Map<string, Graphics>();
const workerGraphics = new Map<string, Graphics>();
const workerDebugLabels = new Map<string, Text>();
const DEBUG_STYLE = new TextStyle({ fontSize: 9, fill: 0xffff00 });
const ownerColors    = new Map<string, number>();
const LERP = 0.2;
const SNAP_PX_DISTANCE = 16;

let selectedWorkerId: string | null = null;

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

function drawArrow(g: Graphics, x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const nx = dx / dist;
    const ny = dy / dist;

    // Start just outside the worker, end a bit before the target
    const sx = x1 + nx * 12;
    const sy = y1 + ny * 12;
    const ex = x2 - nx * 20;
    const ey = y2 - ny * 20;

    // Shaft
    g.moveTo(sx, sy).lineTo(ex, ey).stroke({ color: 0xffff00, width: 1.5, alpha: 0.8 });

    // Arrowhead
    const HEAD = 8;
    const WING = 4;
    const px = -ny;
    const py =  nx;
    g.poly([
        ex, ey,
        ex - nx * HEAD + px * WING, ey - ny * HEAD + py * WING,
        ex - nx * HEAD - px * WING, ey - ny * HEAD - py * WING,
    ]).fill({ color: 0xffff00, alpha: 0.8 });
}

export function setupUnitRenderer(
    app: Application,
    state: GameRoomState,
    unitLayer: Container,
    callbacks: ReturnType<typeof Callbacks.get>,
    stage: Container,
) {
    const selectionLayer = new Graphics();
    unitLayer.addChild(selectionLayer);

    // Deselect when clicking the stage background
    app.stage.on("pointerdown", () => { selectedWorkerId = null; });

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

        g.eventMode = "static";
        g.cursor = "pointer";
        g.on("pointerdown", (e) => {
            e.stopPropagation();
            selectedWorkerId = selectedWorkerId === id ? null : id;
        });

        attachTooltip(g, stage, () => {
            if (unit.assignedBuildingId) {
                const result = findBuildingById(state, unit.assignedBuildingId);
                const def = result ? BUILDING_TOOLTIPS[result.building.type as BuildingType] : undefined;
                return { name: "Worker", description: `Working at: ${def?.name ?? unit.assignedBuildingId}` };
            }
            return { name: "Worker", description: "Idle" };
        });

        const label = new Text({ text: "", style: DEBUG_STYLE });
        label.eventMode = "none";
        unitLayer.addChild(label);
        workerDebugLabels.set(id, label);

        callbacks.onChange(unit, () => {
            const g = workerGraphics.get(id);
            if (g) drawWorker(g, unit);
        });
    });

    callbacks.onRemove(state, "workers", (_unit, id) => {
        const g = workerGraphics.get(id);
        if (g) { unitLayer.removeChild(g); g.destroy(); workerGraphics.delete(id); }
        const label = workerDebugLabels.get(id);
        if (label) { unitLayer.removeChild(label); label.destroy(); workerDebugLabels.delete(id); }
        if (selectedWorkerId === id) selectedWorkerId = null;
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
        state.workers.forEach((unit, id) => {
            const g = workerGraphics.get(id);
            if (g) lerpUnit(unit, g);
            const label = workerDebugLabels.get(id);
            if (label && g) {
                label.text = `node:${unit.nodeId}\nbldg:${unit.assignedBuildingId || "-"}`;
                label.x = g.x + 8;
                label.y = g.y - 20;
            }
        });

        // Draw selection ring + direction arrow for selected worker
        selectionLayer.clear();
        if (!selectedWorkerId) return;

        const worker = state.workers.get(selectedWorkerId);
        const g = workerGraphics.get(selectedWorkerId);
        if (!worker || !g) { selectedWorkerId = null; return; }

        // Selection ring
        selectionLayer.circle(g.x, g.y, 10).stroke({ color: 0xffff00, width: 2 });

        // Arrow toward the node containing the assigned building
        if (worker.assignedBuildingId) {
            const result = findBuildingById(state, worker.assignedBuildingId);
            if (result) {
                const tx = result.node.column * CELL_SIZE + CELL_SIZE / 2;
                const ty = result.node.row    * CELL_SIZE + CELL_SIZE / 2;
                drawArrow(selectionLayer, g.x, g.y, tx, ty);
            }
        }
    });
}
