import { Application, Container } from "pixi.js";
import { mapBounds } from "./Rendering/MapRenderer";

const MARGIN = 256;

export function setupCamera(app: Application, world: Container, ...syncedLayers: Container[]) {
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
        clamp(app, world);
        for (const layer of syncedLayers) {
            layer.x = world.x;
            layer.y = world.y;
        }
        lastX = e.clientX;
        lastY = e.clientY;
    });

    app.canvas.addEventListener("pointerup",    (e: PointerEvent) => { if (e.button !== 0) return; isPanning = false; });
    app.canvas.addEventListener("pointerleave", () => { isPanning = false; });
}

function clamp(app: Application, world: Container) {
    world.x = Math.max(world.x, MARGIN - mapBounds.right);
    world.x = Math.min(world.x, app.screen.width  - mapBounds.left - MARGIN);
    world.y = Math.max(world.y, MARGIN - mapBounds.bottom);
    world.y = Math.min(world.y, app.screen.height - mapBounds.top  - MARGIN);
}
