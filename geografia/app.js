"use strict";

const $ = selector => document.querySelector(selector);
const screen = $("#screen");
const profileDialog = $("#profile-dialog");
const storageKey = "geo-academy-v1";
const grades = { G: "G · 5. ročník", F: "F · 6.–7. ročník", E: "E · 8.–9. ročník" };
const defaultFilter = { category: "F", topic: "", country: "", level: "", kind: "", count: "10", mode: "practice" };
const filters = { ...defaultFilter };
let bank, lookup, currentResult, pendingAction;
let storageFailed = false;
let data = { active: null, profiles: [] };

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved?.profiles)) data = saved;
} catch {
  storageFailed = true;
}

const esc = value => String(value ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = value => String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");
const key = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const profile = () => data.profiles.find(p => p.id === data.active);
const draft = () => profile()?.draft;
const history = () => profile()?.history ?? [];
const route = () => location.hash.slice(1) || "prehlad";
const modeName = mode => mode === "exam" ? "Skúšobný test" : "Tréning";
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const isAnswered = answer => Array.isArray(answer) ? answer.length > 0 && answer.every(Boolean) : !!String(answer ?? "").trim();

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function numericAnswer(value) {
  const normalized = norm(value).replace(/−/g, "-").replace(/\s+/g, "").replace(",", ".");
  const match = normalized.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
  return match ? `${Number(match[1])}${match[2]}` : normalized;
}

function correct(q, answer) {
  if (q.type === "match") return q.answer.every((target, i) => target === answer?.[i]);
  if (q.type === "short") return q.answer.some(target => numericAnswer(target) === numericAnswer(answer));
  if (q.type === "fill") return q.answer.some(target => norm(target) === norm(answer));
  return answer === q.answer;
}

function navigate(page) {
  if (route() === page) render();
  else location.hash = page;
  window.scrollTo(0, 0);
}

function profileLabel() {
  const active = profile();
  $("#profile-button").textContent = active ? `${active.name} · ${active.category}` : "Žiacky profil";
}

function openProfile(action) {
  pendingAction = action;
  $("#profiles").innerHTML = data.profiles.length ? `<h3>Uložené profily</h3>${data.profiles.map(p =>
    `<button class="secondary" type="button" data-profile="${esc(p.id)}">${esc(p.name)} · ${esc(p.category)}</button>`).join(" ")}` : "";
  $("#profile-form").elements.category.value = profile()?.category || filters.category;
  if (!profileDialog.open) profileDialog.showModal();
}

function selectProfile(id) {
  data.active = id;
  currentResult = undefined;
  filters.category = profile().category;
  persist();
  const action = pendingAction;
  pendingAction = undefined;
  profileDialog.close();
  profileLabel();
  if (action) action();
  else navigate(route() === "pokus" || route() === "vysledok" ? "prehlad" : route());
}

$("#profile-button").onclick = () => openProfile();
$("#close-profile").onclick = () => profileDialog.close();
profileDialog.addEventListener("close", () => { pendingAction = undefined; });
$("#profiles").onclick = event => {
  const id = event.target.closest("[data-profile]")?.dataset.profile;
  if (id) selectProfile(id);
};
$("#profile-form").onsubmit = event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.nickname.value.trim();
  if (!name) return;
  const p = { id: key(), name, category: form.elements.category.value, history: [], draft: null };
  data.profiles.push(p);
  form.reset();
  selectProfile(p.id);
};

function filteredQuestions() {
  return bank.questions.filter(q => q.categories.includes(filters.category)
    && (!filters.topic || q.topic === filters.topic)
    && (!filters.country || q.country === filters.country)
    && (!filters.level || q.difficulty === Number(filters.level))
    && (!filters.kind || (filters.kind === "practical" ? q.practical : q.type === filters.kind)));
}

