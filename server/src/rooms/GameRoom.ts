import { Room, Client, CloseCode } from "colyseus";
import { Building, GameRoomState, Player } from "./schema/GameRoomState.js";
import MapTranslator from "../../../shared/src/MapCreation/MapTranslator.js";
import path from "node:path";
import { createMap } from "./MapGeneration/MapGenerator.js";
const { loadMapJSON } = MapTranslator;

const CELL_SIZE = 128

export class GameRoom extends Room {
  maxClients = 4;
  state = new GameRoomState();

  private readonly DAY_DURATION_MS = 10_000;

  onCreate(options: any) {
    try {
      const defaultMapPath = path.resolve(process.cwd() + "/Resources/Maps/Debug.json");
      const mapJson = loadMapJSON(defaultMapPath);
      createMap(this.state.map, mapJson);
      console.log("Map successfully created");
    } catch (err) {
      console.error("Map creation failed:", err);
    }

    this.state.currentDay = 1;
    this.state.dayEndTimestamp = Date.now() + this.DAY_DURATION_MS;
    this.clock.setInterval(() => this.endDay(), this.DAY_DURATION_MS);

    this.onMessage("build", (client, { nodeId, buildingType }: { nodeId: string; buildingType: string }) => {
      const node = this.state.map.nodes.get(nodeId);
      if (!node) return;
      if (node.owner !== client.sessionId) return;

      const building = new Building();
      building.type = buildingType;
      building.ownerId = client.sessionId;
      node.buildings.set(buildingType, building);
      console.log(`${client.sessionId} built ${buildingType} on ${node.name}`);
    });
  }

  private endDay() {
    this.state.currentDay++;
    this.state.dayEndTimestamp = Date.now() + this.DAY_DURATION_MS;
    console.log(`Day ${this.state.currentDay} started`);
    // TODO: resolve player actions here
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    this.state.players.set(client.sessionId, player);

    const freeSpawns = [...this.state.map.nodes.values()].filter(n => n.playerSpawnTile && n.owner === "");
    if (freeSpawns.length > 0) {
      const spawnNode = freeSpawns[Math.floor(Math.random() * freeSpawns.length)];
      spawnNode.owner = client.sessionId;
      const base = new Building();
      base.type = "base";
      base.ownerId = client.sessionId;
      base.posX = CELL_SIZE / 2;
      base.posY = CELL_SIZE / 2;
      spawnNode.buildings.set("base", base);
    } else {
      console.warn(`No free spawn tile for ${client.sessionId}`);
    }
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
