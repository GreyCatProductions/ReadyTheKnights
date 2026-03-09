import { MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerActions extends Schema //this will contain all actions player wants to do
{

}

export class Player extends Schema
{
  @type(PlayerActions) playerActions = new PlayerActions();
  @type("number") manpower: number = 0;
  @type("number") wood: number = 0;
}

export class NodeStats extends Schema
{
  @type("number") foodPerRound: number = 0;
  @type("number") menPerRound: number = 0;
  @type("number") woodPerRound: number = 0;
}

export class GameNode extends Schema
{
  @type("string") name: string = "Node";
  @type(NodeStats) stats: NodeStats = new NodeStats();
  @type("number") row: number = -1;
  @type("number") column: number = -1;
  @type("string") owner: string = "";
  @type("boolean") playerSpawnTile: boolean = false;
}

export class GameMap extends Schema
{
  @type({ map: GameNode}) nodes = new MapSchema<GameNode>();
}

export class GameRoomState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();
  @type(GameMap) map = new GameMap();
  @type("number") currentDay: number;
  @type("number") dayEndTimestamp: number;
}
