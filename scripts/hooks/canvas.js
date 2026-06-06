/**
 * Faerûn Commerce - Canvas Hooks
 * Registers Hooks.on() listeners for canvas-related events.
 */
import { FAERN } from "../constants.js";

export function registerCanvasHooks() {
  // ── Draw pins when canvas is ready ──────────────────────────
  Hooks.on("canvasReady", async (canvas) => {
    const layer = canvas.shopfronts;
    if (!layer) return;
    try {
      await layer.drawPins();
    } catch (err) {
      console.error(`${FAERN.ID} | Error drawing shopfront pins:`, err);
    }
  });

  // ── Refresh pins when scene flags change ─────────────────────
  Hooks.on("updateScene", async (scene, change, options, userId) => {
    if (!canvas?.scene || canvas.scene.id !== scene.id) return;
    const flagChanged = foundry.utils.hasProperty(change, `flags.${FAERN.ID}`);
    if (!flagChanged) return;
    const layer = canvas.shopfronts;
    if (!layer) return;
    try {
      await layer.refreshPins();
    } catch (err) {
      console.error(`${FAERN.ID} | Error refreshing shopfront pins:`, err);
    }
  });

  // ── Add Shopfront Pins tool to scene controls ────────────────
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;

    // Find the notes group or fall back to appending a new group
    const notesGroup = controls.find(c => c.name === "notes");
    if (notesGroup) {
      notesGroup.tools ??= [];
      notesGroup.tools.push({
        name: "shopfront-pins",
        title: "FAERN.Canvas.ShopfrontPins",
        icon: "fas fa-store",
        button: true,
        onClick: () => {
          const layer = canvas?.shopfronts;
          if (!layer) return;
          // Open a dialog to choose a shopfront to pin
          _openPinDialog(layer);
        },
      });
    }
  });
}

/**
 * Open a simple dialog for the GM to pick a shopfront and place a pin.
 * @param {ShopfrontLayer} layer
 */
async function _openPinDialog(layer) {
  const shopfronts = game.journal.filter(j => j.type === "shopfront");
  if (!shopfronts.length) {
    ui.notifications.warn(game.i18n.localize("FAERN.Canvas.NoShopfronts"));
    return;
  }

  const options = shopfronts.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  const content = `
    <form>
      <div class="form-group">
        <label>${game.i18n.localize("FAERN.Canvas.SelectShopfront")}</label>
        <div class="form-fields">
          <select name="shopfrontId">${options}</select>
        </div>
      </div>
      <p class="notes">${game.i18n.localize("FAERN.Canvas.ClickToPlace")}</p>
    </form>`;

  const result = await Dialog.prompt({
    title: game.i18n.localize("FAERN.Canvas.PlacePin"),
    content,
    label: game.i18n.localize("FAERN.Canvas.ActivatePlacement"),
    callback: (html) => html.find("[name=shopfrontId]").val(),
  });

  if (result) {
    layer.activatePlacementMode(result);
    ui.notifications.info(game.i18n.localize("FAERN.Canvas.ClickToPlaceInfo"));
  }
}
