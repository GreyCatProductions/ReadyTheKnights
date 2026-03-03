import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
}

export class NodeStats extends Schema
{
  @type("number") foodPerRound: number = 0;
  @type("number") menPerRound: number = 0;
}

export class GameNode extends Schema
{
  @type("string") name: string = "Node";
  @type(NodeStats) stats: NodeStats = new NodeStats();
  @type("number") row: number = -1;
  @type("number") column: number = -1;
}

export class GameMap extends Schema
{
  @type({ map: GameNode}) nodes = new MapSchema<GameNode>();
}

export class GameRoomState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();
  @type(GameMap) map = new GameMap();
}
