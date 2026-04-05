import { Container, Graphics, Text, TextStyle } from "pixi.js";

const PAD = 8;
const DIVIDER_GAP = 6;

export function makeTooltip(): { container: Container; setText: (text: string) => void; setContent: (name: string, description: string) => void } {
    const container = new Container();
    const bg = new Graphics();
    const titleLabel = new Text({
        text: "",
        style: new TextStyle({ fontSize: 12, fill: 0xffffff, fontWeight: "bold" }),
    });
    const divider = new Graphics();
    const bodyLabel = new Text({
        text: "",
        style: new TextStyle({ fontSize: 11, fill: 0xcccccc, wordWrap: true, wordWrapWidth: 160 }),
    });

    titleLabel.x = PAD;
    titleLabel.y = PAD;
    container.addChild(bg);
    container.addChild(titleLabel);
    container.addChild(divider);
    container.addChild(bodyLabel);

    function redrawBg(w: number, h: number) {
        bg.clear();
        bg.roundRect(0, 0, w, h, 4).fill({ color: 0x111111, alpha: 0.92 });
    }

    function setContent(name: string, description: string) {
        titleLabel.text = name;
        bodyLabel.text = description;

        const w = Math.max(titleLabel.width, bodyLabel.width) + PAD * 2;

        divider.clear();
        divider.rect(PAD, titleLabel.height + PAD + DIVIDER_GAP / 2, w - PAD * 2, 1)
               .fill({ color: 0xffffff, alpha: 0.2 });

        bodyLabel.x = PAD;
        bodyLabel.y = titleLabel.height + PAD + DIVIDER_GAP + 2;

        redrawBg(w, bodyLabel.y + bodyLabel.height + PAD);
    }

    function setText(text: string) {
        titleLabel.text = "";
        divider.clear();
        bodyLabel.text = text;
        bodyLabel.x = PAD;
        bodyLabel.y = PAD;
        const w = bodyLabel.width + PAD * 2;
        redrawBg(w, bodyLabel.height + PAD * 2);
    }

    return { container, setText, setContent };
}

export function attachTooltip(
    target: Container,
    stage: Container,
    getContent: () => { name: string; description: string } | string,
): Container {
    const { container: tip, setText, setContent } = makeTooltip();
    tip.visible = false;
    stage.addChild(tip);

    target.eventMode = "static";
    target.on("pointerenter", (e) => {
        const content = getContent();
        if (typeof content === "string") setText(content);
        else setContent(content.name, content.description);
        tip.visible = true;
        tip.x = e.global.x + 10;
        tip.y = e.global.y - tip.height - 10;
    });
    target.on("pointermove", (e) => {
        tip.x = e.global.x + 10;
        tip.y = e.global.y - tip.height - 10;
    });
    target.on("pointerleave", () => { tip.visible = false; });

    return tip;
}
