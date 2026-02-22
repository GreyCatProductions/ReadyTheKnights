import { Room, Client, CloseCode } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

export class MyRoom extends Room {
  maxClients = 4;
  state = new MyRoomState();

  onCreate (options: any) {
      this.onMessage("leftClick", (client: Client) => {

      console.log("Left click from", client.sessionId);
      const player = this.state.players.get(client.sessionId);
      player.men += 1;
      console.log(client.sessionId, "now has", player.men, "men"!);
    });

    this.onMessage("rightClick", (client: Client) => {

      console.log("Right click from", client.sessionId);
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.men = 10;
    
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
