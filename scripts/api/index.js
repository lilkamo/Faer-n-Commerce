/**
 * Faerûn Commerce - Public API
 * Exposed as game.faernCommerce
 */
import { FAERN } from "../constants.js";
import { PurchaseManager } from "../systems/purchase-manager.js";
import { InventoryManager } from "../systems/inventory-manager.js";
import { PricingEngine } from "../systems/pricing-engine.js";

export class FaernCommerceAPI {

  // Expose class references for advanced users and internal use
  PurchaseManager = PurchaseManager;
  InventoryManager = InventoryManager;
  PricingEngine = PricingEngine;

  // Internal app class cache (populated by setup hook)
  _apps = {};

  /* ─── Module info ────────────────────────────────────────────── */

  get version() {
    return game.modules.get(FAERN.ID)?.version ?? "unknown";
  }

  /* ─── Shopfront CRUD ─────────────────────────────────────────── */

  /**
   * Create a new shopfront JournalEntry.
   * @param {object} [data={}]  - Initial data, e.g. { name, system: { storeType } }
   * @returns {Promise<JournalEntry>}
   */
  async createShopfront(data = {}) {
    const createData = foundry.utils.mergeObject(
      {
        name: game.i18n.localize("FAERN.NewShopfront.DefaultName"),
        type: "shopfront",
      },
      data
    );
    const doc = await JournalEntry.create(createData);
    doc.sheet.render(true);
    return doc;
  }

  /**
   * Open the appropriate sheet for a shopfront.
   * @param {string} shopfrontId
   */
  async openShop(shopfrontId) {
    const doc = this.getShopfront(shopfrontId);
    if (!doc) {
      ui.notifications.error(game.i18n.format("FAERN.Error.ShopNotFound", { id: shopfrontId }));
      return;
    }
    doc.sheet.render(true);
  }

  /**
   * Get a single shopfront JournalEntry by ID.
   * @param {string} id
   * @returns {JournalEntry|null}
   */
  getShopfront(id) {
    const doc = game.journal.get(id);
    return doc?.type === "shopfront" ? doc : null;
  }

  /**
   * Return all shopfront JournalEntries in the world.
   * @returns {JournalEntry[]}
   */
  getAllShopfronts() {
    return game.journal.filter(j => j.type === "shopfront");
  }

  /* ─── Pin management ─────────────────────────────────────────── */

  /**
   * Add a shopfront pin to a scene's flags.
   * @param {string} shopfrontId
   * @param {string} sceneId
   * @param {number} x
   * @param {number} y
   * @param {object} [options={}]  - icon, label overrides
   * @returns {Promise<object>}    The new pin data
   */
  async placePin(shopfrontId, sceneId, x, y, options = {}) {
    const scene = game.scenes.get(sceneId);
    if (!scene) throw new Error(`Scene not found: ${sceneId}`);

    const shopfront = this.getShopfront(shopfrontId);
    if (!shopfront) throw new Error(`Shopfront not found: ${shopfrontId}`);

    const storeType = shopfront.system?.storeType ?? "general";
    const pinData = {
      _id: foundry.utils.randomID(16),
      shopfrontId,
      x,
      y,
      icon: options.icon ?? FAERN.STORE_TYPES[storeType]?.icon ?? FAERN.STORE_TYPES.general.icon,
      label: options.label ?? shopfront.name,
      scale: options.scale ?? 1.0,
    };

    const existing = scene.getFlag(FAERN.ID, "pins") ?? [];
    await scene.setFlag(FAERN.ID, "pins", [...existing, pinData]);
    return pinData;
  }

  /**
   * Remove a shopfront pin from a scene.
   * @param {string} pinId
   * @param {string} sceneId
   */
  async removePin(pinId, sceneId) {
    const scene = game.scenes.get(sceneId);
    if (!scene) throw new Error(`Scene not found: ${sceneId}`);

    const existing = scene.getFlag(FAERN.ID, "pins") ?? [];
    const updated = existing.filter(p => p._id !== pinId);
    await scene.setFlag(FAERN.ID, "pins", updated);
  }
}