function start(questions, mode, category, title, seconds) {
  if (!questions.length) return;
  if (!profile()) {
    openProfile(() => start(questions, mode, category, title, seconds));
    return;
  }
  if (draft() && !window.confirm("Máš rozpracovaný pokus. Chceš ho nahradiť novým?")) return;
  const order = Object.fromEntries(questions.filter(q => q.options || q.pairs)
    .map(q => [q.id, shuffled(q.options ?? q.answer)]));
  profile().draft = {
    bankVersion: bank.version, id: key(), title, mode, category, ids: questions.map(q => q.id),
    answers: {}, checked: {}, marked: {}, order, index: 0, started: Date.now(), seconds
  };
  persist();
  navigate("pokus");
}

function lastAnswers(mode) {
  const latest = new Map();
  for (const h of history()) {
    if (!mode || h.mode === mode) for (const d of h.details) latest.set(d.id, d);
  }
  return latest;
}

function quickPractice(errors = false) {
  if (!profile()) {
    openProfile(() => quickPractice(errors));
    return;
  }
  const category = profile().category;
  const latest = lastAnswers();
  let eligible = bank.questions.filter(q => q.categories.includes(category));
  if (errors) eligible = eligible.filter(q => latest.get(q.id)?.correct === false);
  else {
    eligible = shuffled(eligible);
    eligible.sort((a, b) => Number(latest.has(a.id)) - Number(latest.has(b.id)));
  }
  if (!eligible.length) {
    $("#notice").textContent = "Zatiaľ tu nie sú otázky na zopakovanie.";
    return;
  }
  start(eligible.slice(0, 10), "practice", category, errors ? "Moje chyby" : "Denný tréning", 0);
}

function home() {
  const continentTiles = bank.continents.map(region => {
    const countries = bank.countries.filter(c => c.region === region).length;
    return `<button class="tile" data-atlas="${esc(region)}"><span class="badge">KONTINENT</span><strong>${esc(region)}</strong><small>${countries ? `${countries} kariet štátov` : "Polárny región"}</small></button>`;
  }).join("");
  screen.innerHTML = `<section class="hero-geo"><p class="kicker">GEOGRAFICKÁ OLYMPIÁDA · E, F, G</p>
    <h1>Spoznávaj svet.</h1><p>Rozpoznaj krajinu na mape, vysvetli súvislosti a priprav sa na teoretické aj praktické úlohy.</p>
    <div class="actions"><a class="primary" href="#trening">Vybrať tréning →</a><a class="secondary" href="#atlas">Otvoriť atlas</a></div></section>
    <section class="panel"><div class="row"><div><p class="kicker">UČENIE PO MALÝCH KROKOCH</p><h2>Čo dnes precvičíš?</h2></div>
    <span class="badge">${bank.questions.length} otázok · ${bank.tests.length} zostáv</span></div>
    <div class="actions"><button class="primary" id="daily">Denný tréning · 10 otázok</button>
    <button class="secondary" id="errors">Moje chyby</button>
    ${draft() ? '<button class="secondary" id="resume">Pokračovať v pokuse →</button>' : ""}</div><p id="notice" class="hint" role="status"></p></section>
    <h2 class="section-title">Kontinenty a štáty</h2><div class="grid">${continentTiles}</div>
    <h2 class="section-title">Tematické okruhy</h2><div class="grid">${Object.keys(bank.lessons).filter(t => !bank.continents.includes(t)).map(t =>
      `<button class="tile" data-topic="${esc(t)}"><span class="badge">TÉMA</span><strong>${esc(t)}</strong><small>${bank.questions.filter(q => q.topic === t).length} úloh</small></button>`).join("")}</div>`;
  $("#daily").onclick = () => quickPractice();
  $("#errors").onclick = () => quickPractice(true);
  if ($("#resume")) $("#resume").onclick = () => navigate("pokus");
  screen.querySelectorAll("[data-atlas]").forEach(button => button.onclick = () => {
    atlasTopic = button.dataset.atlas;
    atlasSearch = "";
    navigate("atlas");
  });
  screen.querySelectorAll("[data-topic]").forEach(button => button.onclick = () => openTopic(button.dataset.topic));
}

const options = (values, current, emptyLabel) => (emptyLabel ? `<option value="">${emptyLabel}</option>` : "") +
  values.map(([value, label]) => `<option value="${esc(value)}"${value === current ? " selected" : ""}>${esc(label)}</option>`).join("");
