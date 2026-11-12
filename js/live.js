"use strict";
/* ===================== LIVE — ເບິ່ງບິນທີ່ເປີດຢູ່ຈາກເຄື່ອງອື່ນ (ອ່ານຢ່າງດຽວ) =====================
   ແຕ່ລະເຄື່ອງສົ່ງ "ພາບຖ່າຍ" ຂອງບິນທີ່ຍັງເປີດຢູ່ ຂຶ້ນ Apps Script (action: putOpen)
   ເຄື່ອງອື່ນດຶງມາສະແດງ (action: open) ເພື່ອໃຫ້ເຫັນວ່າ ໂຕະໃດມີຄົນຮັບອໍເດີແລ້ວ · ໃຜຄີບິນ · ມີລາຍການຫຍັງ
   ບໍ່ໄດ້ແກ້ບິນຂອງກັນ — ແຕ່ລະເຄື່ອງຍັງເກັບບິນ ເລກບິນ ແລະ ເງິນສົດຂອງຕົນເອງ (ກັນເລກບິນຊ້ຳ/ຍອດເງິນປົນກັນ)
   ໃຊ້ URL ຂອງ Apps Script ອັນດຽວກັບ ຊິງຄ໌ການຕັ້ງຄ່າ/ສົ່ງຍອດປິດກະ (cfg.sheets.url)
   ຕ້ອງເພີ່ມໂຄດຈາກ apps-script/open-bills.gs ໃນ Apps Script ກ່ອນ — ຖ້າຍັງບໍ່ເພີ່ມ ລະບົບນີ້ຈະປິດຕົວເອງງຽບໆ */
const LIVE_KEY = "mb-open";            // ຕ້ອງຕົງກັບ OPEN_KEY ໃນ Apps Script
const LIVE_TICK_MS = 12000;            // ດຶງ/ກວດການປ່ຽນແປງທຸກ 12 ວິນາທີ (ສະເພາະຕອນໜ້າແອັບເປີດຢູ່)
const LIVE_HEARTBEAT_MS = 60000;       // ບໍ່ມີການປ່ຽນແປງ ກໍສົ່ງຢືນຢັນວ່າຍັງອອນໄລນ໌ທຸກ 1 ນາທີ
const LIVE_STALE_MS = 3 * 60000;       // ເຄື່ອງທີ່ງຽບເກີນ 3 ນາທີ ສະແດງເປັນຈາງ (ອາດອອບໄລນ໌)
const LIVE = { dev: "", supported: null, remote: [], sig: "", rsig: "", lastPush: 0, busy: false, tickN: 0, err: "" };

(function liveDeviceId() {
  try {
    let d = localStorage.getItem("mb-device");
    if (!d) { d = Math.random().toString(36).slice(2, 8); localStorage.setItem("mb-device", d); }
    LIVE.dev = d;
  } catch (e) { LIVE.dev = Math.random().toString(36).slice(2, 8); }
})();

/* ແກ້ຄ່າທີ່ວາງຜິດ: ຖ້າໃນຊ່ອງ URL ເຄີຍວາງ "ລິງກ໌ຕິດຕັ້ງ" (…/midnightbar/?s=<exec>) ໃຫ້ດຶງສະເພາະ URL exec ອອກມາ */
(function liveRepairUrl() {
  try {
    const u = cfg.sheets && cfg.sheets.url;
    if (u && u.indexOf("?s=") > -1) {
      const s = new URL(u).searchParams.get("s");
      if (s && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(s.trim())) { cfg.sheets.url = s.trim(); save(); }
    }
  } catch (e) {}
})();

const liveUrl = () => (cfg.sheets && cfg.sheets.url) || "";

/* ພາບຖ່າຍບິນທີ່ຍັງບໍ່ໄດ້ຊຳລະ — ຕ້ອງນ້ອຍກວ່າ ~8 KB (ຂີດຈຳກັດຂອງ Apps Script Properties) */
function liveSnapshot() {
  const bills = state.bills.filter(b => b.status !== "paid").map(b => {
    const t = totals(b);
    return { no: b.no, t: b.table, tn: tableOf(b.table).name, w: b.waiter, g: b.guests, o: b.opened, st: b.status,
             n: t.items, amt: t.total, it: liveLines(b).map(l => [l.name, l.qty, l.unit * l.qty]) };
  });
  for (let i = 0; i < bills.length && JSON.stringify(bills).length > 6500; i++) bills[i].it = [];
  return bills;
}

