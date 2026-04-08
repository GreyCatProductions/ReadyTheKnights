import { Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { Building, GameNode, NodeStats, WorldObject } from "../../server/src/rooms/schema/GameRoomState";
import { MapSchema } from "@colyseus/schema";
import { showContextMenu } from "../UI/ContextMenu";
import { RESOURCE_SPRITES } from "../UI/SpriteKeyMap";
import { CELL_SIZE } from "../../shared/Constants.js";
import { TroopMoveOverlay } from "./TroopMoveOverlay";
import { EDICT_SPRITE } from "../AssetLoader.js";
import { BUILDING_DEFS } from "../../shared/BuildingDefs.js";
import { BuildingType } from "../../shared/Buildings.js";
import { attachTooltip } from "../UI/Tooltip.js";
import { BUILDING_TOOLTIPS } from "../UI/tooltips/BuildingTooltips.js";
import { makeBuilding, makeDemandBubble, makeConstructionProgress, makeSprite } from "./BuildingSprites.js";

export class NodeSprite extends Container {

    private bgSprite!: Sprite;
    private bgTint!: Graphics;
    private resourceSpriteLayer!: Container;
    private buildingLayer!: Container;
    private resourceLayer!: Container;
    private statsLayer!: Container;
    private captureBar!: Graphics;
    private edictIcon!: Sprite;
    private workerLabel: Container = new Container();
    private stage: Container;
    private sessionId: string;
    private buildingTooltips: Container[] = [];

    constructor(
        node: GameNode,
        nodeId: string,
        sessionId: string,
        overlay?: TroopMoveOverlay,
        stage?: Container,
    ) {
        super();
        this.stage = stage ?? this;
        this.sessionId = sessionId;

        this.x = node.column * CELL_SIZE;
        this.y = node.row * CELL_SIZE;
        this.hitArea = new Rectangle(0, 0, CELL_SIZE, CELL_SIZE);
        this.eventMode = 'static';

        this.initLayers();
        this.initEventHandlers(node, nodeId, sessionId, overlay);
        this.buildSceneGraph(node);
    }

    private initLayers(): void {
        this.bgSprite = new Sprite(Texture.from("grass17"));
        this.bgSprite.width = CELL_SIZE;
        this.bgSprite.height = CELL_SIZE;

        this.bgTint = new Graphics();
        this.resourceSpriteLayer = new Container();
        this.buildingLayer = new Container();
        this.captureBar = new Graphics();

        this.resourceLayer = new Container();
        this.resourceLayer.y = CELL_SIZE - 22;

        this.statsLayer = new Container();
        this.statsLayer.y = CELL_SIZE - 22;

        this.edictIcon = new Sprite();
        this.edictIcon.width = 32;
        this.edictIcon.height = 32;
        this.edictIcon.x = CELL_SIZE - 36;
        this.edictIcon.y = 4;
        this.edictIcon.visible = false;

        this.workerLabel = new Container();
        this.workerLabel.x = 4;
        this.workerLabel.y = 4;
    }

    private initEventHandlers(node: GameNode, nodeId: string, sessionId: string, overlay?: TroopMoveOverlay): void {
        const CONTEXT_MENU_MAX_DRAG = 8;
        let rightDownX = 0, rightDownY = 0;

        this.on('pointerdown', (e) => {
            if (e.button === 2) {
                rightDownX = e.x;
                rightDownY = e.y;
                overlay?.beginDrag(nodeId, node.column, node.row, e.x, e.y);
            }
        });

        this.on('pointerup', (e) => {
            e.stopPropagation();
            if (e.button !== 2) return;
            if (overlay?.isDragging) { overlay.completeDrag(nodeId); return; }
            const dx = e.x - rightDownX, dy = e.y - rightDownY;
            if (Math.sqrt(dx * dx + dy * dy) <= CONTEXT_MENU_MAX_DRAG)
                showContextMenu(node, sessionId, e.x, e.y);
        });
    }

    private buildSceneGraph(node: GameNode): void {
        const border = new Graphics();
        border.rect(0, 0, CELL_SIZE, CELL_SIZE).stroke({ width: 2, color: 0x000000 });

        const label = new Text({
            text: node.name,
            style: { fill: '#ffffff', fontSize: 18 },
            anchor: 0.5,
        });
        label.eventMode = 'none';
        label.x = CELL_SIZE / 2;
        label.y = CELL_SIZE / 6;

        this.addChild(this.bgSprite);
        this.addChild(this.bgTint);
        this.addChild(this.resourceSpriteLayer);
        this.addChild(this.buildingLayer);
        this.addChild(this.statsLayer);
        this.addChild(this.resourceLayer);
        this.addChild(border);
        this.addChild(label);
        this.addChild(this.captureBar);
        this.addChild(this.edictIcon);
        this.addChild(this.workerLabel);
    }

    updateBuildings(buildings: MapSchema<Building>): void {
        this.buildingLayer.removeChildren();
        this.resourceLayer.removeChildren();
        this.buildingTooltips.forEach(t => t.parent?.removeChild(t));
        this.buildingTooltips = [];

        const resourceOutput = new Map<string, number>();

        buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (def?.resourceType && def.resourcePerWorker) {
                const produced = building.workerCount * def.resourcePerWorker;
                resourceOutput.set(def.resourceType, (resourceOutput.get(def.resourceType) ?? 0) + produced);
            }

            if (building.resourcesNeeded.wood > 0 || building.resourcesNeeded.food > 0) {
                this.buildingLayer.addChild(makeSprite(building, "construction"));
                this.buildingLayer.addChild(makeDemandBubble(building));
            } else if (building.daysToBuild > 0) {
                this.buildingLayer.addChild(makeSprite(building, "scaffolding"));
                this.buildingLayer.addChild(makeSprite(building, "construction"));
                this.buildingLayer.addChild(makeConstructionProgress(building));
            } else {
                const sprite = makeBuilding(building);
                if (sprite) {
                    this.buildingLayer.addChild(sprite);
                    this.attachBuildingTooltip(sprite, building);
                }
            }
        });

        this.renderResourceOutput(resourceOutput);
    }

    private attachBuildingTooltip(sprite: Sprite, building: Building): void {
        const tooltipDef = BUILDING_TOOLTIPS[building.type as BuildingType];
        if (!tooltipDef) return;
        const isOwn = building.ownerId === this.sessionId;
        const tip = attachTooltip(sprite, this.stage, () => ({
            name: `${isOwn ? "" : "Enemy "}${tooltipDef.name}`,
            description: isOwn ? tooltipDef.description : tooltipDef.e_description,
        }));
        this.buildingTooltips.push(tip);
    }

    private renderResourceOutput(resourceOutput: Map<string, number>): void {
        const ICON_SIZE = 18;
        let offsetX = 2;
        resourceOutput.forEach((amount, resourceType) => {
            const spriteKey = RESOURCE_SPRITES[resourceType];
            if (!spriteKey) return;
            const icon = new Sprite(Texture.from(spriteKey));
            icon.width = ICON_SIZE;
            icon.height = ICON_SIZE;
            icon.x = offsetX;
            icon.y = 0;
            this.resourceLayer.addChild(icon);
            offsetX += ICON_SIZE + 1;
            const label = new Text({ text: `+${amount}`, style: { fill: 0xffffff, fontSize: 11 } });
            label.x = offsetX;
            label.y = 3;
            this.resourceLayer.addChild(label);
            offsetX += label.width + 4;
        });
    }

    updateStats(stats: NodeStats): void {
        this.statsLayer.removeChildren();
        const ICON_SIZE = 18;
        const resources: string[] = [];
        if (stats.hasFood) resources.push("wheat");
        if (stats.hasWood) resources.push("wood");
        let offsetX = CELL_SIZE - 2;
        for (const spriteKey of resources) {
            offsetX -= ICON_SIZE;
            const icon = new Sprite(Texture.from(spriteKey));
            icon.width = ICON_SIZE;
            icon.height = ICON_SIZE;
            icon.alpha = 0.75;
            icon.x = offsetX;
            icon.y = 0;
            this.statsLayer.addChild(icon);
            offsetX -= 2;
        }
    }

    updateWorldObjects(worldObjects: MapSchema<WorldObject>): void {
        this.resourceSpriteLayer.removeChildren();
        const WORLD_OBJECT_SPRITE: Record<string, string> = { tree: "tree1" };
        worldObjects.forEach((obj) => {
            const alias = WORLD_OBJECT_SPRITE[obj.type];
            if (!alias) return;
            const sprite = new Sprite(Texture.from(alias));
            sprite.anchor.set(0.5);
            sprite.x = obj.posX;
            sprite.y = obj.posY;
            this.resourceSpriteLayer.addChild(sprite);
        });
    }

    updateWorkerLabel(buildings: MapSchema<Building>, unitCount: number = 0): void {
        this.workerLabel.removeChildren();
        let row = 0;
        const style = { fill: 0xffffff, fontSize: 11 };

        if (unitCount > 0) {
            const t = new Text({ text: `${unitCount}`, style });
            t.y = row++ * 14;
            this.workerLabel.addChild(t);
        }

        buildings.forEach((building) => {
            const def = BUILDING_DEFS[building.type as BuildingType];
            if (!def?.maxWorkers) return;
            const t = new Text({ text: `${building.workerCount}/${def.maxWorkers}`, style });
            t.y = row++ * 14;
            this.workerLabel.addChild(t);
        });
    }

    updateCaptureBar(progress: number, contestedBy: string, sessionId: string): void {
        this.captureBar.clear();
        if (progress <= 0 || !contestedBy) return;
        const BAR_H = 6;
        const color = contestedBy === sessionId ? 0x2255cc : 0xcc2222;
        this.captureBar.rect(0, CELL_SIZE - BAR_H, CELL_SIZE, BAR_H).fill(0x000000);
        this.captureBar.rect(0, CELL_SIZE - BAR_H, CELL_SIZE * progress, BAR_H).fill(color);
    }

    updateEdict(edict: string): void {
        const spriteKey = EDICT_SPRITE[edict as keyof typeof EDICT_SPRITE];
        if (spriteKey) {
            this.edictIcon.texture = Texture.from(spriteKey);
            this.edictIcon.visible = true;
        } else {
            this.edictIcon.visible = false;
        }
    }

    setBackground(color: number, alpha = 0.35): void {
        this.bgTint.clear();
        this.bgTint.rect(0, 0, CELL_SIZE, CELL_SIZE).fill({ color, alpha });
    }
}