const values = items => items.map(item => [item, item]);
let presetSearch = "", presetKind = "", presetLimit = 9;

function openTopic(topic, country = "") {
  Object.assign(filters, { topic, country, level: "", kind: "" });
  navigate("trening");
}

function setup() {
  const countryOptions = bank.countries.filter(c => c.region === filters.topic)
    .map(c => c.name).sort((a, b) => a.localeCompare(b, "sk"));
  const eligible = filteredQuestions();
  screen.innerHTML = `<p class="kicker">TRÉNING A TESTY</p><h1>Vyber si úlohy.</h1>
  <section class="panel"><h2>Vlastný výber</h2><div class="controls">
    <label>Kategória<select name="category">${options(Object.entries(grades), filters.category)}</select></label>
    <label>Kontinent alebo téma<select name="topic">${options(values(Object.keys(bank.lessons)), filters.topic, "Všetky okruhy")}</select></label>
    <label>Štát<select name="country" ${countryOptions.length ? "" : "disabled"}>${options(values(countryOptions), filters.country, "Všetky štáty")}</select></label>
    <label>Náročnosť<select name="level">${options([["1","Základy"],["2","Pokročilé"],["3","Výzva"]], filters.level, "Všetky úrovne")}</select></label>
    <label>Typ úlohy<select name="kind">${options([["mc","Výber odpovede"],["short","Krátka odpoveď"],["fill","Doplňovanie pojmov"],["match","Priraďovanie"],["practical","Mapy, grafy a výpočty"]], filters.kind, "Všetky typy")}</select></label>
    <label>Počet otázok<select name="count">${options(values(["5","10","15","20","30"]), filters.count)}</select></label>
    <label>Režim<select name="mode">${options([["practice","Tréning"],["exam","Skúšobný test"]], filters.mode)}</select></label>
  </div><p class="hint">${eligible.length} otázok spĺňa výber. V tréningu dostaneš vysvetlenie hneď, v teste po odovzdaní.</p>
  <div class="actions"><button class="primary" id="start" ${eligible.length ? "" : "disabled"}>Spustiť →</button>
  ${draft() ? '<button class="secondary" id="resume">Pokračovať v pokuse</button>' : ""}</div></section>
  <section class="panel"><h2>Hotové zostavy · kategória ${esc(filters.category)}</h2>
    <form id="preset-filter" class="controls"><label>Hľadať zostavu<input name="search" value="${esc(presetSearch)}"></label>
    <label>Druh zostavy<select name="preset-kind">${options(values(["Súhrnné","Tematické","Praktické"]), presetKind, "Všetky zostavy")}</select></label>
    <div class="actions"><button class="secondary">Zobraziť</button></div></form><div id="presets"></div>
  </section><p class="hint">Zostavy obsahujú vlastné cvičné úlohy. Obsah a časové limity aktuálneho súťažného ročníka nájdeš v pokynoch NIVaM.</p>`;
  screen.querySelectorAll(".panel:first-of-type select").forEach(select => {
    select.onchange = () => {
      if (select.name === "topic") filters.country = "";
      filters[select.name] = select.value;
      setup();
      screen.querySelector(`select[name="${select.name}"]`)?.focus();
    };
  });
  $("#start").onclick = () => {
    const selected = shuffled(eligible).slice(0, Number(filters.count));
    start(selected, filters.mode, filters.category, filters.country || filters.topic || "Vlastný výber", selected.length * 60);
  };
  if ($("#resume")) $("#resume").onclick = () => navigate("pokus");
  $("#preset-filter").onsubmit = event => {
    event.preventDefault();
    presetSearch = event.currentTarget.elements.search.value;
    presetKind = event.currentTarget.elements["preset-kind"].value;
    presetLimit = 9;
    presets();
  };
  presets();
}

