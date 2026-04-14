import { Room, Client, CloseCode } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";
import { placeBuilding } from "./BuildingFactory.js";
import { loadMapJSON } from "../../../../shared/MapCreation/MapTranslator.js";
import { tickNodes, fulfillDemand } from "./BuildingSystem.js";
import { tickUnitMovement, removeUnitTarget, setUnitMacroPath } from "./UnitMovementSystem.js";
import { tickWorkers, unassignWorker } from "./WorkerSystem.js";
import { tickBattles } from "./BattleSystem.js";
import path from "node:path";
import { createMap } from "./MapGeneration/MapGenerator.js";
import { worldToGrid } from "../../../../shared/Constants.js"
import { spawnSoldier, spawnWorker } from "./UnitFactory.js";
import { BuildingType } from "../../../../shared/Buildings.js";
import { EDICT_BUILDINGS, Edict } from "../../../../shared/Edicts.js";
import { consumeFood } from "./FoodConsumption.js";
import { UnitType } from "../../../../shared/Units.js";
import { clearWalkabilityCache } from "./Pathfinding.js";
import { EDICT_CONDITIONS } from "../../../../shared/EdictConditions.js";

const WORKERS_AT_START = 5;
const SOLDIERS_AT_START = 3;
const FOOD_AT_START = 20;
const WOOD_AT_START = 20;

export class GameRoom extends Room {
  maxClients = 4;
  state = new GameRoomState();

  private readonly DAY_DURATION_MS = 10_000;

  onCreate(options: any) {
    this.loadMap();

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

    this.onMessage("move_troops", (client, msg: { from: string; to: string; count: number }) =>
      this.onMoveTroops(client, msg));
    this.onMessage("edict", (client, msg: { nodeId: string; edict: Edict }) =>
      this.onEdict(client, msg));
  }

  private loadMap() {
    try {
      const defaultMapPath = path.resolve(process.cwd() + "/Resources/Maps/Debug.json");
      createMap(this.state, loadMapJSON(defaultMapPath));
      console.log("Map successfully created");
    } catch (err) {
      console.error("Map creation failed:", err);
    }
  }

  private onMoveTroops(client: Client, { from, to, count }: { from: string; to: string; count: number }) {
    const fromNode = this.state.nodes.get(from);
    const toNode = this.state.nodes.get(to);
    if (!fromNode || !toNode) return;

    if (fromNode.ownerId != client.sessionId && toNode.ownerId != client.sessionId) return;

    const idle: string[] = [];
    const inTransit: string[] = [];
    this.state.troops.forEach((troop, id) => {
      if (troop.ownerId !== client.sessionId) return;
      const { col, row } = worldToGrid(troop.posX, troop.posY);
      if (col !== fromNode.column || row !== fromNode.row) return;
      if (troop.nodeId !== from) inTransit.push(id);
      else idle.push(id);
    });

    const toMove = [...idle, ...inTransit].slice(0, count);
    if (toMove.length === 0) return;

    for (const id of toMove) setUnitMacroPath(this.state, id, to);
    console.log(`${client.sessionId} moving ${toMove.length}/${count} units: ${from} → ${to}`);
  }

  private onEdict(client: Client, { nodeId, edict }: { nodeId: string; edict: Edict }) {
    const node = this.state.nodes.get(nodeId);
    if (!node || !EDICT_CONDITIONS[edict]?.(node, client.sessionId)) return;

    if (edict === Edict.GrantEdict) {
      node.buildings.forEach((building) => {
        if (building.resourcesNeeded.wood === 0 && building.resourcesNeeded.food === 0) return;
        fulfillDemand(building, this.state);
      });
      return;
    }

    if (edict === Edict.ClearEdict) {
      const buildingType = EDICT_BUILDINGS[node.edict as Edict];
      if (buildingType && node.buildings.has(buildingType)) {
        this.state.workers.forEach((worker, workerId) => {
          if (worker.assignedBuildingId === buildingType) unassignWorker(this.state, workerId);
        });
      }
      node.edict = "";
      return;
    }

    if (node.edict) return;
    if (node.buildings.has(BuildingType.Base)) return;

    const buildingType = EDICT_BUILDINGS[edict];
    if (!buildingType) return;

    node.buildings.forEach((_, key) => {
      if (key !== buildingType) {
        this.state.workers.forEach((worker, workerId) => {
          if (worker.assignedBuildingId === key) unassignWorker(this.state, workerId);
        });
        node.buildings.delete(key);
      }
    });
    clearWalkabilityCache(nodeId);
    node.edict = edict;
    console.log(`${client.sessionId} issued "${edict}" on ${nodeId}`);
  }

  private endDay() {
    this.state.currentDay++;
    this.state.dayEndTimestamp = Date.now() + this.DAY_DURATION_MS;
    tickNodes(this.state);
    consumeFood(this.state);
    tickWorkers(this.state);
    console.log(`Day ${this.state.currentDay} started`);
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    this.state.players.set(client.sessionId, player);

    player.resources.wood = WOOD_AT_START;
    player.resources.food = FOOD_AT_START;

    const freeSpawns = [...this.state.nodes.entries()].filter(([, n]) => n.playerSpawnTile && n.ownerId === "");
    if (freeSpawns.length > 0) {
      const [spawnNodeId, spawnNode] = freeSpawns[Math.floor(Math.random() * freeSpawns.length)];
      spawnNode.ownerId = client.sessionId;
      placeBuilding("base", client.sessionId, this.state, spawnNodeId);

      for (let i = 0; i < WORKERS_AT_START; i++) spawnWorker(this.state, client.sessionId, spawnNodeId);
      for (let i = 0; i < SOLDIERS_AT_START; i++) spawnSoldier(this.state, client.sessionId, spawnNodeId, UnitType.ArmedPeasant);
    } else {
      console.warn(`No free spawn tile for ${client.sessionId}`);
    }
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);
    this.state.players.delete(client.sessionId);
    this.state.troops.forEach((unit, id) => {
      if (unit.ownerId === client.sessionId) {
        removeUnitTarget(id, this.state);
        this.state.troops.delete(id);
      }
    });
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
