/**
 * Faerûn Commerce - ShopfrontPin
 * PIXI.Container representing a single shop pin on the canvas.
 */
import { FAERN } from "../constants.js";

const PIN_RADIUS = 28;
const GLOW_RADIUS = 38;

export class ShopfrontPin extends PIXI.Container {
  /**
   * @param {object} data  - Pin data from scene flags
   * @param {ShopfrontLayer} layer
   */
  constructor(data, layer) {
    super();
    this.data = data;
    this.layer = layer;
    this._tooltip = null;
    this._glowFilter = null;
    this.eventMode = "static";
    this.cursor = "pointer";
  }

  get shopfrontDoc() {
    return game.journal.get(this.data.shopfrontId) ?? null;
  }

  get isOpen() {
    return this.shopfrontDoc?.system?.isOpen ?? false;
  }

  /* ─── Drawing ────────────────────────────────────────────────── */

  async draw() {
    this.removeChildren();
    this.off("pointerover").off("pointerout").off("pointerdown");

    const scale = (this.data.scale ?? 1.0);
    this.scale.set(scale);

    // Glow ring
    const glow = new PIXI.Graphics();
    glow.beginFill(0xc9a84c, 0.12);
    glow.drawCircle(0, 0, GLOW_RADIUS);
    glow.endFill();
    this.addChild(glow);

    // Background circle
    const bg = new PIXI.Graphics();
    bg.lineStyle(2, 0xc9a84c, 1);
    bg.beginFill(0x22223b, 0.92);
    bg.drawCircle(0, 0, PIN_RADIUS);
    bg.endFill();
    this.addChild(bg);

    // Store icon
    try {
      const texture = await loadTexture(this.data.icon);
      const sprite = new PIXI.Sprite(texture);
      sprite.width = sprite.height = 34;
      sprite.anchor.set(0.5);
      this.addChild(sprite);
    } catch {
      const fallback = new PIXI.Text("🏪", { fontSize: 22 });
      fallback.anchor.set(0.5);
      this.addChild(fallback);
    }

    // Open / closed indicator dot
    const dot = new PIXI.Graphics();
    dot.beginFill(this.isOpen ? 0x4caf7d : 0xc94c4c, 1);
    dot.drawCircle(20, -20, 7);
    dot.endFill();
    this.addChild(dot);

    // Label
    const showLabel = game.settings.get(FAERN.ID, FAERN.SETTINGS.SHOW_PIN_LABELS) ?? true;
    if (showLabel) {
      const label = new PIXI.Text(this.data.label ?? "", {
        fontFamily: "serif",
        fontSize: 13,
        fill: 0xe8e3d8,
        stroke: 0x000000,
        strokeThickness: 3,
        align: "center",
      });
      label.anchor.set(0.5, 0);
      label.y = PIN_RADIUS + 6;
      this.addChild(label);
    }

    // Position on canvas
    this.position.set(this.data.x, this.data.y);

    // Events
    this.on("pointerover", this.#onPointerOver, this);
    this.on("pointerout", this.#onPointerOut, this);
    this.on("pointerdown", this.#onPointerDown, this);
  }

  /* ─── Events ─────────────────────────────────────────────────── */

  #onPointerOver() {
    this.scale.set((this.data.scale ?? 1.0) * 1.15);
    this.#showTooltip();
  }

  #onPointerOut() {
    this.scale.set(this.data.scale ?? 1.0);
    this.#hideTooltip();
  }

  #onPointerDown(event) {
    if (event.button !== 0) return;
    const doc = this.shopfrontDoc;
    if (!doc) {
      ui.notifications.warn(game.i18n.localize("FAERN.Pin.ShopNotFound"));
      return;
    }

    if (game.user.isGM) {
      // GM gets a choice: configure or browse
      const menu = new Dialog({
        title: doc.name,
        content: `<p>${game.i18n.localize("FAERN.Pin.GMPrompt")}</p>`,
        buttons: {
          config: {
            icon: '<i class="fas fa-cog"></i>',
            label: game.i18n.localize("FAERN.Pin.Configure"),
            callback: () => doc.sheet.render(true),
          },
          browse: {
            icon: '<i class="fas fa-store"></i>',
            label: game.i18n.localize("FAERN.Pin.BrowseAsPlayer"),
            callback: () => {
              const { ShopBrowseApp } = game.faernCommerce._apps;
              new ShopBrowseApp(doc).render(true);
            },
          },
        },
        default: "config",
      });
      menu.render(true);
    } else {
      if (!this.isOpen) {
        ui.notifications.info(game.i18n.format("FAERN.Shop.ClosedNotice", { name: doc.name }));
        return;
      }
      const hasAccess = doc.testUserPermission(game.user, "OBSERVER");
      if (!hasAccess) {
        ui.notifications.warn(game.i18n.localize("FAERN.Shop.NoAccess"));
        return;
      }
      const { ShopBrowseApp } = game.faernCommerce._apps;
      new ShopBrowseApp(doc).render(true);
    }
  }

  #showTooltip() {
    this.#hideTooltip();
    const doc = this.shopfrontDoc;
    const statusLabel = this.isOpen
      ? game.i18n.localize("FAERN.Shop.Open")
      : game.i18n.localize("FAERN.Shop.Closed");
    const merchantName = doc?.system?.merchantName ?? "";

    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    const text = new PIXI.Text(
      `${this.data.label}${merchantName ? `\n${merchantName}` : ""}\n${statusLabel}`,
      { fontFamily: "serif", fontSize: 12, fill: 0xe8e3d8, align: "center", stroke: 0x000000, strokeThickness: 2 }
    );
    text.anchor.set(0.5, 1);
    text.y = -GLOW_RADIUS - 4;

    const pad = 8;
    bg.beginFill(0x1a1a2e, 0.9);
    bg.lineStyle(1, 0xc9a84c, 0.8);
    bg.drawRoundedRect(
      text.x - text.width / 2 - pad,
      text.y - text.height - pad,
      text.width + pad * 2,
      text.height + pad * 2,
      4
    );
    bg.endFill();

    container.addChild(bg);
    container.addChild(text);
    this._tooltip = container;
    this.addChild(container);
  }

  #hideTooltip() {
    if (this._tooltip) {
      this.removeChild(this._tooltip);
      this._tooltip.destroy({ children: true });
      this._tooltip = null;
    }
  }

  destroy(options) {
    this.#hideTooltip();
    this.off("pointerover").off("pointerout").off("pointerdown");
    super.destroy(options);
  }
}
