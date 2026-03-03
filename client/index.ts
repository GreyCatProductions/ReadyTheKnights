import { Client, Room, Callbacks } from "@colyseus/sdk";
import Phaser from "phaser";
import { GameMap, GameRoomState } from "../server/src/rooms/schema/GameRoomState"

export class GameScene extends Phaser.Scene {
    preload() {
    }

    client = new Client("ws://localhost:2567");
    room: Room<GameRoomState> | null = null;

    private nodeSprites = new Map<string, Phaser.GameObjects.Container>();
    private edges!: Phaser.GameObjects.Graphics;

    async create() {
        console.log("Joining room...");

        this.room = await this.client.joinOrCreate("my_room");
        if (!this.room)
            throw new Error("Failed to join room"); 
        console.log("Joined successfully!");

        this.input.mouse?.disableContextMenu();
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        });

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

        this.room.onStateChange.once((state) =>
        {
            const map: GameMap = state.map;
            this.renderMap(map);
        })
    }

    update(time: number, delta: number): void {
    }

    renderMap(map: GameMap) {
        const cell = 128;

        // 1) Place nodes
        for (const id of Object.keys(map.nodes)) {
            const col = map.nodes.get(id)?.column;
            const row = map.nodes.get(id)?.row;

            if(!col || !row)
                throw new Error("Failed to render map. A node has undefined coordinates!");

            const x = col * cell;
            const y = row * cell;

            const rectangle = this.add.rectangle(x, y, cell, cell, 0xff0000, 1);

        }

        console.log("Map drawn!");
    }
}


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#898989',
    parent: 'game',
    pixelArt: true,
    scene: [GameScene],
};

const game = new Phaser.Game(config);