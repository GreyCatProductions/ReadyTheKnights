import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
}

export class NodeStats extends Schema
{
  @type("number") foodPerRound: number = 0;
  @type("number") menPerRound: number = 0;
}

export class Neighbors extends Schema {
  @type("string") top: string = "";
  @type("string") bottom: string = "";
  @type("string") left: string = "";
  @type("string") right: string = "";
}

export class GameNode extends Schema
{
  @type("string") name: string = "Node";
  @type(NodeStats) stats: NodeStats = new NodeStats();
  @type(Neighbors) neighbors: Neighbors = new Neighbors();
}

export class GameMap extends Schema
{
  @type({ map: GameNode}) nodes = new MapSchema<GameNode>();
}

export class GameRoomState extends Schema {

  @type("number") counter: number = 0;
  @type({ map: Player }) players = new MapSchema<Player>();
  @type(GameMap) map = new GameMap();
}
