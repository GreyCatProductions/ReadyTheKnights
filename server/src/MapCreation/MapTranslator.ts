import fs from "node:fs";

export type GameMapJSON = {
    nodes: Record<string, {
        name?: string;
        stats?: { foodPerRound?: number; menPerRound?: number };
        neighbors?: { top?: string; bottom?: string; left?: string; right?: string };
    }>;
};

export function loadMapJSON(filePath: string): GameMapJSON {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!isGameMapJSON(parsed)) {
        throw new Error("Map JSON has invalid structure.");
    }
    return parsed;
}

function isGameMapJSON(data: any): data is GameMapJSON 
{
    if (!data || typeof data !== "object") return false;
    if (!data.nodes || typeof data.nodes !== "object") return false;

    for (const node of Object.values(data.nodes) as any) {
        if (node.stats && typeof node.stats.foodPerRound !== "number" && node.stats.foodPerRound !== undefined) return false;
        if (node.stats && typeof node.stats.menPerRound !== "number" && node.stats.menPerRound !== undefined) return false;
    }

    return true;
}