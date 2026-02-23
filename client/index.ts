import { Client, Room, Callbacks } from "@colyseus/sdk";
import Phaser from "phaser";
import { GameMap, GameRoomState } from "../server/src/rooms/schema/GameRoomState"
import { GameMapJSON } from "../shared/src/MapCreation/MapTranslator.js";

export class GameScene extends Phaser.Scene {
    preload() {
    }

    client = new Client("http://localhost:2567");
    room: Room<GameRoomState> | null = null;

    private nodeSprites = new Map<string, Phaser.GameObjects.Container>();
    private edges!: Phaser.GameObjects.Graphics;

    async create() {
        console.log("Joining room...");

        try {
            this.room = await this.client.joinOrCreate("my_room");
            console.log("Joined successfully!");

        } catch (e) {
            console.error(e);
        }

        this.input.mouse?.disableContextMenu();
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (!this.room) return;
        });

        const map: GameMap | undefined = this.room?.state?.map;
        if(!map) 
            throw new Error("Failed to load map from server room state!");

        this.renderMap(map);

        this.cameras.main.setBounds(0, 0, 5000, 5000);
        this.input.on("wheel", (_p: any, _o: any, _dx: number, dy: number) => {
        const cam = this.cameras.main;
        cam.zoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.2, 2.5);
        });

        this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
        if (!p.isDown) return;
        const cam = this.cameras.main;
        cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
        cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
        });
    }

    update(time: number, delta: number): void {
    }

    renderMap(map: GameMap) {
        const cell = 90;
        const margin = 80;
        const radius = 20;

        // Clear previous
        this.edges?.destroy();
        for (const c of this.nodeSprites.values()) c.destroy(true);
        this.nodeSprites.clear();

        // Edges go below nodes
        this.edges = this.add.graphics();

        // 1) Place nodes
        for (const id of Object.keys(map.nodes)) {
            const pos = parseGridId(id);
            // fallback if id doesn't parse
            const col = pos?.col ?? 0;
            const row = pos?.row ?? 0;

            const x = margin + col * cell;
            const y = margin + row * cell;

            const circle = this.add.circle(0, 0, radius); // no explicit color per your preferences? Phaser needs one.
            // Phaser requires fill style to be visible:
            circle.setFillStyle(0xffffff, 0.9);

            const label = this.add.text(-18, -40, id, { fontSize: "12px" });

            const container = this.add.container(x, y, [circle, label]);
            container.setSize(radius * 2, radius * 2);
            container.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);

            container.on("pointerdown", () => {
                console.log("Clicked node:", id, map.nodes.get(id));
            });

            this.nodeSprites.set(id, container);
        }

        // 2) Draw edges (only right/bottom to avoid duplicates since map is bidirectional)
        this.edges.lineStyle(3, 0x888888, 0.9);

        for (const [id, node] of Object.entries(map.nodes)) {
            const a = this.nodeSprites.get(id);
            if (!a) continue;

            const right = node.neighbors.right;
            const bottom = node.neighbors.bottom;

            if (right && this.nodeSprites.has(right)) {
                const b = this.nodeSprites.get(right)!;
                this.edges.strokeLineShape(new Phaser.Geom.Line(a.x, a.y, b.x, b.y));
            }
            if (bottom && this.nodeSprites.has(bottom)) {
                const b = this.nodeSprites.get(bottom)!;
                this.edges.strokeLineShape(new Phaser.Geom.Line(a.x, a.y, b.x, b.y));
            }
        }

        // Optional: camera controls
        this.cameras.main.setBounds(0, 0, 5000, 5000);
        this.input.on("wheel", (_p: any, _o: any, _dx: number, dy: number) => {
            const cam = this.cameras.main;
            cam.zoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.2, 2.5);
        });

        // Drag to pan
        this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
            if (!p.isDown) return;
            const cam = this.cameras.main;
            cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
            cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
        });
    }
}

function parseGridId(id: string | undefined): { col: number; row: number } | null {
    if (!id) return null;

    const m = /^([A-Z]+)(\d+)$/.exec(id.trim().toUpperCase());
    if (!m) return null;

    const letters = m[1]!;
    const num = parseInt(m[2]!, 10);

    let col = 0;
    for (let i = 0; i < letters.length; i++) {
        col = col * 26 + (letters.charCodeAt(i) - 64);
    }

    return { col: col - 1, row: num - 1 };
}


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    parent: 'game',
    pixelArt: true,
    scene: [GameScene],
};

const game = new Phaser.Game(config);