function presets() {
  const sets = bank.tests.filter(t => t.category === filters.category
    && (!presetKind || t.kind === presetKind) && norm(t.title).includes(norm(presetSearch)));
  $("#presets").innerHTML = `<p class="hint">${sets.length} zostáv</p><div class="grid">${sets.slice(0, presetLimit).map(t => {
    const best = history().filter(h => h.testKey === t.id && h.mode === "exam").map(h => h.percent);
    return `<article class="tile"><span class="badge">${esc(t.kind)}</span><strong>${esc(t.title)}</strong>
      <small>${t.ids.length} otázok · ${formatTime(t.seconds)} v teste${best.length ? ` · najlepšie ${Math.max(...best)} %` : ""}</small>
      <div class="actions"><button class="secondary" data-set="${esc(t.id)}" data-mode="practice">Trénovať</button><button class="primary" data-set="${esc(t.id)}" data-mode="exam">Test →</button></div></article>`;
  }).join("")}</div>${sets.length > presetLimit ? '<p><button class="secondary" id="more">Zobraziť ďalšie zostavy</button></p>' : ""}`;
  $("#presets").querySelectorAll("[data-set]").forEach(button => {
    button.onclick = () => {
      const t = bank.tests.find(test => test.id === button.dataset.set);
      startPreset(t, button.dataset.mode);
    };
  });
  if ($("#more")) $("#more").onclick = () => { presetLimit += 9; presets(); };
}

function startPreset(t, mode) {
  if (!profile()) {
    openProfile(() => startPreset(t, mode));
    return;
  }
  const previous = draft()?.id;
  start(t.ids.map(id => lookup.get(id)), mode, t.category, t.title, t.seconds);
  if (draft() && draft().id !== previous) {
    draft().testKey = t.id;
    persist();
  }
}

let atlasTopic = "Európa", atlasSearch = "";

function atlas() {
  const countries = bank.countries.filter(c => c.region === atlasTopic && norm(c.name).includes(norm(atlasSearch)))
    .sort((a, b) => a.name.localeCompare(b.name, "sk"));
  screen.innerHTML = `<p class="kicker">ATLAS A UČEBNICA</p><h1>Spoznaj súvislosti.</h1>
    <section class="panel"><div class="controls"><label>Kontinent alebo téma
    <select id="atlas-topic">${options(values(Object.keys(bank.lessons)), atlasTopic)}</select></label></div>
    <h2>${esc(atlasTopic)}</h2><ul class="atlas-facts">${bank.lessons[atlasTopic].map(line => `<li>${esc(line)}</li>`).join("")}</ul>
    <button class="primary" id="atlas-practice">Precvičiť okruh →</button></section>
    ${bank.continents.includes(atlasTopic) && atlasTopic !== "Antarktída" ? `<section class="panel"><h2>Karty štátov</h2>
    <form id="country-search" class="controls"><label>Hľadať podľa názvu<input name="country" value="${esc(atlasSearch)}"></label><div class="actions"><button class="secondary">Vyhľadať</button></div></form>
    <p class="hint">${countries.length} kariet</p>${countries.map(c => `<details class="country-group"><summary>${esc(c.name)}</summary>
    <p><strong>${c.capitalLabel || "Hlavné mesto"}</strong> · ${esc(c.capital)}</p>
    <p>${esc(c.note)}</p><button class="secondary" data-country="${esc(c.name)}">Precvičiť štát →</button></details>`).join("")}</section>` : ""}
    <section class="panel"><h2>Zdroje a olympiáda</h2><p>Príprava je rozdelená do kategórií G, F a E. Aktuálne tematické pokyny a súťažné zadania zverejňuje NIVaM.</p>
    <ul class="atlas-facts"><li><a href="https://nivam.sk/olympiady-a-sutaze/geograficka-olympiada/">Geografická olympiáda · NIVaM</a></li>
    <li><a href="https://www.naturalearthdata.com/">Natural Earth</a> · obrysové mapy, verejná doména, zjednodušené výrezy</li></ul></section>`;
  $("#atlas-topic").onchange = event => { atlasTopic = event.target.value; atlasSearch = ""; atlas(); $("#atlas-topic").focus(); };
  $("#atlas-practice").onclick = () => openTopic(atlasTopic);
  if ($("#country-search")) $("#country-search").onsubmit = event => {
    event.preventDefault();
    atlasSearch = event.currentTarget.elements.country.value;
    atlas();
  };
  screen.querySelectorAll("[data-country]").forEach(button => button.onclick = () => openTopic(atlasTopic, button.dataset.country));
}

