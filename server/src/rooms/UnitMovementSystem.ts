import { GameRoomState } from "./schema/GameRoomState.js";
import { CELL_SIZE } from "../../../shared/Constants.js";

const SPEED = 40; // pixels per second
const ARRIVAL_THRESHOLD = 4;

type Target = { x: number; y: number };
const targets = new Map<string, Target>();

function randomPointOnNode(): Target {
    const margin = 16;
    return {
        x: margin + Math.random() * (CELL_SIZE - margin * 2),
        y: margin + Math.random() * (CELL_SIZE - margin * 2),
    };
}

export function tickUnitMovement(state: GameRoomState, deltaMs: number) {
    const dt = deltaMs / 1000;

    state.units.forEach((unit, id) => {
        if (!targets.has(id)) targets.set(id, randomPointOnNode());

        const target = targets.get(id)!;
        const dx = target.x - unit.posX;
        const dy = target.y - unit.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ARRIVAL_THRESHOLD) {
            targets.set(id, randomPointOnNode());
            return;
        }

        unit.posX += (dx / dist) * SPEED * dt;
        unit.posY += (dy / dist) * SPEED * dt;
    });
}

export function removeUnitTarget(id: string) {
    targets.delete(id);
}