async function livePush(force) {
  const url = liveUrl();
  if (!url) return;
  const bills = liveSnapshot(), sig = JSON.stringify(bills), now = Date.now();
  if (!force && sig === LIVE.sig && now - LIVE.lastPush < LIVE_HEARTBEAT_MS) return;
  LIVE.sig = sig; LIVE.lastPush = now;
  try {
    // no-cors: ສົ່ງໄດ້ແຕ່ອ່ານຄຳຕອບບໍ່ໄດ້ — ຜົນຈະເຫັນຈາກການດຶງ (livePoll)
    await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "putOpen", k: LIVE_KEY, id: LIVE.dev, user: (state.user && state.user.name) || "", bills }) });
  } catch (e) { LIVE.lastPush = 0; }
}

async function livePoll() {
  const url = liveUrl();
  if (!url || LIVE.busy) return;
  LIVE.busy = true;
  try {
    const r = await fetch(`${url}?action=open&k=${encodeURIComponent(LIVE_KEY)}&t=${Date.now()}`, { method: "GET" });
    const d = await r.json();
    if (!d || !d.ok || !Array.isArray(d.devices)) { LIVE.supported = false; LIVE.remote = []; liveRefreshUI(); return; }
    LIVE.supported = true;
    const srvNow = Number(d.now) || Date.now();
    LIVE.remote = d.devices.filter(x => x && x.id !== LIVE.dev).flatMap(x =>
      (x.bills || []).map(b => ({ ...b, dev: x.id, by: x.user || "", seen: x.at, stale: srvNow - x.at > LIVE_STALE_MS })));   // by = ຜູ້ທີ່ລັອກອິນຢູ່ໃນເຄື່ອງນັ້ນ (ວ່າງ = ລັອກໜ້າຈໍ)
    liveRefreshUI();
  } catch (e) { LIVE.err = String((e && e.message) || e); }
  finally { LIVE.busy = false; }
}

const liveForTable = id => (LIVE.supported === true ? LIVE.remote.filter(b => b.t === id && !b.stale) : []);
const liveSorted = () => LIVE.remote.slice().sort((a, c) => String(a.tn).localeCompare(String(c.tn), undefined, { numeric: true }));

/* ຊື່ + ຕຳແໜ່ງ ຂອງຄົນທີ່ກຳລັງປ້ອນ
   ຊື່ = ຜູ້ທີ່ລັອກອິນຢູ່ໃນເຄື່ອງນັ້ນ (ຊື່ໃດໃນລະບົບເຂົ້າສູ່ລະບົບ ກໍສະແດງຊື່ນັ້ນ) · ຕຳແໜ່ງຫາຈາກລາຍຊື່ພະນັກງານ (ຊິງຄ໌ຖືກກັນທຸກເຄື່ອງ)
   ຖ້າເຄື່ອງນັ້ນລັອກໜ້າຈໍຢູ່ ໃຊ້ຊື່ຄົນທີ່ເປີດບິນແທນ ແລະ ບອກວ່າ "ລັອກໜ້າຈໍ" */
function liveWho(b) {
  const name = b.by || b.w || "";
  const s = (cfg.staff || []).find(x => x.name === name);
  return { name, role: s && ROLES[s.role] ? ROLES[s.role] : "", on: !!b.by };
}
const liveWhoText = b => { const w = liveWho(b); return w.name + (w.role ? ` · ${w.role}` : ""); };

