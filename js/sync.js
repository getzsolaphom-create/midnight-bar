"use strict";
/* ===================== ຊິງຄ໌ການຕັ້ງຄ່າຂ້າມເຄື່ອງ (Settings sync) =====================
   ແນວຄິດ: ເຄື່ອງຂອງເຈົ້າຂອງຮ້ານ = ຕົ້ນສະບັບ (ສົ່ງຂຶ້ນ Google Sheet)
           ເຄື່ອງອື່ນ = ອ່ານຢ່າງດຽວ (ດຶງລົງມາໃຊ້ຕອນເປີດແອັບ / ຕອນຢູ່ໜ້າເຂົ້າສູ່ລະບົບ)
   ບໍ່ມີອິນເຕີເນັດ = ໃຊ້ຄ່າທີ່ດຶງໄວ້ຄັ້ງລ່າສຸດໃນເຄື່ອງ ລະບົບຍັງຂາຍໄດ້ຕາມປົກກະຕິ
   ບໍ່ດຶງຄ່າໃໝ່ທັບ ຕອນມີຄົນກຳລັງຂາຍຢູ່ (ກັນເມນູປ່ຽນກາງຄັນ ແລ້ວບິນທີ່ເປີດຄ້າງຢູ່ເພ້ຍນ) */

/* ລິງກ໌ Apps Script ບໍ່ໄດ້ຝັງໄວ້ໃນໂຄດ (ໂຄດຢູ່ GitHub ສາທາລະນະ — ຈະຮົ່ວ)
   ເຄື່ອງພະນັກງານຮັບລິງກ໌ຜ່ານ "ລິງກ໌ຕິດຕັ້ງ" ເທື່ອດຽວ: ...github.io/midnightbar/?s=<ລິງກ໌ exec>
   ເປີດເທື່ອທຳອິດແລ້ວເຄື່ອງຈື່ໄວ້ເລີຍ ເທື່ອຕໍ່ໄປເປີດລິງກ໌ທຳມະດາກໍໄດ້ */
const SYNC_URL_DEFAULT = "";
const SYNC_READ_KEY    = "mb-read";

/* ຄ່າທີ່ຊິງຄ໌ — ບໍ່ລວມ printer (ຕິດກັບເຄື່ອງ) ແລະ sheets (ລິງກ໌+token ຂອງເຈົ້າຂອງ) */
const SYNC_KEYS = ["v","menuV","shop","perms","staff","cats","products","hh","cur","pay","zones","tables","security"];

/* ບອກສະຖານະຊິງຄ໌ຢູ່ໜ້າເຂົ້າສູ່ລະບົບ — ໃຫ້ເຫັນທັນທີວ່າເຄື່ອງນີ້ດຶງໄດ້ຫຼືບໍ່ ແລະເພາະຫຍັງ */
const setSyncStatus = msg => { const el=document.getElementById("syncStatus"); if(el) el.textContent=msg; };
const syncStaffN = () => (cfg.staff||[]).filter(x=>x.active).length;
const syncUrl = () => (cfg.sheets && cfg.sheets.url) || SYNC_URL_DEFAULT;
/* ໂລໂກ້ຮ້ານເປັນຮູບໃຫຍ່ (~130 KB) ບໍ່ສົ່ງຂຶ້ນຊີດ — ຖ້າສົ່ງ ທຸກເຄື່ອງຈະດຶງ 150 KB ທຸກ 2 ນາທີ ແລະເກີນໂຄຕ້າ Apps Script */
const syncPick = () => { const o={}; SYNC_KEYS.forEach(k=>{ if(cfg[k]!==undefined) o[k]=cfg[k]; }); if(o.shop){ const {logo,...rest}=o.shop; o.shop=rest; } return o; };
const syncSig  = () => { try{ return JSON.stringify(syncPick()).length+":"+JSON.stringify(syncPick()).slice(0,4000); }catch(e){ return ""; } };

/* ເຄື່ອງນີ້ແມ່ນເຄື່ອງຂອງເຈົ້າຂອງບໍ? (ມີສິດສົ່ງຂຶ້ນ) — ຕ້ອງເຂົ້າສູ່ລະບົບເປັນເຈົ້າຂອງ ແລະ ມີ token */
const canPushCfg = () => !!(state.user && state.user.role==="owner" && cfg.sheets && cfg.sheets.url && cfg.sheets.token);

let syncLastSig = syncSig(), syncPushT = null, syncBusy = false;   // ຖານຕັ້ງຕົ້ນຕອນໂຫຼດ — ບໍ່ດັ່ງນັ້ນການແກ້ໄຂຄັ້ງທຳອິດຫຼັງເປີດແອັບຈະບໍ່ຖືກສົ່ງ

