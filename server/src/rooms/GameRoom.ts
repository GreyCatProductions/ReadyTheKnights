import { Room, Client, CloseCode } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { placeBuilding } from "./BuildingFactory.js";
import { loadMapJSON } from "../../../shared/MapCreation/MapTranslator.js";
import { tickNodes } from "./BuildingSystem.js";
import { tickUnitMovement, removeUnitTarget } from "./UnitMovementSystem.js";
import { unassignWorker } from "./WorkerSystem.js";
import { tickBattles } from "./BattleSystem.js";
import path from "node:path";
import { createMap } from "./MapGeneration/MapGenerator.js";
import { worldToGrid } from "../../../shared/Constants.js"
import { spawnUnit } from "./UnitFactory.js";
import { EDICT_BUILDINGS, BuildingType } from "../../../shared/BuildingDefs.js";
import { Edict } from "../../../shared/Edicts.js";

const UNITS_AT_START = 5;
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
      tickBattles(this.state, now - lastTick);
      lastTick = now;
    }, 100);

    this.onMessage("move_troops", (client, { from, to, count }: { from: string, to: string, count: number }) => {
      const fromNode = this.state.map.nodes.get(from);
      const toNode   = this.state.map.nodes.get(to);
      if (!fromNode || !toNode) return;

      if(fromNode.ownerId != client.sessionId && toNode.ownerId != client.sessionId) return;

      const colDiff = Math.abs(toNode.column - fromNode.column);
      const rowDiff = Math.abs(toNode.row    - fromNode.row);
      if (colDiff + rowDiff !== 1) return;

      const unassigned: string[] = [];
      const assigned: string[] = [];
      this.state.units.forEach((unit, id) => {
        if (unit.ownerId !== client.sessionId) return;
        const { col, row } = worldToGrid(unit.posX, unit.posY);
        if (col !== fromNode.column || row !== fromNode.row) return;
        (unit.assignedBuilding ? assigned : unassigned).push(id);
      });
      const candidates = [...unassigned, ...assigned];

      if(candidates.length === 0) return;

      const toMove = candidates.slice(0, count);
      for (const id of toMove) {
        const unit = this.state.units.get(id)!;
        unit.nodeId = to;
        removeUnitTarget(id, this.state);
      }

      console.log(`${client.sessionId} moving ${toMove.length}/${count} units: ${from} → ${to}`);
    });

    this.onMessage("edict", (client, { nodeId, edict }: { nodeId: string, edict: Edict }) => {
      const node = this.state.map.nodes.get(nodeId);
      if (!node || node.ownerId !== client.sessionId) return;

      if (edict === Edict.ClearEdict) {
        const buildingType = EDICT_BUILDINGS[node.edict as Edict];
        if (buildingType && node.buildings.has(buildingType)) {
          this.state.units.forEach((unit, unitId) => {
            if (unit.assignedBuilding === buildingType) unassignWorker(this.state, unitId);
          });
        }
        node.edict = "";
        return;
      }
      
      if (node.edict) return;

      const buildingType = EDICT_BUILDINGS[edict];
      if (!buildingType) return;

      // Destroy any buildings that don't belong to the new edict
      const edictBuildingTypes = new Set(Object.values(EDICT_BUILDINGS));
      node.buildings.forEach((_, key) => {
        if (edictBuildingTypes.has(key as BuildingType) && key !== buildingType) {
          this.state.units.forEach((unit, unitId) => {
            if (unit.assignedBuilding === key) unassignWorker(this.state, unitId);
          });
          node.buildings.delete(key);
        }
      });

      node.edict = edict;
      console.log(`${client.sessionId} issued "${edict}" on ${nodeId}`);
    });
  }

  private endDay() {
    this.state.currentDay++;
    this.state.dayEndTimestamp = Date.now() + this.DAY_DURATION_MS;
    tickNodes(this.state);
    console.log(`Day ${this.state.currentDay} started`);
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    this.state.players.set(client.sessionId, player);

    const freeSpawns = [...this.state.map.nodes.entries()].filter(([, n]) => n.playerSpawnTile && n.ownerId === "");
    if (freeSpawns.length > 0) {
      const [spawnNodeId, spawnNode] = freeSpawns[Math.floor(Math.random() * freeSpawns.length)];
      spawnNode.ownerId = client.sessionId;
      placeBuilding(spawnNode, "base", client.sessionId);

      for (let i = 0; i < UNITS_AT_START; i++) {
        spawnUnit(this.state, client.sessionId, spawnNodeId);
      }
    } else {
      console.warn(`No free spawn tile for ${client.sessionId}`);
    }
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);

    this.state.players.delete(client.sessionId);
    this.state.units.forEach((unit, id) => {
      if (unit.ownerId === client.sessionId) {
        removeUnitTarget(id, this.state);
        this.state.units.delete(id);
      }
    });
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