/* ບັດບິນຂອງເຄື່ອງອື່ນ — ວາງຕໍ່ທ້າຍລາຍການບິນໃນໜ້າ "ບິນ" */
function liveCardsHTML() {
  if (LIVE.supported !== true || !LIVE.remote.length) return "";
  const list = liveSorted();
  return `<div class="live-h">${icon("i-users", "sm")}<span>${T("ກຳລັງປ້ອນບິນຢູ່ເຄື່ອງອື່ນ", "Being keyed on other devices")} · ${list.length}</span><small>${T("ເບິ່ງຢ່າງດຽວ", "view only")}</small></div>`
    + list.map((b, i) => {
      const w = liveWho(b);
      const st = b.stale ? `<span class="muted">${T("ບໍ່ອັບເດດ", "no update")}</span>`
        : !w.on ? `<span class="muted">${T("ລັອກໜ້າຈໍ", "Locked")}</span>`
        : `<span style="color:var(--gold-ink)">● ${T("ກຳລັງປ້ອນ", "Keying")}</span>`;
      return `
    <button class="bill-pick live" data-live="${i}" ${b.stale ? 'data-stale="1"' : ""} aria-label="${T("ເບິ່ງບິນໂຕະ", "View bill for table")} ${esc(b.tn)}">
      <span class="tno">${esc(b.tn)}</span>
      <span class="bmeta">#${esc(b.no)} · ${b.n} ${T("ລາຍການ", "items")}</span>
      <span class="bamt num">${fmt(b.amt)}</span>
      <span class="bmeta who"><b>${esc(w.name)}</b>${w.role ? `<em>${esc(w.role)}</em>` : ""}</span>
      <span class="bst">${st}</span>
    </button>`;
    }).join("");
}

/* ກົດເບິ່ງລາຍການໃນບິນຂອງເຄື່ອງອື່ນ (ອ່ານຢ່າງດຽວ) */
function liveShow(i) {
  const b = liveSorted()[i];
  if (!b) return;
  const rows = (b.it || []).map(x => `<tr><td>${esc(x[0])}</td><td class="c">${x[1]}</td><td class="r num">${fmt(x[2])}</td></tr>`).join("")
    || `<tr><td colspan="3" class="muted">${T("ບໍ່ມີລາຍລະອຽດລາຍການ (ບິນໃຫຍ່ເກີນ)", "Item detail not available")}</td></tr>`;
  openDyn({
    cls: "w-sm", eyebrow: `${T("ເບິ່ງຢ່າງດຽວ · ເຄື່ອງອື່ນ", "View only · other device")}`,
    title: `${T("ໂຕະ", "Table")} ${esc(b.tn)} · #${esc(b.no)}`,
    sub: `${T("ກຳລັງປ້ອນໂດຍ", "Keyed by")} <b>${esc(liveWhoText(b))}</b>${liveWho(b).on ? "" : " (" + T("ລັອກໜ້າຈໍ", "locked") + ")"} · ${b.g} ${T("ຄົນ", "guests")} · ${minsSince(b.o)}${b.stale ? " · " + T("ເຄື່ອງນັ້ນງຽບໄປແລ້ວ", "that device has gone quiet") : ""}`,
    body: `<div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ລາຍການ", "Item")}</th><th class="c">${T("ຈຳນວນ", "Qty")}</th><th class="r">${T("ລວມ", "Total")}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted small" style="margin:10px 0 0">${T("ຍອດຕາມທີ່ເຄື່ອງນັ້ນຄິດ (ລວມສ່ວນຫຼຸດ/ຄ່າບໍລິການ)", "Total as computed on that device (incl. discount/service)")}: <b>${fmt(b.amt)} ₭</b></p>`,
    actions: [{ label: T("ປິດ", "Close"), value: "cancel" }]
  });
}

function liveRefreshUI() {
  const sig = JSON.stringify([LIVE.supported, LIVE.remote.map(b => [b.dev, b.no, b.n, b.amt, b.stale, b.by])]);
  if (sig === LIVE.rsig) return;
  LIVE.rsig = sig;
  if (state.user && state.route === "bill" && !document.querySelector("dialog[open]")) renderBill();
}

document.addEventListener("click", e => {
  const c = e.target.closest("[data-live]");
  if (c) liveShow(+c.dataset.live);
});

setInterval(() => {
  if (!liveUrl() || document.hidden) return;
  LIVE.tickN++;
  if (LIVE.supported === false && LIVE.tickN % 25) return;   // Apps Script ຍັງບໍ່ຮອງຮັບ: ລອງໃໝ່ທຸກ ~5 ນາທີ
  livePush(false); livePoll();
}, LIVE_TICK_MS);
document.addEventListener("visibilitychange", () => { if (!document.hidden && liveUrl()) { livePush(true); livePoll(); } });
setTimeout(() => { if (liveUrl()) { livePush(true); livePoll(); } }, 2500);
