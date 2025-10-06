// Area Strategy UI – Loader (v2.2)
// This file is the stable module_url for panel_custom. It dynamically imports the core module
// with a versioned query to bust caches automatically after HACS updates.
//
// No changes needed in configuration.yaml after installation/upgrades.

const VERSION = "2.2.0"; // <-- Bump per release (HACS can replace this file content)
// Use the HACS-served path to your repo files:
const CORE_URL = `/hacsfiles/area-strategy-ui/area-strategy-ui.core.js?v=${encodeURIComponent(VERSION)}`;

(async () => {
  try {
    await import(CORE_URL);
    // Panel element is defined inside the core module.
    // Nothing to render here; the panel system will instantiate the element it defines.
  } catch (err) {
    console.error("[Area Strategy UI loader] failed to import core:", err);
    // Render a minimal fallback if import fails:
    const el = document.createElement("div");
    el.style = "padding:16px;color:var(--error-color,#f44336)";
    el.textContent = `Area Strategy UI failed to load core module: ${err}`;
    document.body.appendChild(el);
  }
})();