function diagram(visual) {
  if (!visual) return "";
  if (visual.type === "image") {
    return `<figure class="diagram"><img src="${esc(visual.file)}" alt="Obrysová mapa so zvýrazneným územím"><figcaption>Zjednodušený mapový výrez · Natural Earth</figcaption></figure>`;
  }
  if (visual.type === "grid") {
    const x = lon => 258 + lon * 2;
    const y = lat => 123 - lat * 2.25;
    const lines = [];
    for (let lon = -90; lon <= 90; lon += 30) {
      lines.push(`<path d="M${x(lon)},47V199" stroke="${lon ? "#a2bbb6" : "#294f48"}"/><text x="${x(lon)}" y="221">${Math.abs(lon)}°${lon < 0 ? " Z" : lon > 0 ? " V" : ""}</text>`);
    }
    for (let lat = -30; lat <= 30; lat += 10) {
      lines.push(`<path d="M78,${y(lat)}H438" stroke="${lat ? "#a2bbb6" : "#294f48"}"/><text x="47" y="${y(lat)+4}">${Math.abs(lat)}°${lat < 0 ? " J" : lat > 0 ? " S" : ""}</text>`);
    }
    return `<figure class="diagram"><svg viewBox="0 0 510 238" role="img" aria-label="Zemepisná sieť s vyznačeným bodom P.">
      <g font-family="system-ui" font-size="13" text-anchor="middle" fill="#203c38">${lines.join("")}</g>
      <circle cx="${x(visual.lon)}" cy="${y(visual.lat)}" r="6" fill="#983e1e"/><text x="${x(visual.lon)+10}" y="${y(visual.lat)-7}" fill="#983e1e" font-weight="800">P</text></svg>
      <figcaption>S a J označujú zemepisnú šírku, V a Z zemepisnú dĺžku.</figcaption></figure>`;
  }
  const points = [];
  const bars = visual.rain.map((rain, index) => {
    const x = 37 + index * 37;
    const height = rain / Math.max(...visual.rain) * 110;
    const tempY = 153 - visual.temperatures[index] * 4;
    points.push(`${x},${tempY}`);
    return `<rect x="${x - 11}" y="${158-height}" width="22" height="${height}" fill="#b2dbec"/>
      <text x="${x}" y="177">${index+1}</text><text x="${x}" y="197">${rain}</text><text x="${x}" y="215">${visual.temperatures[index]}</text>`;
  }).join("");
  return `<figure class="diagram"><svg viewBox="0 0 490 229" role="img" aria-label="Klimadiagram s hodnotami v tabuľke pod obrázkom">
  <g font-family="system-ui" font-size="12" text-anchor="middle" fill="#203c38">${bars}</g>
  <polyline points="${points.join(" ")}" fill="none" stroke="#aa4d2a" stroke-width="2.5"/>
  <path d="M18 158H463" stroke="#355752"/></svg><figcaption>Modelové údaje. Pod grafom sú čísla mesiacov, zrážky v mm a teploty v °C.</figcaption>
  <details><summary>Údaje v textovej podobe</summary><p>Zrážky od januára po december · ${visual.rain.join(", ")} mm</p><p>Teploty od januára po december · ${visual.temperatures.join(", ")} °C</p></details></figure>`;
}

function answerText(q, answer) {
  if (!isAnswered(answer)) return "Bez úplnej odpovede";
  if (q.type === "match") return q.pairs.map(([item], i) => `${item} → ${answer[i]}`).join(" · ");
  return answer;
}

function feedback(q, answer) {
  const passed = correct(q, answer);
  return `<div class="feedback ${passed ? "" : "wrong"}" role="status"><strong>${passed ? "✓ Správne" : "Pozri si správne riešenie"}</strong>
    <p>${q.type === "match" ? "" : `<b>${esc(Array.isArray(q.answer) ? q.answer[0] : q.answer)}</b><br>`}${esc(q.explanation)}</p>
    ${q.type === "match" ? `<ul>${q.pairs.map(([item], i) =>
      `<li>${answer?.[i] === q.answer[i] ? "✓" : "○"} ${esc(item)} → ${esc(q.answer[i])}</li>`).join("")}</ul>` : ""}</div>`;
}

