"use strict";
/* ===================== LOGIN / LOCK ===================== */
let loginSel=null, loginPin="";
function renderLogin(){
  $("#loginStaff").innerHTML=cfg.staff.filter(s=>s.active).map(s=>`
    <button class="staff-card" data-staff="${s.id}" aria-pressed="${loginSel===s.id}">
      <span class="avatar av-${s.role}">${esc(s.name[0]||"?")}</span><b>${esc(s.name)}</b><span class="small muted">${ROLES[s.role]}</span>
    </button>`).join("");
  $("#loginPinBox").hidden=!loginSel;
  const s=staffBy(loginSel);
  if(s){ $("#loginWho").textContent=`${T("ລະຫັດ","Enter")} PIN · ${s.name} (${ROLES[s.role]})`; $("#loginDots").innerHTML=Array.from({length:s.pin.length},(_,i)=>`<i class="${i<loginPin.length?"on":""}"></i>`).join(""); }
  $("#demoPins").innerHTML=`${T("ຕົ້ນແບບ — PIN ທົດລອງ:","Prototype — test PINs:")} ${cfg.staff.filter(s=>s.active).map(s=>`${esc(s.name)} <code>${esc(s.pin)}</code>`).join(" · ")}<br>${T("ໃສ່ຜິດ","After")} ${cfg.security.maxTries} ${T("ຄັ້ງ ລະບົບຈະລັອກ 30 ວິນາທີ","wrong tries the screen locks for 30 seconds")}`;
}
$("#loginStaff").addEventListener("click",e=>{ const b=e.target.closest("[data-staff]"); if(!b) return; loginSel=b.dataset.staff; loginPin=""; $("#loginMsg").textContent=""; renderLogin(); $("#loginPad button").focus(); });
pinPad($("#loginPad"),k=>{
  const s=staffBy(loginSel); if(!s) return;
  if(Date.now()<state.lockUntil){ $("#loginMsg").textContent=`${T("ລັອກຊົ່ວຄາວ ລໍຖ້າອີກ","Locked — wait")} ${Math.ceil((state.lockUntil-Date.now())/1000)} ${T("ວິນາທີ","seconds")}`; return; }
  if(k==="C") loginPin=""; else if(k==="⌫") loginPin=loginPin.slice(0,-1); else if(loginPin.length<s.pin.length) loginPin+=k;
  renderLogin();
  if(loginPin.length===s.pin.length){
    if(loginPin===s.pin){ state.tries=0; doLogin(s); return; }
    state.tries++; const d=$("#loginDots"); d.classList.remove("err"); void d.offsetWidth; d.classList.add("err");
    if(state.tries>=cfg.security.maxTries){ state.lockUntil=Date.now()+30000; state.tries=0; $("#loginMsg").textContent=T("ໃສ່ຜິດຫຼາຍຄັ້ງ ລັອກ 30 ວິນາທີ","Too many wrong tries — locked for 30 seconds"); audit.unshift({t:Date.now(),who:s.name,role:s.role,type:"login",detail:T("ໃສ່ PIN ຜິດເກີນກຳນົດ · ລັອກຊົ່ວຄາວ","Too many wrong PINs · temporarily locked"),by:""}); save(); }
    else $("#loginMsg").textContent=`PIN ${T("ບໍ່ຖືກຕ້ອງ (ເຫຼືອ","incorrect (")} ${cfg.security.maxTries-state.tries} ${T("ຄັ້ງ)","tries left)")}`;
    loginPin=""; setTimeout(renderLogin,350);
  }
});
document.addEventListener("keydown",e=>{
  if($("#login").hidden||!loginSel) return;
  if(/^\d$/.test(e.key)) $(`#loginPad [data-k="${e.key}"]`)?.click();
  if(e.key==="Backspace") $(`#loginPad [data-k="⌫"]`)?.click();
});
function doLogin(s){
  state.user={id:s.id,name:s.name,role:s.role}; state.grants={}; state.lastAct=Date.now();
  log("login",`${T("ເຂົ້າສູ່ລະບົບ","Signed in")} (${ROLES[s.role]})`);
  $("#login").hidden=true; $("#app").inert=false; loginSel=null; loginPin="";
  if(!state.bills.length){ const tb=cfg.tables.find(t=>t.on)||cfg.tables[0]; const nb=mkBill(String(state.billSeq++).padStart(4,"0"),tb.id,2,s.name,0,[]); state.bills.push(nb); state.current=nb.no; }
  const home = s.role==="cashier" ? "bill" : "menu";
  state.route=null;
  if(location.hash!=="#/"+home) location.hash="#/"+home; else go();
  toast(`${T("ສະບາຍດີ","Hello")} ${s.name} · ${ROLES[s.role]}`,"i-user");
  ensureShiftOpen();
}
/* ເປີດກະອັດຕະໂນມັດຕອນເຂົ້າສູ່ລະບົບ — ຮ້ານບໍ່ໃຊ້ເງິນທອນເລີ່ມຕົ້ນແລ້ວ */
function ensureShiftOpen(){
  if(state.shift) return;
  state.shift={at:Date.now(),by:state.user?.name||""};
  log("shift",`${T("ເປີດກະ","Opened shift")} #0001`);
}
function lock(reason){
  if(!state.user) return;
  log("logout",reason||T("ອອກຈາກລະບົບ / ລັອກໜ້າຈໍ","Signed out / screen locked"));
  state.user=null; state.grants={}; loginSel=null; loginPin="";
  $$("dialog[open]").forEach(d=>d.close("cancel"));
  closeSheet(); renderLogin(); $("#login").hidden=false; $("#app").inert=true;
  /* ອອກຈາກລະບົບແລ້ວ → ດຶງການຕັ້ງຄ່າຈາກເຈົ້າຂອງທັນທີ (ຖ້າບໍ່ມີບິນຄ້າງ) ເພື່ອໃຫ້ login ໃໝ່ເຫັນຂໍ້ມູນລ່າສຸດ */
  try{ if(typeof syncIdle==="function"&&typeof pullConfig==="function"&&syncIdle()) pullConfig(); }catch(e){}
}
["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,()=>state.lastAct=Date.now(),{passive:true}));
function tick(){
  const d=new Date(); $("#loginClock").textContent=hhmm(d); $("#loginDate").textContent=d.toLocaleDateString(I18N.lang==="en"?"en-GB":"lo-LA",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const m=+cfg.security.lockMin; if(state.user&&m>0&&Date.now()-state.lastAct>m*60000) lock(`${T("ລັອກອັດຕະໂນມັດ (ບໍ່ມີການໃຊ້ງານ","Auto-locked (idle")} ${m} ${T("ນາທີ)","min)")}`);
}
setInterval(tick,1000);

/* ===================== NAV / ROUTER ===================== */
const NAV=[
  {r:"menu",t:T("ເມນູ","Menu"),i:"i-menu",perm:"order"},
  {r:"bill",t:T("ບິນ","Bill"),i:"i-receipt",perm:null},
  {r:"pay",t:T("ຊຳລະເງິນ","Payment"),i:"i-wallet",perm:"payment"},
  {r:"saved",t:T("ບິນທີ່ບັນທຶກ","Saved bills"),s:T("ບັນທຶກ","Saved"),i:"i-archive",perm:null},
  {r:"summary",t:T("ສະຫຼຸບຍອດ","Summary"),i:"i-chart",perm:"viewSales"},
  {r:"bottles",t:T("ຝາກຂວດ","Bottles"),i:"i-bottle",perm:"bottleKeep",more:true},
  {r:"access",t:T("ສິດ","Access"),i:"i-shield",perm:null,more:true},
  {r:"settings",t:T("ຕັ້ງຄ່າ","Settings"),i:"i-settings",perm:"settings",more:true},
];
function renderNav(){
  const u=state.user; if(!u) return;
  const pending=liveLines(bill()).filter(l=>!l.sent).reduce((s,l)=>s+l.qty,0);
  $("#nav").innerHTML=NAV.map(n=>{
    const p=n.perm&&!state.grants[n.r]?can(n.perm):"yes";
    return `<a href="#/${n.r}" data-route="${n.r}" ${n.more?"data-more":""} class="${p==="no"?"locked":""}" ${state.route===n.r?'aria-current="page"':""} aria-label="${n.t}${p==="no"?(" ("+T("ບໍ່ມີສິດ)","no access)")):p==="pin"?(" ("+T("ຕ້ອງໃຊ້ PIN ເຈົ້າຂອງ)","owner PIN required)")):""}">
      ${icon(n.i)}<span>${n.s||n.t}</span>
      ${p==="no"?`<span class="lk">${icon("i-lock")}</span>`:p==="pin"?`<span class="lk">${icon("i-key")}</span>`:""}
      ${n.r==="menu"&&pending?`<span class="badge">${pending}</span>`:""}</a>`;
  }).join("")+`<button class="more ${NAV.find(n=>n.r===state.route)?.more?"on":""}" id="moreBtn" aria-label="${T("ເມນູເພີ່ມເຕີມ","More")}">${icon("i-more")}<span>${T("ອື່ນໆ","Other")}</span></button>`;
  $("#who").innerHTML=`<div class="avatar av-${u.role}" aria-hidden="true">${esc(u.name[0])}</div><b>${esc(u.name)}</b>${ROLES[u.role]}<button class="lock-btn" id="lockBtn" aria-label="${T("ລັອກໜ້າຈໍ / ປ່ຽນຜູ້ໃຊ້","Lock screen / switch user")}">${icon("i-lock","xs")}${T("ລັອກ","Lock")}</button>`;
}
$("#nav").addEventListener("click",e=>{
  if(e.target.closest("#moreBtn")){ openMore(); return; }
  const a=e.target.closest("a[data-route]"); if(!a) return;
  e.preventDefault(); navTo(a.dataset.route);
});
$("#who").addEventListener("click",e=>{ if(e.target.closest("#lockBtn")) lock(); });
async function allowRoute(r){
  const n=NAV.find(x=>x.r===r);
  if(!n.perm||can(n.perm)==="yes"||state.grants[r]) return true;
  const g=await guard(n.perm,`${T("ເປີດໜ້າ","Open page ")}${n.t}`,`${T("ໜ້າ","Page")} “${n.t}” ${T("ຕ້ອງໃຫ້ເຈົ້າຂອງອະນຸມັດສຳລັບ","needs owner approval for ")}${ROLES[state.user.role]}`);
  if(!g.ok) return false;
  state.grants[r]=true; log("access",`${T("ເປີດໜ້າ","Open page ")}${n.t}`,g.by); return true;
}
async function navTo(r){
  if(!(await allowRoute(r))) return;
  if(location.hash==="#/"+r) go(); else location.hash="#/"+r;
}
function openMore(){
  const u=state.user;
  openDyn({cls:"w-sm",eyebrow:`${esc(u.name)} · ${ROLES[u.role]}`,title:T("ເມນູເພີ່ມເຕີມ","More"),
    body:`<div class="more-list">${NAV.filter(n=>n.more).map(n=>{const p=n.perm&&!state.grants[n.r]?can(n.perm):"yes"; return `<button type="button" data-go="${n.r}" class="${p==="no"?"locked":""}">${icon(n.i)}<span style="flex:1">${n.t}</span>${p==="no"?icon("i-lock","sm"):p==="pin"?icon("i-key","sm"):icon("i-right","sm")}</button>`;}).join("")}
      <button type="button" data-go="__lock">${icon("i-lock")}<span style="flex:1">${T("ລັອກ / ປ່ຽນຜູ້ໃຊ້","Lock / switch user")}</span></button></div>`,
    mount(el,close){ el.addEventListener("click",e=>{ const b=e.target.closest("[data-go]"); if(!b) return; close("cancel"); setTimeout(()=>{ if(b.dataset.go==="__lock") lock(); else navTo(b.dataset.go); }); }); }
  });
}
const ROUTES=NAV.map(n=>n.r);
async function go(){
  if(!state.user) return;
  let r=location.hash.replace("#/","")||"menu";
  if(!ROUTES.includes(r)) r="menu";
  if(!(await allowRoute(r))){ const fb=state.route||(can("order")!=="no"?"menu":"bill"); if(location.hash!=="#/"+fb){ location.hash="#/"+fb; return; } r=fb; }
  state.route=r;
  $$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+r));
  closeSheet(); render(); window.scrollTo({top:0});
}
window.addEventListener("hashchange",go);

