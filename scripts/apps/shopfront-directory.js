/**
 * Faerûn Commerce - ShopfrontDirectory
 * Injects a collapsible "Shopfronts" section into the Journal sidebar.
 */
import { FAERN } from "../constants.js";

export class ShopfrontDirectory {

  static inject(html) {
    // Remove any existing injected section first
    html.find?.(".faern-directory-section").remove();
    if (html[0]) html[0].querySelector?.(".faern-directory-section")?.remove();

    const shopfronts = game.journal.filter(j => j.type === "shopfront");

    const section = document.createElement("div");
    section.className = "faern-directory-section";
    section.innerHTML = ShopfrontDirectory.#buildHTML(shopfronts);

    // Bind events
    section.querySelector(".faern-dir-header")?.addEventListener("click", () => {
      const list = section.querySelector(".faern-dir-list");
      if (list) list.style.display = list.style.display === "none" ? "" : "none";
      const icon = section.querySelector(".faern-dir-toggle");
      if (icon) icon.classList.toggle("fa-chevron-down");
      if (icon) icon.classList.toggle("fa-chevron-right");
    });

    section.querySelector(".faern-dir-create")?.addEventListener("click", async () => {
      await game.faernCommerce.createShopfront();
    });

    section.querySelectorAll(".faern-dir-entry").forEach(el => {
      el.addEventListener("click", e => {
        const id = e.currentTarget.dataset.id;
        const doc = game.journal.get(id);
        if (doc) doc.sheet.render(true);
      });
    });

    // Insert before the first directory entry list
    const journalList = (html[0] ?? html).querySelector(".directory-list");
    if (journalList) {
      journalList.parentElement.insertBefore(section, journalList);
    } else {
      (html[0] ?? html).appendChild(section);
    }
  }

  static refresh(html) {
    ShopfrontDirectory.inject(html);
  }

  static #buildHTML(shopfronts) {
    const entries = shopfronts.map(s => {
      const isOpen = s.system?.isOpen ?? false;
      const storeType = s.system?.storeType ?? "general";
      const icon = FAERN.STORE_TYPES[storeType]?.icon;
      const dotColor = isOpen ? "var(--faern-open)" : "var(--faern-closed)";
      return `
        <li class="faern-dir-entry" data-id="${s.id}" title="${s.name}">
          ${icon ? `<img class="faern-dir-icon" src="${icon}" alt="">` : '<i class="fas fa-store"></i>'}
          <span class="faern-dir-name">${s.name}</span>
          <span class="faern-dir-dot" style="background:${dotColor};"></span>
        </li>`;
    }).join("");

    return `
      <div class="faern-dir-header">
        <i class="fas fa-chevron-down faern-dir-toggle"></i>
        <i class="fas fa-store"></i>
        <span>${game.i18n.localize("FAERN.Directory.Title")}</span>
        ${game.user.isGM ? `<button class="faern-dir-create" title="${game.i18n.localize("FAERN.Directory.New")}"><i class="fas fa-plus"></i></button>` : ""}
      </div>
      <ul class="faern-dir-list">
        ${entries || `<li class="faern-dir-empty">${game.i18n.localize("FAERN.Directory.Empty")}</li>`}
      </ul>`;
  }
}
