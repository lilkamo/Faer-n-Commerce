/**
 * Faerûn Commerce - TransactionLogger
 * Append-only log of completed commerce transactions.
 */
import { FAERN } from "../constants.js";

export class TransactionLogger {

  /**
   * Append a new transaction record to the shopfront's log.
   * Enforces the configured maximum log size.
   * @param {JournalEntry} shopfrontDoc
   * @param {object} transactionData
   */
  static async log(shopfrontDoc, transactionData) {
    const record = TransactionLogger.#createRecord(
      transactionData.type,
      transactionData.actorId,
      transactionData.userId,
      transactionData.items ?? [],
      transactionData.totalValueGp ?? 0,
      transactionData.notes ?? ""
    );

    let log = [...(shopfrontDoc.system.transactionLog ?? []), record];

    // Enforce limit
    const limit = game.settings.get(FAERN.ID, FAERN.SETTINGS.TRANSACTION_LOG_LIMIT) ?? 500;
    if (log.length > limit) {
      log = log.slice(log.length - limit);
    }

    await shopfrontDoc.update({ "system.transactionLog": log });
    return record;
  }

  /**
   * Retrieve the transaction log, optionally filtered.
   * @param {JournalEntry} shopfrontDoc
   * @param {object} [filters={}]  - { type, actorId, startDate, endDate, search }
   * @returns {object[]}
   */
  static getLog(shopfrontDoc, filters = {}) {
    let log = [...(shopfrontDoc.system.transactionLog ?? [])];

    if (filters.type && filters.type !== "all") {
      log = TransactionLogger.filterByType(log, filters.type);
    }
    if (filters.actorId) {
      log = TransactionLogger.filterByActor(log, filters.actorId);
    }
    if (filters.startDate || filters.endDate) {
      log = TransactionLogger.filterByDate(log, filters.startDate, filters.endDate);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      log = log.filter(entry =>
        entry.notes?.toLowerCase().includes(term) ||
        entry.type?.toLowerCase().includes(term)
      );
    }

    // Sort newest first
    return log.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * @param {object[]} log
   * @param {string} actorId
   * @returns {object[]}
   */
  static filterByActor(log, actorId) {
    return log.filter(e => e.actorId === actorId);
  }

  /**
   * @param {object[]} log
   * @param {number|null} startDate  - timestamp ms
   * @param {number|null} endDate    - timestamp ms
   * @returns {object[]}
   */
  static filterByDate(log, startDate, endDate) {
    return log.filter(e => {
      if (startDate && e.timestamp < startDate) return false;
      if (endDate && e.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * @param {object[]} log
   * @param {string} type
   * @returns {object[]}
   */
  static filterByType(log, type) {
    return log.filter(e => e.type === type);
  }

  /**
   * Export the transaction log as a formatted text string.
   * @param {JournalEntry} shopfrontDoc
   * @returns {Promise<string>}
   */
  static async exportLog(shopfrontDoc) {
    const log = TransactionLogger.getLog(shopfrontDoc);
    const lines = [
      `Transaction Log — ${shopfrontDoc.name}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Total entries: ${log.length}`,
      "─".repeat(60),
    ];

    for (const entry of log) {
      const date = new Date(entry.timestamp).toLocaleString();
      const actor = game.actors.get(entry.actorId)?.name ?? entry.actorId ?? "Unknown";
      const itemSummary = (entry.items ?? [])
        .map(i => `${i.quantity ?? 1}x ${i.itemName ?? i.itemUuid}`)
        .join(", ");
      lines.push(`[${date}] ${entry.type.toUpperCase()} | ${actor} | ${itemSummary} | ${entry.totalValueGp} gp`);
      if (entry.notes) lines.push(`  Note: ${entry.notes}`);
    }

    return lines.join("\n");
  }

  /* ─── Private ────────────────────────────────────────────────── */

  static #createRecord(type, actorId, userId, items, totalValueGp, notes) {
    return {
      _id: foundry.utils.randomID(16),
      timestamp: Date.now(),
      type,
      actorId: actorId ?? "",
      userId: userId ?? "",
      items,
      totalValueGp,
      notes,
    };
  }
}
