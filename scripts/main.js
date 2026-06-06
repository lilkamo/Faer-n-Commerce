/**
 * Faerûn Commerce
 * Entry point — imports all subsystems and wires up Foundry hooks.
 */

// ── Core data ──────────────────────────────────────────────────
import { FAERN } from "./constants.js";
import { ShopfrontData } from "./data/shopfront-data.js";

// ── Apps ───────────────────────────────────────────────────────
import { ShopfrontGMSheet } from "./apps/shopfront-gm-sheet.js";
import { ShopBrowseApp } from "./apps/shop-browse-app.js";
import { ApprovalQueueApp } from "./apps/approval-queue-app.js";
import { ShopfrontDirectory } from "./apps/shopfront-directory.js";

// ── Canvas ─────────────────────────────────────────────────────
import { ShopfrontLayer } from "./canvas/shopfront-layer.js";
import { ShopfrontPin } from "./canvas/shopfront-pin.js";

// ── Systems ────────────────────────────────────────────────────
import { PurchaseManager } from "./systems/purchase-manager.js";
import { InventoryManager } from "./systems/inventory-manager.js";
import { PricingEngine } from "./systems/pricing-engine.js";
import { HagglingSystem } from "./systems/haggling-system.js";
import { TransactionLogger } from "./systems/transaction-logger.js";

// ── Network ────────────────────────────────────────────────────
import { SocketHandler } from "./net/socket-handler.js";

// ── API ────────────────────────────────────────────────────────
import { FaernCommerceAPI } from "./api/index.js";

// ── Hooks ──────────────────────────────────────────────────────
import { registerInitHooks } from "./hooks/init.js";
import { registerSetupHooks } from "./hooks/setup.js";
import { registerReadyHooks } from "./hooks/ready.js";
import { registerCanvasHooks } from "./hooks/canvas.js";

/* ─── Hook registration ──────────────────────────────────────── */

Hooks.once("init", () => {
  console.log(`${FAERN.ID} | Initialising Faerûn Commerce`);
  registerInitHooks();
});

Hooks.once("setup", () => {
  registerSetupHooks();
});

Hooks.once("ready", () => {
  registerReadyHooks();
});

registerCanvasHooks();
