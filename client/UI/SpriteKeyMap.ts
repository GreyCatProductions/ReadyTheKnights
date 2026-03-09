import { NodeStats } from "../../server/src/rooms/schema/GameRoomState";

export const NODE_RESOURCES: { key: keyof NodeStats; icon: string }[] = [
    { key: "foodPerRound", icon: "🍎" },
    { key: "menPerRound", icon: "⚔️" },
    { key: "woodPerRound", icon: "🪵"},
];
