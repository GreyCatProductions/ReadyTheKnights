type NodeStatsJSON = {
    foodPerRound: number;
    menPerRound: number;
};

type NeighborsJSON = {
    top: string;
    bottom: string;
    left: string;
    right: string;
};

type GameNodeJSON = {
    name: string;
    stats: NodeStatsJSON;
    neighbors: NeighborsJSON;
};

type GameMapJSON = {
    nodes: Record<string, GameNodeJSON>;
};