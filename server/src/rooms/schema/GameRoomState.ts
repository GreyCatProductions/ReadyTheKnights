import { MapSchema, Schema, type } from "@colyseus/schema";

export class Resources extends Schema
{
  @type("number") wood: number = 0;
  @type("number") food: number = 0;
}

export class Player extends Schema
{
  @type(Resources) resources: Resources = new Resources();
}

export class NodeStats extends Schema
{
  @type("boolean") hasFood: boolean = false;
  @type("boolean") hasWood: boolean = false;
}

export class Building extends Schema {
  @type("string") type: string = "";
  @type("string") ownerId: string = "";
  @type("number") posX: number = -1;
  @type("number") posY: number = -1;
  @type("number") workerCount: number = 0;
  @type("number") populationMaxIncrease: number = 0;
  @type(Resources) resourcesNeeded: Resources = new Resources();
  @type("number") daysToBuild: number = 1;
}

export class GameNode extends Schema
{
  @type("string") name: string = "Node";
  @type(NodeStats) stats: NodeStats = new NodeStats();
  @type("number") row: number = -1;
  @type("number") column: number = -1;
  @type("string") ownerId: string = "";
  @type("boolean") playerSpawnTile: boolean = false;
  @type({map: Building}) buildings = new MapSchema<Building>();
  @type("string")  contestedBy: string = "";
  @type("number")  captureProgress: number = 0;   // 0–1
  @type("string")  edict: string = "";
}

export class GameMap extends Schema
{
  @type({ map: GameNode}) nodes = new MapSchema<GameNode>();
}

export abstract class Unit extends Schema {
  @type("string") ownerId: string = "";
  @type("string") nodeId: string = "";
  @type("number") posX: number = -1;
  @type("number") posY: number = -1;
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") damage: number = 5;
  @type("number") foodDemand: number = 1;
}

export class Troop extends Unit {
    @type("string") type: string = ""; //not implemented
}


export class Worker extends Unit {
  @type("string") assignedBuilding: string = "";
}

export class GameRoomState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map : Troop }) troops = new MapSchema<Troop>();
  @type({ map : Worker }) workers = new MapSchema<Worker>();
  @type(GameMap) map = new GameMap();
  @type("number") currentDay: number = 0;
  @type("number") dayEndTimestamp: number = 0;
}