/* ---------- ດຶງຄ່າລົງ ---------- */
async function pullConfig(opts){
  const url = syncUrl();
  if(!url){ setSyncStatus(T("ຍັງບໍ່ໄດ້ຕັ້ງລິງກ໌ຊິງຄ໌ — ເປີດລິງກ໌ຕິດຕັ້ງ ຫຼື ສະແກນ QR","Sync link not set — open the setup link or scan the QR")); return false; }
  if(syncBusy) return false;
  syncBusy = true;
  try{
    const r = await fetch(`${url}?action=config&k=${encodeURIComponent(SYNC_READ_KEY)}&t=${Date.now()}`,{method:"GET"});
    const d = await r.json();
    if(!d || !d.ok || !d.cfg) {
      setSyncStatus(d&&d.error==="no config yet" ? T("ຕູ້ເຊຟຍັງບໍ່ມີການຕັ້ງຄ່າ — ເຈົ້າຂອງຍັງບໍ່ໄດ້ສົ່ງ","The sheet has no settings yet — the owner hasn't sent any")
                                                   : `${T("ຕູ້ເຊຟຕອບກັບບໍ່ຖືກ","Unexpected sheet reply")}: ${d&&d.error||"?"}`);
      if(opts&&opts.manual) toast(T("ຍັງບໍ່ມີການຕັ້ງຄ່າກາງໃນຊີດ","No shared settings on the sheet yet"),"i-alert",true); return false; }
    const at = Number(d.at||0), mine = Number(cfg.cfgAt||0);
    if(at && at <= mine && !(opts&&opts.force)){ setSyncStatus(`${T("ຊິງຄ໌ກັບຮ້ານແລ້ວ · ໃໝ່ສຸດ","Synced with the shop · up to date")} ${hhmm(Date.now())} · ${T("ພະນັກງານ","staff")} ${syncStaffN()} ${T("ຄົນ","")}`); if(opts&&opts.manual) toast(T("ການຕັ້ງຄ່າໃໝ່ສຸດແລ້ວ","Settings are already up to date"),"i-check"); return false; }
    applyRemoteConfig(d.cfg, at);
    setSyncStatus(`${T("ຊິງຄ໌ຈາກຮ້ານແລ້ວ","Synced from the shop")} ${hhmm(Date.now())} · ${T("ພະນັກງານ","staff")} ${syncStaffN()} ${T("ຄົນ","")}`);
    if(opts&&opts.manual) toast(`${T("ດຶງການຕັ້ງຄ່າຈາກຮ້ານແລ້ວ","Pulled the shop settings")} · ${T("ພະນັກງານ","staff")} ${(cfg.staff||[]).length} ${T("ຄົນ","")}`,"i-check");
    return true;
  }catch(e){
    setSyncStatus(`${T("ດຶງການຕັ້ງຄ່າບໍ່ໄດ້","Couldn't pull settings")}: ${(e&&e.message)||e}`);
    if(opts&&opts.manual) toast(T("ດຶງການຕັ້ງຄ່າບໍ່ໄດ້ — ກວດອິນເຕີເນັດ","Couldn't pull settings — check the internet"),"i-alert",true);
    return false;
  }finally{ syncBusy = false; }
}

function applyRemoteConfig(rc, at){
  const keepLogo = cfg.shop && cfg.shop.logo;
  SYNC_KEYS.forEach(k=>{ if(rc[k]!==undefined) cfg[k]=rc[k]; });
  if(cfg.shop && keepLogo) cfg.shop.logo = keepLogo;   // ໂລໂກ້ຢູ່ກັບເຄື່ອງ ບໍ່ຖືກທັບ
  cfg.cfgAt = at || Date.now();
  /* ຄ່າທີ່ອາດຂາດ ຖ້າຊີດເກັບມາຈາກລຸ້ນເກົ່າ */
  cfg.sheets  = cfg.sheets  || {url:"",token:""};
  cfg.printer = cfg.printer || {};
  cfg.printer.mode = cfg.printer.mode || "save";
  relang([cfg], I18N.lang);
  syncLastSig = syncSig();
  try{ localStorage.setItem(KEY, JSON.stringify({cfg,bottles,audit})); }catch(e){}
  applyBrand(); renderLogin();
  if(state.user) render();
}

