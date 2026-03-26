export const ResourceType = {
    Wood: "wood",
    Food: "food",
} as const;
export type ResourceType = typeof ResourceType[keyof typeof ResourceType];
