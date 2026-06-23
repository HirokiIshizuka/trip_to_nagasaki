/* 長崎・雲仙 旅行ルートシミュレーター ロジック */
(function () {
  "use strict";

  const STORAGE_KEY = "nagasaki-trip-route-v1";
  const POI_BY_ID = Object.fromEntries(POIS.map(p => [p.id, p]));
  const DAY_COLORS = { 1: "#0f766e", 2: "#b45309" };

  // ---- 状態 ----
  let state = {
    1: [],   // Day1 のスポットid配列
    2: [],   // Day2 のスポットid配列
    start1: "10:00",
    start2: "09:00"
  };
  let activeFilters = new Set(); // 空 = 全部表示
  let searchTerm = "";
  let mapShownOnce = false; // スマホで地図タブを初めて開いたかどうか

  // ---- 地図 ----
  const map = L.map("map", { zoomControl: true }).setView([32.78, 130.05], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const poiMarkers = {};      // id -> base marker (薄いドット)
  const routeLayers = L.layerGroup().addTo(map); // ルート用（線＋番号マーカー）

  // ============================================================
  // 初期化
  // ============================================================
  function init() {
    renderFilters();
    renderLegend();
    renderPresetOptions();
    renderPOIMarkers();
    loadFromStorage();
    bindEvents();
    renderPOIList();
    renderRoute();
    fitToAll();
  }

  // ---- フィルター ----
  function renderFilters() {
    const wrap = document.getElementById("filters");
    Object.entries(CATEGORY_META).forEach(([key, meta]) => {
      const chip = document.createElement("button");
      chip.className = "filter-chip";
      chip.dataset.cat = key;
      chip.innerHTML = `<span class="dot" style="background:${meta.color}"></span>${meta.emoji} ${meta.label}`;
      chip.addEventListener("click", () => {
        if (activeFilters.has(key)) activeFilters.delete(key);
        else activeFilters.add(key);
        chip.classList.toggle("active", activeFilters.has(key));
        chip.style.background = activeFilters.has(key) ? meta.color : "";
        renderPOIList();
      });
      wrap.appendChild(chip);
    });
  }

  function renderLegend() {
    const el = document.getElementById("legend");
    el.innerHTML = Object.values(CATEGORY_META).map(m =>
      `<div class="legend-row"><span class="dot" style="background:${m.color}"></span>${m.emoji} ${m.label}</div>`
    ).join("");
  }

  function renderPresetOptions() {
    const sel = document.getElementById("presetSelect");
    Object.entries(PRESETS).forEach(([key, p]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  }

  // ---- POIマーカー（ベース：薄いドット） ----
  function renderPOIMarkers() {
    POIS.forEach(poi => {
      const meta = CATEGORY_META[poi.category];
      const icon = L.divIcon({
        className: "",
        html: `<div class="dot-marker" style="background:${meta.color}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      const marker = L.marker([poi.lat, poi.lng], { icon }).addTo(map);
      marker.bindPopup(popupHtml(poi));
      marker.on("popupopen", () => {
        const btn = document.querySelector(".popup-add[data-id='" + poi.id + "']");
        if (btn) btn.addEventListener("click", () => { addToRoute(poi.id); map.closePopup(); });
      });
      poiMarkers[poi.id] = marker;
    });
  }

  function popupHtml(poi) {
    const meta = CATEGORY_META[poi.category];
    const inRoute = isInRoute(poi.id);
    const addBtn = poi.category === "hotel" || inRoute
      ? "" : `<button class="popup-add" data-id="${poi.id}">＋ ルートに追加</button>`;
    return `<div class="popup-title">${meta.emoji} ${poi.name}</div>
      <div class="popup-desc">${poi.desc}</div>${addBtn}`;
  }

  // ============================================================
  // POI一覧（左パネル）
  // ============================================================
  function renderPOIList() {
    const list = document.getElementById("poiList");
    list.innerHTML = "";
    const filtered = POIS.filter(poi => {
      if (activeFilters.size && !activeFilters.has(poi.category)) return false;
      if (searchTerm && !(poi.name + poi.tags.join("")).toLowerCase().includes(searchTerm)) return false;
      return true;
    });
    if (!filtered.length) {
      list.innerHTML = `<p class="route-empty">該当するスポットがありません。</p>`;
      return;
    }
    filtered.forEach(poi => list.appendChild(poiCard(poi)));
  }

  function poiCard(poi) {
    const meta = CATEGORY_META[poi.category];
    const inRoute = isInRoute(poi.id);
    const card = document.createElement("div");
    card.className = "poi-card" + (inRoute ? " in-route" : "");
    const durTxt = poi.duration ? `滞在 約${poi.duration}分` : "拠点";
    const addLabel = poi.category === "hotel" ? "宿" : (inRoute ? "✓" : "＋");
    card.innerHTML = `
      <div class="poi-card-head">
        <div class="poi-name">${meta.emoji} ${poi.name}</div>
        <button class="add-btn" title="ルートに追加/削除">${addLabel}</button>
      </div>
      <div class="poi-meta">
        <span class="poi-badge" style="background:${meta.color}">${meta.label}</span>
        <span>📍 ${poi.area}</span><span>⏱ ${durTxt}</span>
      </div>
      <div class="poi-desc">${poi.desc}</div>
      <div class="poi-tags">${poi.tags.map(t => `<span class="poi-tag">#${t}</span>`).join("")}</div>`;

    // カード本体クリックで詳細展開＋地図フォーカス
    card.addEventListener("click", (e) => {
      if (e.target.closest(".add-btn")) return;
      card.classList.toggle("expanded");
      map.setView([poi.lat, poi.lng], Math.max(map.getZoom(), 13));
      poiMarkers[poi.id].openPopup();
    });
    // ＋ボタン
    card.querySelector(".add-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (poi.category === "hotel") return;
      if (inRoute) removeFromRoute(poi.id);
      else addToRoute(poi.id);
    });
    return card;
  }

  // ============================================================
  // ルート操作
  // ============================================================
  function isInRoute(id) { return state[1].includes(id) || state[2].includes(id); }

  function currentDayTab() {
    // 既定では Day1 が短ければ Day1、そうでなければ Day2 に追加
    return state[1].length <= state[2].length ? 1 : 2;
  }

  function addToRoute(id, day) {
    if (isInRoute(id)) return;
    const d = day || currentDayTab();
    state[d].push(id);
    afterChange();
  }

  function removeFromRoute(id) {
    [1, 2].forEach(d => { state[d] = state[d].filter(x => x !== id); });
    afterChange();
  }

  function afterChange() {
    saveToStorage();
    renderPOIList();
    renderRoute();
    POIS.forEach(p => poiMarkers[p.id] && poiMarkers[p.id].setPopupContent(popupHtml(p)));
  }

  // ============================================================
  // ルート描画（右パネル）＋ 地図上の経路
  // ============================================================
  function renderRoute() {
    [1, 2].forEach(renderDayList);
    recomputeAndDraw();
  }

  function renderDayList(day) {
    const ol = document.getElementById("route" + day);
    ol.innerHTML = "";
    const ids = state[day];
    if (!ids.length) {
      ol.innerHTML = `<li class="route-empty">スポット未選択。左の「＋」で追加してください。</li>`;
      return;
    }
    ids.forEach((id, idx) => {
      const poi = POI_BY_ID[id];
      const meta = CATEGORY_META[poi.category];
      const li = document.createElement("li");
      li.className = "route-item";
      li.draggable = true;
      li.dataset.id = id;
      li.dataset.day = day;
      li.innerHTML = `
        <span class="route-num" style="background:${DAY_COLORS[day]}">${idx + 1}</span>
        <div class="route-body">
          <div class="route-name">${meta.emoji} ${poi.name}</div>
          <div class="route-info">${poi.area}・${poi.duration ? "滞在約" + poi.duration + "分" : "拠点"}
            <span class="arrival" data-id="${id}"></span></div>
        </div>
        <button class="route-remove" title="削除">×</button>`;
      li.querySelector(".route-remove").addEventListener("click", () => removeFromRoute(id));
      attachDnD(li, day);
      ol.appendChild(li);
    });
  }

  // ---- ドラッグ＆ドロップ並べ替え（同日内） ----
  let dragId = null, dragDay = null;
  function attachDnD(li, day) {
    li.addEventListener("dragstart", () => { dragId = li.dataset.id; dragDay = day; li.classList.add("dragging"); });
    li.addEventListener("dragend", () => { li.classList.remove("dragging"); clearDragOver(); });
    li.addEventListener("dragover", (e) => { e.preventDefault(); li.classList.add("drag-over"); });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const targetId = li.dataset.id;
      if (dragId === null) return;
      // いったん両日から除去して、ターゲットの直前に挿入
      const fromArr = state[dragDay];
      const movingFromIdx = fromArr.indexOf(dragId);
      if (movingFromIdx > -1) fromArr.splice(movingFromIdx, 1);
      const arr = state[day];
      const targetIdx = arr.indexOf(targetId);
      arr.splice(targetIdx, 0, dragId);
      dragId = null;
      afterChange();
    });
  }
  function clearDragOver() {
    document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
  }

  // ============================================================
  // 経路計算（OSRM、失敗時はhaversineにフォールバック）と描画
  // ============================================================
  let recomputeToken = 0;
  async function recomputeAndDraw() {
    const token = ++recomputeToken;
    routeLayers.clearLayers();
    const statusEl = document.getElementById("routingStatus");
    let usedFallback = false;

    for (const day of [1, 2]) {
      const ids = state[day];
      if (ids.length === 0) { renderDaySummary(day, null); continue; }
      const pts = ids.map(id => POI_BY_ID[id]);

      // 番号マーカー
      pts.forEach((poi, idx) => {
        const icon = L.divIcon({
          className: "",
          html: `<div class="num-marker" style="background:${DAY_COLORS[day]}"><span>${idx + 1}</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });
        L.marker([poi.lat, poi.lng], { icon, zIndexOffset: 1000 })
          .bindPopup(`<div class="popup-title">Day${day} ⑊ ${idx + 1}. ${poi.name}</div>`)
          .addTo(routeLayers);
      });

      if (pts.length < 2) { renderDaySummary(day, { legs: [], geometry: null }); continue; }

      let result = await fetchOSRM(pts);
      if (!result) { result = haversineRoute(pts); usedFallback = true; }
      if (token !== recomputeToken) return; // 競合した新しい計算が走っている

      // 線を描く
      if (result.geometry) {
        L.polyline(result.geometry, { color: DAY_COLORS[day], weight: 5, opacity: .8 }).addTo(routeLayers);
      } else {
        const latlngs = pts.map(p => [p.lat, p.lng]);
        L.polyline(latlngs, { color: DAY_COLORS[day], weight: 4, opacity: .7, dashArray: "8 8" }).addTo(routeLayers);
      }
      renderDaySummary(day, result);
    }

    statusEl.textContent = usedFallback
      ? "経路：直線距離からの概算（オフライン推定）。実際の所要時間はナビでご確認ください。"
      : "経路：実際の道路に沿った推定（OSRM）。";
  }

  // OSRMパブリックサーバーで car ルートを取得
  async function fetchOSRM(pts) {
    try {
      const coords = pts.map(p => `${p.lng},${p.lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&annotations=duration,distance`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.routes || !json.routes.length) return null;
      const route = json.routes[0];
      const geometry = route.geometry.coordinates.map(c => [c[1], c[0]]); // [lng,lat]->[lat,lng]
      const legs = route.legs.map(l => ({ distance: l.distance, duration: l.duration }));
      return { legs, geometry };
    } catch (e) {
      return null;
    }
  }

  // フォールバック：直線距離×係数で概算
  function haversineRoute(pts) {
    const legs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = haversine(pts[i], pts[i + 1]) * 1.3; // 道のり補正
      const speed = 40; // km/h（市街地＋山道の平均）
      legs.push({ distance: d, duration: (d / 1000) / speed * 3600 });
    }
    return { legs, geometry: null };
  }

  function haversine(a, b) {
    const R = 6371000, toRad = x => x * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // ============================================================
  // 1日のサマリー＋到着予定時刻
  // ============================================================
  function renderDaySummary(day, result) {
    const el = document.getElementById("summary" + day);
    const ids = state[day];
    if (!ids.length) { el.innerHTML = ""; clearArrivals(day); return; }

    const startStr = document.getElementById("start" + day).value || (day === 1 ? "10:00" : "09:00");
    let clock = parseTime(startStr);
    let driveSec = 0, distM = 0;
    const legs = result ? result.legs : [];

    ids.forEach((id, idx) => {
      const poi = POI_BY_ID[id];
      // 到着時刻を表示
      const arrSpan = document.querySelector(`.arrival[data-id='${id}']`);
      if (arrSpan) arrSpan.textContent = idx === 0 ? `／ ${fmtTime(clock)}着` : `／ ${fmtTime(clock)}着`;
      // 滞在
      clock += (poi.duration || 0) * 60;
      // 次への移動
      if (idx < ids.length - 1 && legs[idx]) {
        driveSec += legs[idx].duration;
        distM += legs[idx].distance;
        clock += legs[idx].duration;
        // レグ情報を表示
        showLeg(day, id, legs[idx]);
      }
    });

    const visitMin = ids.reduce((s, id) => s + (POI_BY_ID[id].duration || 0), 0);
    el.innerHTML =
      `<span class="pill">🚗 移動 ${fmtDur(driveSec)} / ${(distM / 1000).toFixed(1)}km</span>` +
      `<span class="pill">🕒 滞在 ${fmtDur(visitMin * 60)}</span>` +
      `<span class="pill">🏁 終了 ${fmtTime(clock)}頃</span>`;
  }

  function showLeg(day, fromId, leg) {
    const ol = document.getElementById("route" + day);
    const li = ol.querySelector(`.route-item[data-id='${fromId}']`);
    if (!li) return;
    let legEl = li.nextElementSibling;
    if (!legEl || !legEl.classList.contains("route-leg")) {
      legEl = document.createElement("div");
      legEl.className = "route-leg";
      li.after(legEl);
    }
    legEl.textContent = `🚗 ↓ ${fmtDur(leg.duration)}・${(leg.distance / 1000).toFixed(1)}km`;
  }

  function clearArrivals(day) {
    document.querySelectorAll("#route" + day + " .arrival").forEach(s => s.textContent = "");
  }

  // ---- 時刻ユーティリティ ----
  function parseTime(s) { const [h, m] = s.split(":").map(Number); return (h * 3600 + m * 60); }
  function fmtTime(sec) {
    sec = ((sec % 86400) + 86400) % 86400;
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  function fmtDur(sec) {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m}分`;
    return `${Math.floor(m / 60)}時間${m % 60 ? (m % 60) + "分" : ""}`;
  }

  // ============================================================
  // プリセット / 保存 / イベント
  // ============================================================
  function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    state[1] = p.day1.slice();
    state[2] = p.day2.slice();
    state.start1 = p.start1; state.start2 = p.start2;
    document.getElementById("start1").value = p.start1;
    document.getElementById("start2").value = p.start2;
    afterChange();
    fitToAll();
  }

  function saveToStorage() {
    state.start1 = document.getElementById("start1").value;
    state.start2 = document.getElementById("start2").value;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      state[1] = (saved[1] || []).filter(id => POI_BY_ID[id]);
      state[2] = (saved[2] || []).filter(id => POI_BY_ID[id]);
      state.start1 = saved.start1 || "10:00";
      state.start2 = saved.start2 || "09:00";
      document.getElementById("start1").value = state.start1;
      document.getElementById("start2").value = state.start2;
    } catch (e) {}
  }

  function fitToAll() {
    const all = [...state[1], ...state[2]].map(id => POI_BY_ID[id]);
    if (all.length >= 2) {
      map.fitBounds(L.latLngBounds(all.map(p => [p.lat, p.lng])).pad(0.2));
    }
  }

  function bindEvents() {
    document.getElementById("searchBox").addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderPOIList();
    });
    document.getElementById("presetSelect").addEventListener("change", (e) => {
      if (e.target.value) loadPreset(e.target.value);
    });
    document.getElementById("clearBtn").addEventListener("click", () => {
      if (!confirm("ルートを空にしますか？")) return;
      state[1] = []; state[2] = [];
      document.getElementById("presetSelect").value = "";
      afterChange();
    });
    ["start1", "start2"].forEach(id => {
      document.getElementById(id).addEventListener("change", () => { saveToStorage(); renderRoute(); });
    });

    // ---- スマホ タブ切り替え ----
    const tabBar = document.getElementById("tabBar");
    if (tabBar) {
      const panelLeft  = document.querySelector(".panel-left");
      const mapWrap    = document.querySelector(".map-wrap");
      const panelRight = document.querySelector(".panel-right");

      tabBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".tab-btn");
        if (!btn) return;
        const tab = btn.dataset.tab;

        document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
        panelLeft.classList.toggle("tab-active",  tab === "spots");
        mapWrap.classList.toggle("tab-active",    tab === "map");
        panelRight.classList.toggle("tab-active", tab === "route");

        // Leaflet は非表示状態でサイズが 0×0 になるため、表示時に再計算が必要
        if (tab === "map") {
          setTimeout(() => {
            map.invalidateSize();
            if (!mapShownOnce) {
              mapShownOnce = true;
              // ルートが選択済みならそこにフィット、なければ長崎エリアのデフォルト
              const all = [...state[1], ...state[2]].map(id => POI_BY_ID[id]);
              if (all.length >= 2) {
                map.fitBounds(L.latLngBounds(all.map(p => [p.lat, p.lng])).pad(0.2));
              } else {
                map.setView([32.78, 130.05], 10);
              }
            }
          }, 100);
        }
      });
    }
  }

  // 起動
  init();
})();