/* ---------- ສົ່ງຄ່າຂຶ້ນ (ສະເພາະເຄື່ອງເຈົ້າຂອງ) ---------- */
async function pushConfig(manual){
  if(!canPushCfg()){
    if(manual) toast(T("ສົ່ງໄດ້ສະເພາະເຄື່ອງເຈົ້າຂອງທີ່ຕັ້ງຄ່າ Google Sheets ແລ້ວ","Only the owner's device with Google Sheets set up can send"),"i-alert",true);
    return false;
  }
  const at = Date.now(); cfg.cfgAt = at;
  const url = cfg.sheets.url;
  try{
    await fetch(url,{
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify({action:"saveConfig", token:cfg.sheets.token||"", at, cfg:syncPick()})
    });
  }catch(e){
    toast(T("ສົ່ງການຕັ້ງຄ່າບໍ່ໄດ້ — ກວດອິນເຕີເນັດ","Couldn't send settings — check the internet"),"i-alert",true);
    return false;
  }
  /* POST ແບບ no-cors ອ່ານຜົນບໍ່ໄດ້ (token ຜິດກໍເບິ່ງຄືສຳເລັດ) → ອ່ານກັບມາເບິ່ງວ່າຕູ້ເຊຟບັນທຶກແທ້ */
  let seen = null;
  try{
    await new Promise(r=>setTimeout(r,1500));
    const r = await fetch(`${url}?action=config&k=${encodeURIComponent(SYNC_READ_KEY)}&t=${Date.now()}`,{method:"GET"});
    seen = await r.json();
  }catch(e){ seen = null; }
  const persist = () => { syncLastSig = syncSig(); try{ localStorage.setItem(KEY, JSON.stringify({cfg,bottles,audit})); }catch(e){} };
  if(seen && seen.ok && Number(seen.at)===at){
    persist();
    const n = seen.cfg && Array.isArray(seen.cfg.staff) ? seen.cfg.staff.length : null;
    if(manual) toast(`${T("ສົ່ງການຕັ້ງຄ່າໃຫ້ທຸກເຄື່ອງແລ້ວ","Settings sent to all devices")}${n!=null?` · ${T("ພະນັກງານ","staff")} ${n} ${T("ຄົນ","")}`:""}`,"i-check");
    return true;
  }
  if(seen === null){   // ອ່ານກັບບໍ່ໄດ້ (ເນັດ/CORS) — ບອກຕາມຈິງວ່າຢືນຢັນບໍ່ໄດ້
    persist();
    toast(T("ສົ່ງແລ້ວ ແຕ່ຢືນຢັນບໍ່ໄດ້ວ່າຕູ້ເຊຟບັນທຶກ — ລອງກົດ ດຶງການຕັ້ງຄ່າ ຈາກເຄື່ອງອື່ນເພື່ອກວດ","Sent, but couldn't confirm the sheet saved it — pull from another device to check"),"i-alert",true);
    return true;
  }
  // ຕູ້ເຊຟບໍ່ຮັບ — syncLastSig ບໍ່ອັບເດດ ການບັນທຶກຄັ້ງຕໍ່ໄປຈະສົ່ງຊ້ຳ
  toast(T("ຕູ້ເຊຟບໍ່ໄດ້ຮັບການຕັ້ງຄ່າ — ກວດ TOKEN ແລະ URL ໃນ ຕັ້ງຄ່າ › ປິດກະ & ຄວາມປອດໄພ","The sheet did not accept the settings — check the TOKEN and URL in Settings › Closing & security"),"i-alert",true);
  return false;
}

/* ---------- ຕິດກັບ save() — ເຈົ້າຂອງແກ້ການຕັ້ງຄ່າ ແລ້ວສົ່ງຂຶ້ນໃຫ້ເອງ ---------- */
afterSave = function(){
  if(!canPushCfg()) return;
  const sig = syncSig();
  if(syncLastSig === null){ syncLastSig = sig; return; }
  if(sig === syncLastSig) return;          // ປ່ຽນແຕ່ບິນ/audit — ບໍ່ຕ້ອງສົ່ງ
  syncLastSig = sig;
  clearTimeout(syncPushT);
  syncPushT = setTimeout(()=>pushConfig(false), 4000);   // ລວມການແກ້ຫຼາຍຢ່າງເປັນການສົ່ງເທື່ອດຽວ
};

/* ---------- ລິງກ໌ຕິດຕັ້ງເທື່ອດຽວ: ?s=<ລິງກ໌ exec> → ເຄື່ອງຈື່ໄວ້ ແລ້ວລຶບອອກຈາກແຖບທີ່ຢູ່ ---------- */
(function adoptSetupLink(){
  try{
    const u = new URL(location.href), s = u.searchParams.get("s");
    if(!s) return;
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(s)) return;
    cfg.sheets = cfg.sheets || {url:"",token:""};
    if(cfg.sheets.url !== s){ cfg.sheets.url = s; save(); }
    u.searchParams.delete("s");
    history.replaceState(null,"",u.pathname+(u.search||"")+u.hash);
  }catch(e){}
})();

/* ---------- ເວລາດຶງ: ຕອນເປີດແອັບ ແລະ ຕອນກັບມາໜ້າເຂົ້າສູ່ລະບົບ ---------- */
const syncIdle = () => !state.user && !state.bills.some(b=>b.status!=="paid");

pullConfig();
document.addEventListener("visibilitychange",()=>{ if(!document.hidden && syncIdle()) pullConfig(); });
setInterval(()=>{ if(syncIdle()) pullConfig(); }, 120000);