function secondsFor(run) {
  const elapsed = Math.max(0, Math.floor((Date.now() - run.started) / 1000));
  return run.mode === "exam" ? Math.max(0, run.seconds - elapsed) : elapsed;
}

function answerControls(run, q, answer, locked) {
  if (q.type === "mc") return run.order[q.id].map((choice, i) =>
    `<button class="option" type="button" data-choice="${i}" aria-pressed="${answer === choice}" ${locked ? "disabled" : ""}>
    <b>${"ABCD"[i]}</b>${esc(choice)}</button>`).join("");
  if (q.type === "match") return q.pairs.map(([item], i) =>
    `<label class="match-line">${esc(item)}<select data-pair="${i}" ${locked ? "disabled" : ""}>${options(values(run.order[q.id]), answer?.[i], "Vyber odpoveď")}</select></label>`).join("");
  return `<label>Tvoja odpoveď<input id="short-answer" value="${esc(answer)}" autocomplete="off" maxlength="100" ${locked ? "disabled" : ""}></label>`;
}

function renderRun() {
  const run = draft();
  if (!run) { navigate("trening"); return; }
  if (run.bankVersion !== bank.version || !run.ids.every(id => lookup.has(id))) {
    profile().draft = null;
    persist();
    navigate("trening");
    return;
  }
  if (run.mode === "exam" && secondsFor(run) === 0) { finish(); return; }
  const q = lookup.get(run.ids[run.index]);
  const answer = run.answers[q.id];
  const locked = run.mode === "practice" && run.checked[q.id];
  screen.innerHTML = `<article class="panel test-panel">
    <div class="row"><span class="badge">${modeName(run.mode)} · ${esc(run.category)}</span>
      <span aria-label="${run.mode === "exam" ? "Zostávajúci čas" : "Uplynutý čas"}" id="timer">${formatTime(secondsFor(run))}</span></div>
    <div class="progress" aria-hidden="true"><span style="width:${(run.index+1)*100/run.ids.length}%"></span></div>
    <p class="kicker">OTÁZKA ${run.index+1} Z ${run.ids.length} · ${esc(q.topic)}</p><h1>${esc(q.prompt)}</h1>
    ${diagram(q.visual)}<div class="options">${answerControls(run,q,answer,locked)}</div>
    ${locked ? feedback(q,answer) : ""}<p id="answer-warning" class="alert" role="status"></p>
    <div class="actions"><button class="secondary" id="prev" ${run.index ? "" : "disabled"}>← Predchádzajúca</button>
    ${run.mode === "practice" && !locked ? '<button class="primary" id="check">Overiť odpoveď</button>' :
      `<button class="primary" id="next">${run.index === run.ids.length-1 ? "Vyhodnotiť" : "Ďalšia otázka →"}</button>`}
    <button class="secondary" id="flag">${run.marked[q.id] ? "★ Zrušiť označenie" : "☆ Označiť na návrat"}</button></div>
    <div class="question-map" aria-label="Prejsť na otázku">${run.ids.map((id,i) => `<button class="secondary ${isAnswered(run.answers[id]) ? "answered" : ""}" data-jump="${i}"
      aria-label="Otázka ${i+1}${run.marked[id] ? " · označená" : ""}" ${run.index === i ? 'aria-current="step"' : ""}>${i+1}${run.marked[id] ? "★" : ""}</button>`).join("")}</div>
    <p class="hint" id="answered-count"></p><div class="actions"><button class="secondary" id="leave">Uložiť a odísť</button>
    <button class="plain" id="submit">Odovzdať pokus</button></div></article>`;
  function updateAnswer(value) {
    run.answers[q.id] = value;
    persist();
    updateCount(run);
  }
  updateCount(run);
  screen.querySelectorAll("[data-choice]").forEach(button => button.onclick = () => {
    updateAnswer(run.order[q.id][Number(button.dataset.choice)]);
    screen.querySelectorAll("[data-choice]").forEach(option => option.setAttribute("aria-pressed", option === button));
  });
  screen.querySelectorAll("[data-pair]").forEach(select => select.onchange = () => {
    const entries = [...(run.answers[q.id] ?? q.pairs.map(() => ""))];
    entries[Number(select.dataset.pair)] = select.value;
    updateAnswer(entries);
  });
  if ($("#short-answer")) $("#short-answer").oninput = event => updateAnswer(event.target.value);
  function jump(index) { run.index = index; persist(); renderRun(); scrollTo(0,0); }
  screen.querySelectorAll("[data-jump]").forEach(button => button.onclick = () => jump(Number(button.dataset.jump)));
  $("#prev").onclick = () => jump(run.index-1);
  $("#flag").onclick = () => { run.marked[q.id] = !run.marked[q.id]; persist(); renderRun(); $("#flag")?.focus(); };
  $("#leave").onclick = () => navigate("prehlad");
  $("#submit").onclick = () => confirmSubmit(run);
  if ($("#check")) $("#check").onclick = () => {
    if (!isAnswered(run.answers[q.id])) { $("#answer-warning").textContent = "Najprv zadaj celú odpoveď."; return; }
    run.checked[q.id] = true;
    persist();
    renderRun();
    $(".feedback")?.scrollIntoView({ block: "nearest" });
  };
  if ($("#next")) $("#next").onclick = () => run.index === run.ids.length-1 ? confirmSubmit(run) : jump(run.index+1);
}

