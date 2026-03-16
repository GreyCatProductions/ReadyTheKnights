import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema
{
  @type("number") population: number = 0;
  @type("number") wood: number = 0;
  @type("number") food: number = 0;
}

export class NodeStats extends Schema
{
  @type("number") foodPerRound: number = 0;
  @type("number") menPerRound: number = 0;
  @type("number") woodPerRound: number = 0;
}

export class Building extends Schema {
  @type("string") type: string = "";
  @type("string") ownerId: string = "";
  @type("number") posX: number = -1;
  @type("number") posY: number = -1;
  @type("number") workerCount: number = 0;
  @type("number") populationMaxIncrease: number = 0;
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

export class Unit extends Schema {
  @type("string") ownerId: string = "";
  @type("string") nodeId: string = "";
  @type("number") posX: number = -1;
  @type("number") posY: number = -1;
  @type("string") assignedBuilding: string = "";
}

export class GameRoomState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map : Unit }) units = new MapSchema<Unit>();
  @type(GameMap) map = new GameMap();
  @type("number") currentDay: number;
  @type("number") dayEndTimestamp: number;
}
