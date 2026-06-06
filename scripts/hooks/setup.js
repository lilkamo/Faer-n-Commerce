/**
 * Faerûn Commerce - Setup Hooks
 * Runs during the Foundry "setup" hook — sheets and canvas layers registered here.
 */
import { FAERN } from "../constants.js";
import { ShopfrontGMSheet } from "../apps/shopfront-gm-sheet.js";
import { ShopBrowseApp } from "../apps/shop-browse-app.js";
import { ShopfrontLayer } from "../canvas/shopfront-layer.js";
import { ShopfrontDirectory } from "../apps/shopfront-directory.js";

export function registerSetupHooks() {
  // ── Sheet registration ──────────────────────────────────────
  DocumentSheetConfig.registerSheet(JournalEntry, FAERN.ID, ShopfrontGMSheet, {
    types: ["shopfront"],
    makeDefault: true,
    label: "FAERN.Sheet.GMSheet",
  });

  DocumentSheetConfig.registerSheet(JournalEntry, FAERN.ID, ShopBrowseApp, {
    types: ["shopfront"],
    makeDefault: false,
    label: "FAERN.Sheet.BrowseSheet",
  });

  // ── Canvas Layer ─────────────────────────────────────────────
  CONFIG.Canvas.layers ??= {};
  CONFIG.Canvas.layers.shopfronts = {
    layerClass: ShopfrontLayer,
    group: "interface",
  };

  // ── Journal Sidebar injection ────────────────────────────────
  Hooks.on("renderJournalDirectory", (app, html, data) => {
    ShopfrontDirectory.inject(html);
  });

  console.log(`${FAERN.ID} | Setup hooks registered`);
}