function updateCount(run) {
  const count = run.ids.filter(id => isAnswered(run.answers[id])).length;
  $("#answered-count").textContent = `Zodpovedané ${count} z ${run.ids.length}. ${run.mode === "exam" ? "V skúšobnom teste čas plynie aj po odchode." : ""}`;
  screen.querySelectorAll("[data-jump]").forEach(button => {
    button.classList.toggle("answered", isAnswered(run.answers[run.ids[Number(button.dataset.jump)]]));
  });
}

function confirmSubmit(run) {
  const missing = run.ids.filter(id => !isAnswered(run.answers[id])).length;
  if (!missing || window.confirm(`Počet neúplných odpovedí: ${missing}. Odovzdať pokus?`)) finish();
}

function finish() {
  const run = draft();
  if (!run) return;
  const details = run.ids.map(id => {
    const q = lookup.get(id);
    const answer = run.answers[id] ?? null;
    return { id, answer, correct: !!q && correct(q, answer) };
  });
  const score = details.filter(d => d.correct).length;
  const elapsed = run.mode === "exam" ? run.seconds - secondsFor(run) : secondsFor(run);
  currentResult = { id: run.id, title: run.title, testKey: run.testKey, category: run.category, mode: run.mode,
    date: new Date().toISOString(), elapsed, score, percent: Math.round(score * 100 / details.length), details };
  profile().history.push(currentResult);
  profile().draft = null;
  persist();
  navigate("vysledok");
}

function result() {
  const r = currentResult;
  if (!r) { navigate("pokrok"); return; }
  const errors = r.details.filter(d => !d.correct).map(d => lookup.get(d.id)).filter(Boolean);
  screen.innerHTML = `<section class="panel test-panel"><p class="kicker">${esc(r.title)} · ${modeName(r.mode)} · ${esc(r.category)}</p>
    <h1>Výsledok pokusu</h1><div class="score">${r.percent} %</div><p>${r.score} z ${r.details.length} bodov · čas ${formatTime(r.elapsed)}</p>
    <div class="actions">${errors.length ? '<button class="primary" id="retry">Precvičiť chyby →</button>' : ""}<a class="secondary" href="#pokrok">Môj pokrok</a><a class="secondary" href="#trening">Nový tréning</a></div>
    </section><section class="panel test-panel"><h2>Riešenia a vysvetlenia</h2>${r.details.map(d => {
      const q = lookup.get(d.id);
      return q ? `<details class="review"><summary>${d.correct ? "✓" : "○"} ${esc(q.prompt)}</summary>${diagram(q.visual)}
        <p>Tvoja odpoveď · ${esc(answerText(q,d.answer))}</p>${feedback(q,d.answer)}</details>` : "";
    }).join("")}</section>`;
  if ($("#retry")) $("#retry").onclick = () => start(errors, "practice", r.category, "Oprava chýb", 0);
}

