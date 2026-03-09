import { GameNode } from "../../server/src/rooms/schema/GameRoomState";

const menu = document.getElementById("context-menu")!;

const ITEMS: { label: string; action: (node: GameNode) => void }[] = [
    { label: "Move here",   action: (node) => console.log("Move to", node.name) },
    { label: "Send troops", action: (node) => console.log("Send troops to", node.name) },
    { label: "Inspect",     action: (node) => console.log("Inspect", node.name, node.stats) },
];

export function showContextMenu(node: GameNode, screenX: number, screenY: number) {
    menu.innerHTML = `<div class="cm-title">${node.name}<button class="cm-close" onclick="this.closest('#context-menu').style.display='none'">✕</button></div>`;

    for (const item of ITEMS) {
        const btn = document.createElement("button");
        btn.textContent = item.label;
        btn.addEventListener("click", () => {
            item.action(node);
            hideContextMenu();
        });
        menu.appendChild(btn);
    }

    menu.style.left    = `${screenX}px`;
    menu.style.top     = `${screenY}px`;
    menu.style.display = "block";
}

export function hideContextMenu() {
    menu.style.display = "none";
}
