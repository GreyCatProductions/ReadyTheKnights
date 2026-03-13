import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";

const CARD_W = 90;
const CARD_H = 130;
const CARD_GAP = 14;
const CARD_BOTTOM_MARGIN = 20;
const CARD_RADIUS = 8;

export interface CardData {
    label: string;
    color?: number;
}

export function setupCardHand(app: Application, cards: CardData[]): { setCards: (cards: CardData[]) => void } {
    const container = new Container();
    app.stage.addChild(container);

    function render(cards: CardData[]) {
        container.removeChildren();

        const totalW = cards.length * CARD_W + (cards.length - 1) * CARD_GAP;
        const startX = (app.screen.width - totalW) / 2;
        const cardY = app.screen.height - CARD_H - CARD_BOTTOM_MARGIN;

        cards.forEach((card, i) => {
            const x = startX + i * (CARD_W + CARD_GAP);

            const g = new Graphics();
            g.roundRect(0, 0, CARD_W, CARD_H, CARD_RADIUS).fill(card.color ?? 0x2a2a3a);
            g.roundRect(0, 0, CARD_W, CARD_H, CARD_RADIUS).stroke({ width: 2, color: 0x888888 });
            g.x = x;
            g.y = cardY;
            container.addChild(g);

            const label = new Text({
                text: card.label,
                style: new TextStyle({ fontSize: 13, fill: 0xffffff, wordWrap: true, wordWrapWidth: CARD_W - 10, align: "center" }),
            });
            label.anchor.set(0.5, 0);
            label.x = x + CARD_W / 2;
            label.y = cardY + 8;
            container.addChild(label);
        });
    }

    render(cards);

    app.renderer.on("resize", () => render(cards));

    return {
        setCards(newCards) {
            cards = newCards;
            render(cards);
        },
    };
}