function progress() {
  const exam = history().filter(h => h.mode === "exam");
  const latest = lastAnswers("exam");
  const practice = history().length - exam.length;
  screen.innerHTML = `<p class="kicker">MÔJ POKROK</p><h1>Tvoje výsledky.</h1>
    ${!profile() ? '<section class="panel"><p>Vytvor si profil a výsledky sa začnú ukladať.</p><button class="primary" id="create">Vytvoriť profil</button></section>' : `
    <section class="panel"><div class="row"><h2>${esc(profile().name)} · kategória ${esc(profile().category)}</h2><button class="secondary" id="switch">Prepnúť profil</button></div>
      <p>${exam.length} skúšobných testov · ${practice} tréningov · ${latest.size} rôznych otázok v skúšobných testoch</p>
      <button class="secondary" id="errors">Precvičiť moje chyby</button><p id="notice" role="status"></p></section>
    <section class="panel"><h2>Skúšobné testy podľa tém</h2>${Object.keys(bank.lessons).map(topic => {
      const seen = [...latest].filter(([id]) => lookup.get(id)?.topic === topic);
      const ratio = seen.length ? Math.round(seen.filter(([,d]) => d.correct).length * 100 / seen.length) : null;
      return `<div class="row list-row"><span>${esc(topic)}<br><small>${seen.length} rôznych otázok</small></span><b>${ratio === null ? "—" : ratio + " %"}</b></div>`;
    }).join("")}</section>
    <section class="panel"><h2>História pokusov</h2>${history().length ? [...history()].reverse().map(r =>
      `<div class="row list-row"><span>${esc(r.title)}<br><small>${modeName(r.mode)} · ${esc(r.category)} · ${new Date(r.date).toLocaleDateString("sk-SK")}</small></span>
        <button class="secondary" data-result="${esc(r.id)}">${r.percent} % · ${formatTime(r.elapsed)} →</button></div>`).join("") : "<p>Zatiaľ nemáš ukončený pokus.</p>"}
      ${history().length ? '<button class="secondary" id="export">Stiahnuť výsledky JSON</button>' : ""}</section>`}`;
  if ($("#create")) $("#create").onclick = () => openProfile();
  if ($("#switch")) $("#switch").onclick = () => openProfile();
  if ($("#errors")) $("#errors").onclick = () => quickPractice(true);
  screen.querySelectorAll("[data-result]").forEach(button => button.onclick = () => {
    currentResult = history().find(r => r.id === button.dataset.result);
    navigate("vysledok");
  });
  if ($("#export")) $("#export").onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile(), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "geograficka-akademia-vysledky.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}

function render() {
  if (!bank) return;
  const page = route();
  document.querySelectorAll(".academy-header nav a").forEach(link => {
    if (link.hash === `#${page}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  profileLabel();
  const views = { prehlad: home, trening: setup, atlas, pokrok: progress, pokus: renderRun, vysledok: result };
  (views[page] ?? home)();
  if (storageFailed) screen.insertAdjacentHTML("afterbegin", '<p class="alert" role="status">Prehliadač momentálne nepovoľuje uloženie výsledkov.</p>');
}

window.addEventListener("hashchange", render);
setInterval(() => {
  const run = draft(), clock = $("#timer");
  if (route() !== "pokus" || !run || !clock) return;
  const seconds = secondsFor(run);
  clock.textContent = formatTime(seconds);
  if (run.mode === "exam" && !seconds) finish();
}, 500);

fetch("bank.json?v=1").then(response => {
  if (!response.ok) throw Error("bank");
  return response.json();
}).then(value => {
  bank = value;
  lookup = new Map(bank.questions.map(q => [q.id, q]));
  if (profile()) filters.category = profile().category;
  render();
}).catch(() => {
  screen.innerHTML = '<p class="alert" role="alert">Databázu otázok sa nepodarilo načítať. Skús stránku obnoviť.</p>';
});

