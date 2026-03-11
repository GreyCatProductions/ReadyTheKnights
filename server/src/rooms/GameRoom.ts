import { Room, Client, CloseCode } from "colyseus";
import { Building, GameRoomState, Player } from "./schema/GameRoomState.js";
import { loadMapJSON } from "../../../shared/MapCreation/MapTranslator.js";
import { processBuildings } from "./BuildingSystem.js";
import { tickUnitMovement, removeUnitTarget } from "./UnitMovementSystem.js";
import path from "node:path";
import { createMap } from "./MapGeneration/MapGenerator.js";
import { CELL_SIZE } from "../../../shared/Constants.js"

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

    let lastTick = Date.now();
    this.clock.setInterval(() => {
      const now = Date.now();
      tickUnitMovement(this.state, now - lastTick);
      lastTick = now;
    }, 100);

    this.onMessage("move_troops", (client, { from, to, count }: { from: string, to: string, count: number }) => {
      const fromNode = this.state.map.nodes.get(from);
      const toNode   = this.state.map.nodes.get(to);
      if (!fromNode || !toNode) return;
      if (fromNode.ownerId !== client.sessionId) return;

      const colDiff = Math.abs(toNode.column - fromNode.column);
      const rowDiff = Math.abs(toNode.row    - fromNode.row);
      if (colDiff + rowDiff !== 1) return;

      const candidates: string[] = [];
      this.state.units.forEach((unit, id) => {
        if (unit.ownerId === client.sessionId && unit.nodeId === from)
          candidates.push(id);
      });

      const toMove = candidates.slice(0, count);
      for (const id of toMove) {
        const unit = this.state.units.get(id)!;
        unit.nodeId = to;
        removeUnitTarget(id);
      }

      console.log(`${client.sessionId} moving ${toMove.length}/${count} units: ${from} → ${to}`);
    });
  }

  private endDay() {
    this.state.currentDay++;
    this.state.dayEndTimestamp = Date.now() + this.DAY_DURATION_MS;
    processBuildings(this.state);
    console.log(`Day ${this.state.currentDay} started`);
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    this.state.players.set(client.sessionId, player);

    const freeSpawns = [...this.state.map.nodes.values()].filter(n => n.playerSpawnTile && n.ownerId === "");
    if (freeSpawns.length > 0) {
      const spawnNode = freeSpawns[Math.floor(Math.random() * freeSpawns.length)];
      spawnNode.ownerId = client.sessionId;
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
    this.state.units.forEach((unit, id) => {
      if (unit.ownerId === client.sessionId) {
        removeUnitTarget(id);
        this.state.units.delete(id);
      }
    });
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
