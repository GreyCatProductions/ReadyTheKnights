import type { Building, GameNode, GameRoomState } from "../server/src/rooms/Game/schema/GameRoomState.js";

export function findBuildingById(state: GameRoomState, buildingId: string): { building: Building; node: GameNode; nodeId: string } | null {
    for (const [nodeId, node] of state.nodes) {
        const building = node.buildings.get(buildingId);
        if (building) return { building, node, nodeId };
    }
    return null;
}

export function hasBuilding(node: GameNode, type: string): boolean {
    for (const building of node.buildings.values()) {
        if (building.type === type) return true;
    }
    return false;
}
