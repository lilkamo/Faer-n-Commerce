/**
 * Faerûn Commerce - ShopfrontLayer
 * Custom CanvasLayer that renders ShopfrontPin objects on the active scene.
 */
import { FAERN } from "../constants.js";
import { ShopfrontPin } from "./shopfront-pin.js";

export class ShopfrontLayer extends CanvasLayer {
  constructor() {
    super();
    /** @type {Map<string, ShopfrontPin>} */
    this.pins = new Map();
    this._placementMode = false;
    this._placementShopfrontId = null;
  }

  static get layerOptions() {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: "shopfronts",
      zIndex: 300,
    });
  }

  /* ─── Lifecycle ─────────────────────────────────────────────── */

  async _draw(options) {
    await super._draw(options);
    this.hitArea = canvas.dimensions.rect;
    this.interactive = true;
    await this.drawPins();
  }

  async _tearDown(options) {
    for (const pin of this.pins.values()) {
      pin.destroy({ children: true });
    }
    this.pins.clear();
    this._placementMode = false;
    this._placementShopfrontId = null;
    await super._tearDown(options);
  }

  /* ─── Pin management ─────────────────────────────────────────── */

  async drawPins() {
    const scene = canvas.scene;
    if (!scene) return;
    const pinsData = scene.getFlag(FAERN.ID, "pins") ?? [];
    for (const pinData of pinsData) {
      await this.addPin(pinData);
    }
  }

  async addPin(pinData) {
    if (this.pins.has(pinData.id)) return;
    const pin = new ShopfrontPin(pinData, this);
    this.pins.set(pinData.id, pin);
    this.addChild(pin);
    await pin.draw();
    return pin;
  }

  async removePin(pinId) {
    const pin = this.pins.get(pinId);
    if (!pin) return;
    pin.destroy({ children: true });
    this.pins.delete(pinId);

    const scene = canvas.scene;
    if (!scene || !game.user.isGM) return;
    const pinsData = (scene.getFlag(FAERN.ID, "pins") ?? []).filter(p => p.id !== pinId);
    await scene.setFlag(FAERN.ID, "pins", pinsData);
  }

  async refreshPins() {
    for (const pin of this.pins.values()) {
      pin.destroy({ children: true });
    }
    this.pins.clear();
    await this.drawPins();
  }

  async updatePin(pinId, updates) {
    const pin = this.pins.get(pinId);
    if (!pin) return;
    foundry.utils.mergeObject(pin.data, updates);
    pin.destroy({ children: true });
    this.pins.delete(pinId);
    await this.addPin(pin.data);
  }

  /* ─── Placement mode ─────────────────────────────────────────── */

  activatePlacementMode(shopfrontId) {
    this._placementMode = true;
    this._placementShopfrontId = shopfrontId;
  }

  deactivatePlacementMode() {
    this._placementMode = false;
    this._placementShopfrontId = null;
  }

  async _onClickLeft(event) {
    if (!this._placementMode || !this._placementShopfrontId) return;

    const pos = event.getLocalPosition(canvas.stage);
    const shopfront = game.journal.get(this._placementShopfrontId);
    if (!shopfront) { this.deactivatePlacementMode(); return; }

    const storeType = shopfront.system?.storeType ?? "general";
    const pinData = {
      id: foundry.utils.randomID(16),
      shopfrontId: this._placementShopfrontId,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      icon: FAERN.STORE_TYPES[storeType]?.icon ?? FAERN.STORE_TYPES.general.icon,
      label: shopfront.name,
      scale: game.settings.get(FAERN.ID, FAERN.SETTINGS.PIN_SCALE) ?? 1.0,
    };

    const scene = canvas.scene;
    const existing = scene.getFlag(FAERN.ID, "pins") ?? [];
    await scene.setFlag(FAERN.ID, "pins", [...existing, pinData]);
    this.deactivatePlacementMode();
    ui.notifications.info(game.i18n.format("FAERN.Canvas.PinPlaced", { name: shopfront.name }));
  }
}
