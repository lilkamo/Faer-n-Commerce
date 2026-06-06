/**
 * Faerûn Commerce - InventoryManager
 */
import { FAERN } from "../constants.js";

export class InventoryManager {

  static async addItem(shopfrontDoc, itemUuid, options = {}) {
    const existing = shopfrontDoc.system.inventory.find(e => e.itemUuid === itemUuid);
    if (existing) {
      ui.notifications.warn(game.i18n.localize("FAERN.Inventory.AlreadyExists"));
      return;
    }
    const entry = {
      _id: foundry.utils.randomID(16),
      itemUuid,
      quantity: options.quantity ?? 1,
      priceOverride: { enabled: false, value: 0, denomination: "gp" },
      availability: "available",
      notes: "",
    };
    const updated = [...shopfrontDoc.system.inventory, entry];
    await shopfrontDoc.update({ "system.inventory": updated });
    return entry;
  }

  static async removeItem(shopfrontDoc, inventoryEntryId) {
    const updated = shopfrontDoc.system.inventory.filter(e => e._id !== inventoryEntryId);
    await shopfrontDoc.update({ "system.inventory": updated });
  }

  static async updateEntry(shopfrontDoc, inventoryEntryId, updates) {
    const updated = shopfrontDoc.system.inventory.map(e =>
      e._id === inventoryEntryId ? foundry.utils.mergeObject({ ...e }, updates) : e
    );
    await shopfrontDoc.update({ "system.inventory": updated });
  }

  static async setQuantity(shopfrontDoc, inventoryEntryId, quantity) {
    return InventoryManager.updateEntry(shopfrontDoc, inventoryEntryId, { quantity });
  }

  static async setPrice(shopfrontDoc, inventoryEntryId, value, denomination = "gp") {
    return InventoryManager.updateEntry(shopfrontDoc, inventoryEntryId, {
      priceOverride: { enabled: true, value, denomination },
    });
  }

  static async clearPriceOverride(shopfrontDoc, inventoryEntryId) {
    return InventoryManager.updateEntry(shopfrontDoc, inventoryEntryId, {
      priceOverride: { enabled: false, value: 0, denomination: "gp" },
    });
  }

  static async setAvailability(shopfrontDoc, inventoryEntryId, status) {
    return InventoryManager.updateEntry(shopfrontDoc, inventoryEntryId, { availability: status });
  }

  static async resolveInventoryItem(entry) {
    try {
      const item = await fromUuid(entry.itemUuid);
      return item ? { entry, item } : null;
    } catch {
      return null;
    }
  }

  static async getFullInventory(shopfrontDoc) {
    const results = await Promise.all(
      shopfrontDoc.system.inventory.map(entry => InventoryManager.resolveInventoryItem(entry))
    );
    return results.filter(Boolean);
  }

  static getEntryById(shopfrontDoc, id) {
    return shopfrontDoc.system.inventory.find(e => e._id === id) ?? null;
  }
}
