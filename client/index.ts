import { Client, Room, Callbacks } from "@colyseus/sdk";
import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
    preload() {
    }

    client = new Client("http://localhost:2567");
    room: Room | null = null;
    
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

            if (pointer.button === 0) {
                this.room.send("leftClick");
            }

            if (pointer.button === 2) {
                this.room.send("rightClick");
            }
        });

        this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "Centered",
        { fontSize: "32px" }
        ).setOrigin(0.5);
    }

    update(time: number, delta: number): void {
    }
}

// game config
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#b6d53c',
    parent: 'game',
    pixelArt: true,
    scene: [GameScene],
};

// instantiate the game
const game = new Phaser.Game(config);