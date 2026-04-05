import { Application, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import { Edict } from "../../shared/Edicts.js";
import { EDICT_SPRITE } from "../AssetLoader.js";
import { makeTooltip } from "./Tooltip.js";
import { EDICT_TOOLTIPS } from "./tooltips/EdictTooltips.js";
import { EdictCategory, EDICT_CATEGORY, CATEGORY_COLOR, CATEGORY_ACCENT } from "./EdictCategories.js";


const CARD_W = 90;
const CARD_H = 130;
const CARD_GAP = 14;
const CARD_BOTTOM_MARGIN = 20;
const CARD_RADIUS = 8;

export interface CardData {
    edict: Edict;
    color?: number;
}

function buildCardGraphic(card: CardData, alpha = 1): Container {
    const c = new Container();
    c.alpha = alpha;

    const category = EDICT_CATEGORY[card.edict];
    const bgColor  = card.color ?? CATEGORY_COLOR[category];
    const accent   = CATEGORY_ACCENT[category];

    const g = new Graphics();
    g.roundRect(0, 0, CARD_W, CARD_H, CARD_RADIUS).fill(bgColor);
    g.roundRect(0, 0, CARD_W, CARD_H, CARD_RADIUS).stroke({ width: 2, color: accent });
    g.roundRect(0, 0, CARD_W, 6, CARD_RADIUS).fill(accent);
    c.addChild(g);

    const icon = Sprite.from(EDICT_SPRITE[card.edict]);
    icon.width = 48;
    icon.height = 48;
    icon.anchor.set(0.5, 0);
    icon.x = CARD_W / 2;
    icon.y = 10;
    c.addChild(icon);

    const label = new Text({
        text: card.edict,
        style: new TextStyle({ fontSize: 11, fill: 0xffffff, wordWrap: true, wordWrapWidth: CARD_W - 10, align: "center" }),
    });
    label.anchor.set(0.5, 0);
    label.x = CARD_W / 2;
    label.y = 64;
    c.addChild(label);

    return c;
}

export let isDraggingCard = false;

export function setupCardHand(
    app: Application,
    cards: CardData[],
    onDrop?: (card: CardData, screenX: number, screenY: number) => void,
    onHover?: (card: CardData, screenX: number, screenY: number) => boolean,
): { setCards: (cards: CardData[]) => void } {
    const container = new Container();
    app.stage.addChild(container);

    const { container: tooltipContainer, setContent: setTooltipContent } = makeTooltip();
    tooltipContainer.visible = false;
    app.stage.addChild(tooltipContainer);

    let ghost: Container | null = null;
    let dragCard: CardData | null = null;

    const TRAY_PAD_X = 18;
    const TRAY_PAD_Y = 12;

    const CATEGORY_GAP = 20;
    const LABEL_H = 18;

    function render(cards: CardData[]) {
        container.removeChildren();

        // Group cards by category, preserving order of first appearance
        const groups = new Map<EdictCategory, CardData[]>();
        for (const card of cards) {
            const cat = EDICT_CATEGORY[card.edict];
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat)!.push(card);
        }

        // Calculate total width across all groups
        let totalW = 0;
        groups.forEach((groupCards) => {
            totalW += groupCards.length * CARD_W + (groupCards.length - 1) * CARD_GAP + TRAY_PAD_X * 2;
        });
        totalW += (groups.size - 1) * CATEGORY_GAP;

        let curX = (app.screen.width - totalW) / 2;
        const cardY = app.screen.height - CARD_H - CARD_BOTTOM_MARGIN;
        const trayY = cardY - TRAY_PAD_Y - LABEL_H;
        const trayH = CARD_H + TRAY_PAD_Y * 2 + LABEL_H;

        groups.forEach((groupCards, category) => {
            const groupW = groupCards.length * CARD_W + (groupCards.length - 1) * CARD_GAP + TRAY_PAD_X * 2;
            const accent = CATEGORY_ACCENT[category as EdictCategory];

            const tray = new Graphics();
            tray.roundRect(curX, trayY, groupW, trayH, 12)
                .fill({ color: 0x111118, alpha: 0.85 })
                .stroke({ width: 1, color: accent });
            container.addChild(tray);

            const label = new Text({
                text: category,
                style: new TextStyle({ fontSize: 11, fill: accent, fontWeight: "bold" }),
            });
            label.anchor.set(0.5, 0);
            label.x = curX + groupW / 2;
            label.y = trayY + 4;
            container.addChild(label);

            groupCards.forEach((card, i) => {
                const x = curX + TRAY_PAD_X + i * (CARD_W + CARD_GAP);
                const c = buildCardGraphic(card);
                c.x = x;
                c.y = cardY;
                c.eventMode = "static";
                c.cursor = "grab";

                c.on("pointerenter", (e) => {
                    if (dragCard) return;
                    const t = EDICT_TOOLTIPS[card.edict];
                    setTooltipContent(t.name, t.description);
                    tooltipContainer.visible = true;
                    tooltipContainer.x = e.global.x + 10;
                    tooltipContainer.y = e.global.y - tooltipContainer.height - 10;
                });
                c.on("pointermove", (e) => {
                    if (dragCard) { tooltipContainer.visible = false; return; }
                    tooltipContainer.x = e.global.x + 10;
                    tooltipContainer.y = e.global.y - tooltipContainer.height - 10;
                });
                c.on("pointerleave", () => { tooltipContainer.visible = false; });

                c.on("pointerdown", (e) => {
                    e.stopPropagation();
                    dragCard = card;
                    isDraggingCard = true;
                    ghost = buildCardGraphic(card, 0.75);
                    ghost.x = e.clientX - CARD_W / 2;
                    ghost.y = e.clientY - CARD_H / 2;
                    app.stage.addChild(ghost);
                });

                container.addChild(c);
            });

            curX += groupW + CATEGORY_GAP;
        });
    }

    app.canvas.addEventListener("pointermove", (e) => {
        if (!ghost || !dragCard) return;
        ghost.x = e.clientX - CARD_W / 2;
        ghost.y = e.clientY - CARD_H / 2;
        if (onHover) {
            const valid = onHover(dragCard, e.clientX, e.clientY);
            ghost.tint = valid ? 0x00ff88 : 0xff4444;
        }
    });

    app.canvas.addEventListener("pointerup", (e) => {
        if (!ghost || !dragCard) return;
        app.stage.removeChild(ghost);
        ghost = null;
        isDraggingCard = false;
        onDrop?.(dragCard, e.clientX, e.clientY);
        dragCard = null;
    });

    render(cards);
    app.renderer.on("resize", () => render(cards));

    return {
        setCards(newCards) {
            cards = newCards;
            render(cards);
        },
    };
}
