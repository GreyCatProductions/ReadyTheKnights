import { Application, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import { Edict } from "../../shared/Edicts.js";
import { EDICT_SPRITE } from "../AssetLoader.js";

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

    const g = new Graphics();
    g.roundRect(0, 0, CARD_W, CARD_H, CARD_RADIUS).fill(card.color ?? 0x2a2a3a);
    g.roundRect(0, 0, CARD_W, CARD_H, CARD_RADIUS).stroke({ width: 2, color: 0x000000 });
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

    let ghost: Container | null = null;
    let dragCard: CardData | null = null;

    function render(cards: CardData[]) {
        container.removeChildren();

        const totalW = cards.length * CARD_W + (cards.length - 1) * CARD_GAP;
        const startX = (app.screen.width - totalW) / 2;
        const cardY = app.screen.height - CARD_H - CARD_BOTTOM_MARGIN;

        cards.forEach((card, i) => {
            const x = startX + i * (CARD_W + CARD_GAP);
            const c = buildCardGraphic(card);
            c.x = x;
            c.y = cardY;
            c.eventMode = "static";
            c.cursor = "grab";

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
