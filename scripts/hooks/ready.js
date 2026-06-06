/**
 * Faerûn Commerce - Ready Hooks
 * Runs during the Foundry "ready" hook — sockets, API, notifications.
 */
import { FAERN } from "../constants.js";
import { SocketHandler } from "../net/socket-handler.js";
import { FaernCommerceAPI } from "../api/index.js";
import { ApprovalQueueApp } from "../apps/approval-queue-app.js";
import { ShopfrontDirectory } from "../apps/shopfront-directory.js";

export function registerReadyHooks() {
  // ── Socket initialization ────────────────────────────────────
  SocketHandler.initialize();

  // ── Expose public API ────────────────────────────────────────
  game.faernCommerce = new FaernCommerceAPI();

  // ── GM: check for pending requests ──────────────────────────
  if (game.user.isGM) {
    const allPending = game.journal
      .filter(j => j.type === "shopfront")
      .reduce((sum, j) => sum + (j.system?.pendingRequestCount ?? 0), 0);

    if (allPending > 0) {
      ui.notifications.info(
        game.i18n.format("FAERN.Notification.PendingRequests", { count: allPending })
      );
    }
  }

  // ── Refresh open apps when a shopfront updates ───────────────
  Hooks.on("updateJournalEntry", (doc, change, options, userId) => {
    if (doc.type !== "shopfront") return;

    // Refresh any open sheet for this document
    const sheet = doc.sheet;
    if (sheet?.rendered) sheet.render(false);

    // Refresh approval queue if it's open
    ApprovalQueueApp.refresh();

    // Refresh sidebar directory section
    const directory = ui.journal;
    if (directory?.rendered) {
      const html = directory.element;
      if (html) ShopfrontDirectory.refresh(html);
    }
  });

  // ── Refresh directory on create/delete ──────────────────────
  Hooks.on("createJournalEntry", (doc, options, userId) => {
    if (doc.type !== "shopfront") return;
    const directory = ui.journal;
    if (directory?.rendered) {
      const html = directory.element;
      if (html) ShopfrontDirectory.refresh(html);
    }
  });

  Hooks.on("deleteJournalEntry", (doc, options, userId) => {
    if (doc.type !== "shopfront") return;
    const directory = ui.journal;
    if (directory?.rendered) {
      const html = directory.element;
      if (html) ShopfrontDirectory.refresh(html);
    }
  });

  console.log(`${FAERN.ID} | Ready — game.faernCommerce exposed`);
}
