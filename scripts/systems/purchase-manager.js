/**
 * Faerûn Commerce - PurchaseManager
 * All purchase request lifecycle logic. GM-authoritative.
 */
import { FAERN } from "../constants.js";
import { TransactionLogger } from "./transaction-logger.js";

export class PurchaseManager {

  /* ─── Public API ─────────────────────────────────────────────── */

  static async submitRequest(shopfrontDoc, requestData) {
    PurchaseManager.#validateRequest(shopfrontDoc, requestData);

    const request = {
      _id: foundry.utils.randomID(16),
      userId: requestData.userId,
      actorId: requestData.actorId,
      type: requestData.type ?? "buy",
      status: "pending",
      items: requestData.items,
      playerMessage: requestData.playerMessage ?? "",
      timestamp: Date.now(),
      gmResponse: { message: "", counterItems: [], respondedAt: null },
    };

    const existing = shopfrontDoc.system.purchaseRequests ?? [];
    await shopfrontDoc.update({ "system.purchaseRequests": [...existing, request] });
    return request;
  }

  static async approveRequest(shopfrontDoc, requestId) {
    const request = PurchaseManager.#getRequest(shopfrontDoc, requestId);
    if (!["pending", "countered"].includes(request.status)) {
      throw new Error(`FAERN | Cannot approve request with status: ${request.status}`);
    }

    const itemsToDeduct = request.status === "countered" && request.gmResponse.counterItems?.length
      ? request.gmResponse.counterItems
      : request.items;

    const newInventory = PurchaseManager.#deductInventory(
      shopfrontDoc.system.inventory,
      itemsToDeduct
    );

    const totalGp = itemsToDeduct.reduce((sum, item) => {
      return sum + PurchaseManager.#toGp(item.unitPrice, item.denomination);
    }, 0);

    const actor = game.actors.get(request.actorId);
    const user = game.users.get(request.userId);

    const updatedRequests = shopfrontDoc.system.purchaseRequests.map(r =>
      r._id === requestId
        ? { ...r, status: "completed", gmResponse: { ...r.gmResponse, respondedAt: Date.now() } }
        : r
    );

    await shopfrontDoc.update({
      "system.inventory": newInventory,
      "system.purchaseRequests": updatedRequests,
      "system.totalRevenue": (shopfrontDoc.system.totalRevenue ?? 0) + totalGp,
    });

    await TransactionLogger.log(shopfrontDoc, {
      type: request.type,
      actorId: request.actorId,
      userId: request.userId,
      items: itemsToDeduct,
      totalValueGp: totalGp,
      notes: `Approved. ${request.playerMessage ?? ""}`.trim(),
    });

    return { request, totalGp };
  }

  static async rejectRequest(shopfrontDoc, requestId, message = "") {
    const request = PurchaseManager.#getRequest(shopfrontDoc, requestId);
    const updatedRequests = shopfrontDoc.system.purchaseRequests.map(r =>
      r._id === requestId
        ? { ...r, status: "rejected", gmResponse: { ...r.gmResponse, message, respondedAt: Date.now() } }
        : r
    );
    await shopfrontDoc.update({ "system.purchaseRequests": updatedRequests });
    return request;
  }

  static async counterRequest(shopfrontDoc, requestId, counterData) {
    PurchaseManager.#getRequest(shopfrontDoc, requestId);
    const updatedRequests = shopfrontDoc.system.purchaseRequests.map(r =>
      r._id === requestId
        ? {
            ...r,
            status: "countered",
            gmResponse: {
              message: counterData.message ?? "",
              counterItems: counterData.items ?? r.items,
              respondedAt: Date.now(),
            },
          }
        : r
    );
    await shopfrontDoc.update({ "system.purchaseRequests": updatedRequests });
  }

  static async acceptCounter(shopfrontDoc, requestId) {
    return PurchaseManager.approveRequest(shopfrontDoc, requestId);
  }

  static async declineCounter(shopfrontDoc, requestId) {
    return PurchaseManager.rejectRequest(shopfrontDoc, requestId, "Counter declined by player.");
  }

  /* ─── Private helpers ────────────────────────────────────────── */

  static #validateRequest(shopfrontDoc, requestData) {
    if (!shopfrontDoc.system.isOpen) {
      throw new Error(game.i18n.localize("FAERN.Error.ShopClosed"));
    }
    if (!requestData.userId || !requestData.actorId) {
      throw new Error(game.i18n.localize("FAERN.Error.InvalidPlayer"));
    }
    if (!requestData.items?.length) {
      throw new Error(game.i18n.localize("FAERN.Error.NoItems"));
    }
    if (requestData.type === "buy") {
      for (const reqItem of requestData.items) {
        const entry = shopfrontDoc.system.inventory.find(e => e.itemUuid === reqItem.itemUuid);
        if (!entry) throw new Error(game.i18n.format("FAERN.Error.ItemNotInShop", { name: reqItem.itemName }));
        if (entry.availability === "unavailable") {
          throw new Error(game.i18n.format("FAERN.Error.ItemUnavailable", { name: reqItem.itemName }));
        }
        if (entry.quantity !== -1 && reqItem.quantity > entry.quantity) {
          throw new Error(game.i18n.format("FAERN.Error.InsufficientStock", { name: reqItem.itemName }));
        }
      }
    }
  }

  static #getRequest(shopfrontDoc, requestId) {
    const request = shopfrontDoc.system.purchaseRequests.find(r => r._id === requestId);
    if (!request) throw new Error(`FAERN | Request not found: ${requestId}`);
    return request;
  }

  static #deductInventory(inventory, items) {
    const updated = inventory.map(entry => ({ ...entry }));
    for (const item of items) {
      const idx = updated.findIndex(e => e.itemUuid === item.itemUuid);
      if (idx === -1 || updated[idx].quantity === -1) continue;
      updated[idx] = { ...updated[idx], quantity: Math.max(0, updated[idx].quantity - item.quantity) };
    }
    return updated;
  }

  static #toGp(value, denomination) {
    const rates = { pp: 10, gp: 1, ep: 0.5, sp: 0.1, cp: 0.01 };
    return value * (rates[denomination] ?? 1);
  }
}
