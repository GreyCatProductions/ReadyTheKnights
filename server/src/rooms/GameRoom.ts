import { Room, Client, CloseCode } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { createMap } from "./MapGeneration/MapGenerator.js";
import MapTranslator from "../../../shared/src/MapCreation/MapTranslator.js";
import path from "node:path";
const { loadMapJSON } = MapTranslator;

export class GameRoom extends Room {
  maxClients = 4;
  state = new GameRoomState();
  defaultMapPath = path.resolve(__dirname, "../../../Resources/Maps/Debug.json");

  onCreate (options: any) {
    try {
      const mapJson = loadMapJSON(this.defaultMapPath);
      createMap(this.state.map, mapJson);
      console.log("Map successfully created");
    } catch (err) {
      console.error("Map creation failed:", err);
    }
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
