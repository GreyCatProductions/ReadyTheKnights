import { Application, Container, Graphics, Text } from "pixi.js";
import { CELL_SIZE } from "../../shared/Constants.js";

const DRAG_START_PX = 8;
const ARROWHEAD_LEN = 18;
const ARROWHEAD_ANG = Math.PI / 6;
const STROKE = { width: 3, color: 0xffffff, alpha: 0.9 };

export function setupTroopMoveOverlay(app: Application, world: Container,
    onComplete: (fromNodeId: string, toNodeId: string, count: number) => void) {
    const arrowGraphicsConstruct = new Graphics();
    const countText = new Text({
        text: '1',
        style: { fill: '#ffffff', fontSize: 15, fontWeight: 'bold' },
    });
    countText.visible = false;
    app.stage.addChild(arrowGraphicsConstruct);
    app.stage.addChild(countText);

    let isDragging = false;
    let srcX = 0, srcY = 0;
    let curX = 0, curY = 0;
    let unitCount = 1;

    let pendingCol = -1, pendingRow = -1, pendingStartX = 0, pendingStartY = 0;

    let fromNodeId = '';

    function redraw() {
        arrowGraphicsConstruct.clear();
        countText.visible = false;
        if (!isDragging) return;

        const dx = curX - srcX;
        const dy = curY - srcY;
        if (Math.sqrt(dx * dx + dy * dy) < 2) return;

        // Shaft
        arrowGraphicsConstruct.moveTo(srcX, srcY).lineTo(curX, curY).stroke(STROKE);

        // Arrowhead
        const angle = Math.atan2(dy, dx);
        arrowGraphicsConstruct.moveTo(curX, curY)
            .lineTo(curX - ARROWHEAD_LEN * Math.cos(angle - ARROWHEAD_ANG),
                curY - ARROWHEAD_LEN * Math.sin(angle - ARROWHEAD_ANG))
            .stroke(STROKE);
        arrowGraphicsConstruct.moveTo(curX, curY)
            .lineTo(curX - ARROWHEAD_LEN * Math.cos(angle + ARROWHEAD_ANG),
                curY - ARROWHEAD_LEN * Math.sin(angle + ARROWHEAD_ANG))
            .stroke(STROKE);

        // Unit count badge at midpoint
        const midX = (srcX + curX) / 2;
        const midY = (srcY + curY) / 2;
        arrowGraphicsConstruct.circle(midX, midY, 14).fill({ color: 0x111111, alpha: 0.85 });
        countText.text = String(unitCount);
        countText.x = midX - countText.width / 2;
        countText.y = midY - countText.height / 2;
        countText.visible = true;
    }

    app.canvas.addEventListener('pointermove', (e: PointerEvent) => {
        if (!(e.buttons & 2)) return;

        if (!isDragging && pendingCol >= 0) {
            const dx = e.clientX - pendingStartX;
            const dy = e.clientY - pendingStartY;
            if (Math.sqrt(dx * dx + dy * dy) > DRAG_START_PX) {
                srcX = pendingCol * CELL_SIZE + CELL_SIZE / 2 + world.x;
                srcY = pendingRow * CELL_SIZE + CELL_SIZE / 2 + world.y;
                curX = e.clientX;
                curY = e.clientY;
                unitCount = 1;
                isDragging = true;
            }
        }

        if (isDragging) {
            curX = e.clientX;
            curY = e.clientY;
            redraw();
        }
    });

    app.canvas.addEventListener('pointerup', (e: PointerEvent) => {
        if (e.button !== 2) return;
        pendingCol = -1;
        isDragging = false;
        arrowGraphicsConstruct.clear();
        countText.visible = false;
    });

    app.canvas.addEventListener('wheel', (e: WheelEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        unitCount = Math.max(1, unitCount + (e.deltaY < 0 ? 1 : -1));
        redraw();
    }, { passive: false });

    return {
        get isDragging() { return isDragging; },
        beginDrag(nodeId: string, col: number, row: number, screenX: number, screenY: number) {
            fromNodeId = nodeId
            pendingCol = col;
            pendingRow = row;
            pendingStartX = screenX;
            pendingStartY = screenY;
        },
        completeDrag(toNodeId: string){
            if(!isDragging || toNodeId === fromNodeId) return;
            onComplete(fromNodeId, toNodeId, unitCount);
        }
    };
}

export type TroopMoveOverlay = ReturnType<typeof setupTroopMoveOverlay>;
