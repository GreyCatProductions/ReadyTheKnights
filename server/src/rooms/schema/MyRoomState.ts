import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
    @type("number") men: number;
}

export class MyRoomState extends Schema {

  @type("number") counter: number = 0;
  @type({map: Player}) players = new MapSchema<Player>();

}
