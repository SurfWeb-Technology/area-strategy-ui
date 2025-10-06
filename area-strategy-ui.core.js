// area-strategy-ui.core.js
// Area Strategy UI — Core (v2.2.0)
// Defines the custom panel element used by panel_custom.
// Loaded dynamically by area-strategy-ui.loader.js.

const ASUI_VERSION = "2.2.0";

(function(){
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host { display:block; box-sizing:border-box; --asui-card-bg: var(--card-background-color, #1f2630); --asui-border: 1px solid var(--divider-color, rgba(125,125,125,.3)); }
      header.top { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom: var(--asui-border); background: var(--asui-card-bg); position: sticky; top:0; z-index:1; }
      .title { display:flex; gap:12px; align-items:center; }
      .title h1 { margin:0; font-size:1.1rem; font-weight:600; }
      .pill { font: 500 12px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding:2px 8px; border-radius:999px; background: rgba(125,125,125,.15); }
      main { padding:16px; display:grid; grid-template-columns:1fr; gap:16px; }
      @media (min-width:1080px){ main{ grid-template-columns:1fr 1fr; } }
      section { border: var(--asui-border); border-radius:12px; background: var(--asui-card-bg); overflow:hidden; }
      section > header { padding:12px 16px; border-bottom: var(--asui-border); }
      .pad { padding:12px 16px; }
      .row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      button { padding:8px 12px; border-radius:8px; border: var(--asui-border); background: transparent; color: var(--primary-text-color); cursor:pointer; }
      button:hover { background: rgba(125,125,125,.12); }
      .danger { color: var(--error-color); border-color: var(--error-color); }
      ul.clean { list-style:none; padding:0; margin:0; }
      li.item { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom: var(--asui-border); }
      li.item:last-child { border-bottom:0; }
      textarea { width:100%; min-height:240px; resize:vertical; padding:12px; border-radius:8px; border: var(--asui-border); background: rgba(125,125,125,.08); color: var(--primary-text-color); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .muted { opacity:.7; }
      .err { color: var(--error-color); }
      footer { padding:12px 16px; border-top: var(--asui-border); display:flex; justify-content:space-between; align-items:center; }
      a { color: var(--primary-color); text-decoration:none; }
      a:hover { text-decoration:underline; }
    </style>
    <header class="top">
      <div class="title">
        <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
        <h1>Area Strategy UI</h1>
        <span class="pill">v${ASUI_VERSION}</span>
      </div>
      <div class="row">
        <button id="reload" title="Reload Lovelace"><ha-icon icon="mdi:refresh"></ha-icon>&nbsp;Reload</button>
        <button id="clear" class="danger" title="Force cache-bust & reload"><ha-icon icon="mdi:trash-can-outline"></ha-icon>&nbsp;Clear cache</button>
      </div>
    </header>
    <main>
      <section>
        <header><strong>Environment</strong></header>
        <div class="pad">
          <div id="loading" class="muted">Loading…</div>
          <div id="info" class="muted" hidden></div>
          <div id="error" class="err" hidden></div>
        </div>
        <footer>
          <span class="muted">Panel: <code>area-strategy-ui(.panel)</code></span>
          <a href="https://my.home-assistant.io/redirect/lovelace" target="_blank" rel="noreferrer">Open Lovelace</a>
        </footer>
      </section>

      <section>
        <header><strong>Areas</strong> <span id="area-count" class="muted"></span></header>
        <div class="pad">
          <div id="areas-empty" class="muted" hidden>No areas returned (insufficient perms or none defined).</div>
          <ul id="areas" class="clean"></ul>
        </div>
      </section>

      <section style="grid-column:1 / -1;">
        <header><strong>Strategy YAML scratchpad</strong></header>
        <div class="pad">
          <textarea id="yaml" spellcheck="false"></textarea>
        </div>
        <footer>
          <span class="muted">Tip: paste your <code>custom:area-dashboard-strategy</code> config and copy it back.</span>
          <button id="copy"><ha-icon icon="mdi:content-copy"></ha-icon>&nbsp;Copy YAML</button>
        </footer>
      </section>
    </main>
  `;

  class AreaStrategyUIPanel extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode:'open'}).appendChild(template.content.cloneNode(true));
      this._hass = null;
      this._areas = [];
      this._info = '';
      this._error = '';
      this._yaml = `# YAML scratchpad (not persisted)
# Paste/edit your strategy config here and copy it back to your files
strategy: custom:area-dashboard-strategy
defaults:
  theme: auto
  layout: hybrid
  # example: include only entities matching both 'light' and 'motion' in name
  # extraViews:
  #   Sensors:
  #     filter:
  #       include:
  #         - entity_id: '.*light.*motion.*sensor.*'
`;
    }

    connectedCallback(){
      const $ = (sel) => this.shadowRoot.querySelector(sel);
      this.$ = $;

      $('#reload').addEventListener('click', () => this._reloadLovelace());
      $('#clear').addEventListener('click', () => this._clearCache());
      $('#copy').addEventListener('click', () => this._copyYAML());

      $('#yaml').value = this._yaml;
      $('#yaml').addEventListener('input', (e)=>{ this._yaml = e.target.value; });

      this._updateInfo();
      this._renderAreas();
      this._bootstrap();

      console.info(`%c[Area Strategy UI] Core loaded v${ASUI_VERSION}`, "color:#4fc3f7;font-weight:600");
    }

    set hass(hass){
      this._hass = hass;
      // Update info when HA context changes
      this._updateInfo();
    }
    get hass(){ return this._hass; }

    async _bootstrap(){
      try {
        this.$('#loading').hidden = false;
        await this._fetchAreasSafe();
        this.$('#loading').hidden = true;
      } catch (e){
        this._error = String(e);
        this.$('#loading').hidden = true;
        const errEl = this.$('#error');
        errEl.hidden = false; errEl.textContent = `Error: ${this._error}`;
      }
    }

    _updateInfo(){
      const infoEl = this?.$?.('#info');
      if (!infoEl) return;
      const userName = this._hass?.user?.name || this._hass?.user?.id || 'Home Assistant';
      const haVer = this._hass?.config?.version || 'unknown';
      this._info = `Connected as ${userName} • HA ${haVer} • UI ${ASUI_VERSION}`;
      infoEl.textContent = this._info;
      infoEl.hidden = false;
    }

    async _fetchAreasSafe(){
      try {
        if (!this._hass || !this._hass.callWS) { this._areas = []; this._renderAreas(); return; }
        const list = await this._hass.callWS({ type: 'config/area_registry/list' });
        this._areas = Array.isArray(list) ? list : [];
        this._renderAreas();
      } catch (e){
        console.warn('[Area Strategy UI] Area registry fetch failed:', e);
        this._areas = [];
        this._renderAreas();
      }
    }

    _renderAreas(){
      const ul = this?.$?.('#areas');
      const empty = this?.$?.('#areas-empty');
      const count = this?.$?.('#area-count');
      if (!ul || !empty || !count) return;
      ul.innerHTML = '';
      if (!this._areas || this._areas.length === 0){
        empty.hidden = false; count.textContent = '';
        return;
      }
      empty.hidden = true; count.textContent = `(${this._areas.length})`;
      for (const a of this._areas){
        const li = document.createElement('li');
        li.className = 'item';
        const left = document.createElement('span');
        left.innerHTML = `<strong>${a.name}</strong>${a.id ? `<span class="muted"> • ${a.id}</span>` : ''}`;
        const right = document.createElement('span');
        right.className = 'muted';
        right.textContent = a.floor_id || '';
        li.appendChild(left); li.appendChild(right);
        ul.appendChild(li);
      }
    }

    _reloadLovelace(){
      const ev = new Event('location-changed', { bubbles:true, composed:true });
      this.dispatchEvent(ev);
    }

    _clearCache(){
      const url = new URL(window.location.href);
      url.searchParams.set('asui_cache', Date.now().toString());
      window.location.replace(url.toString());
    }

    _copyYAML(){
      const text = this._yaml || '';
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text)
          .then(()=>{ this._toast('Copied YAML to clipboard.'); })
          .catch(()=>{ this._toast('Clipboard unavailable—select and copy manually.'); });
      } else {
        this._toast('Clipboard unavailable—select and copy manually.');
      }
    }

    _toast(msg){
      // Lightweight inline toast
      let el = this.shadowRoot.getElementById('asui-toast');
      if (!el){
        el = document.createElement('div');
        el.id = 'asui-toast';
        el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:8px 12px;border-radius:8px;z-index:10000;opacity:0;transition:opacity .2s ease-in-out;';
        this.shadowRoot.appendChild(el);
      }
      el.textContent = msg; el.style.opacity = '1';
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(()=>{ el.style.opacity = '0'; }, 1600);
    }
  }

  const defineOnce = (tag, clazz) => { if (!customElements.get(tag)) customElements.define(tag, clazz); };
  defineOnce('area-strategy-ui', AreaStrategyUIPanel);
  defineOnce('area-strategy-ui-panel', AreaStrategyUIPanel);
})();
