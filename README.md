# Area Strategy UI

A Lovelace custom panel for managing and previewing `custom:area-dashboard-strategy`.

## Features
- Displays Home Assistant environment info
- Lists Areas from Area Registry
- YAML scratchpad for strategy config
- Cache-busting loader for easy updates

## Requirements
- Home Assistant ≥ **2024.6.0**
- HACS installed

## Installation (via HACS)
1. Add this repository to **HACS → Frontend → Custom repositories**.
   - Category: **Lovelace**
2. **Install** the repository via HACS.
3. Add Lovelace **resource** (if HACS doesn’t auto-add):
   - URL: `/hacsfiles/area-strategy-ui/area-strategy-ui.loader.js`
   - Type: **JavaScript Module**
4. (Optional) Add a sidebar panel using `panel_custom` in `configuration.yaml`:
   ```yaml
   panel_custom:
     - name: area-strategy-ui
       sidebar_title: Area Strategy
       sidebar_icon: mdi:view-dashboard-outline
       url_path: area-strategy-ui
   ```

## Versioning
- Current version: **v2.2.0**
- To release a new version:
  1. Bump `VERSION` in `area-strategy-ui.loader.js` and `ASUI_VERSION` in `area-strategy-ui.core.js`.
  2. Commit and push to GitHub.
  3. Create a GitHub Release with tag `vX.Y.Z`. Users will get the update through HACS.

## Notes
- Files are served by HA at `/hacsfiles/area-strategy-ui/`.
- If you previously installed a manual copy under `/config/www`, remove old files/resources to avoid duplicates.

---
MIT © 2025 Matt Pregent
