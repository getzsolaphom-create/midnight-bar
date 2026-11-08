"use strict";
/* ===================== Pricing ===================== */
function inWindow(s,e){ const d=new Date(); const m=d.getHours()*60+d.getMinutes(); const [a,b]=[s,e].map(x=>{const [h,mm]=String(x).split(":").map(Number);return h*60+mm;}); return a<=b?m>=a&&m<b:m>=a||m<b; }
const hhActive=()=>cfg.hh.on&&(cfg.hh.force||inWindow(cfg.hh.start,cfg.hh.end));
const hhFor=p=>hhActive()&&cfg.hh.cats.includes(p.cat);
const hhPrice=v=>r1000(v*(1-cfg.hh.pct/100));
function totals(b){
  const ll=liveLines(b);
  const sub=ll.reduce((s,l)=>s+l.unit*l.qty,0);
  const hhSave=ll.reduce((s,l)=>s+(l.orig-l.unit)*l.qty,0);
  const disc=!b.disc?0:b.disc.type==="pct"?r1000(sub*b.disc.value/100):Math.min(sub,b.disc.value);
  const svc=b.svc?r1000((sub-disc)*cfg.shop.svcPct/100):0;
  return {sub,hhSave,disc,svc,total:sub-disc+svc,items:ll.reduce((s,l)=>s+l.qty,0)};
}
const minsSince=t=>{const m=Math.max(0,Math.round((Date.now()-t)/60000));return m>=60?`${Math.floor(m/60)} ${T("ຊມ.","h")} ${m%60} ${T("ໂມງ","")}`:`${m} ${T("ນາທີ","min")}`;};

/* ===================== MENU ===================== */
function renderTabs(){
  const vis=cfg.products.filter(p=>!p.hidden);
  $("#catTabs").innerHTML=[{id:"all",th:T("ທັງໝົດ","All")},...cfg.cats].map(c=>{
    const n=c.id==="all"?vis.length:vis.filter(p=>p.cat===c.id).length;
    return `<button role="tab" aria-selected="${state.cat===c.id}" data-cat="${c.id}">${esc(c.th)} <span class="muted" style="font-size:12px">${n}</span></button>`;
  }).join("");
  const on=hhActive();
  $("#hhChip").className="hh"+(on?"":" off");
  $("#hhChip").innerHTML=`${icon("i-clock")}<span>Happy hour ${esc(cfg.hh.start)}–${esc(cfg.hh.end)} · ${cfg.hh.cats.map(c=>esc(catOf(c).th)).join(", ")||"—"} −${cfg.hh.pct}% ${on?("· "+T("ກຳລັງໃຊ້","active now")):("· "+T("ບໍ່ຢູ່ໃນຊ່ວງເວລາ","outside hours"))}</span>`;
}
function renderGrid(){
  const b=bill(); const q=state.q.trim().toLowerCase();
  const inTicket={}; liveLines(b).forEach(l=>inTicket[l.pid]=(inTicket[l.pid]||0)+l.qty);
  const items=cfg.products.filter(p=>!p.hidden&&(state.cat==="all"||p.cat===state.cat)&&(!q||(p.name+" "+p.sub).toLowerCase().includes(q)));
  $("#menuGrid").innerHTML=items.length?items.map(p=>{
    const c=catOf(p.cat), hh=hhFor(p), price=hh?hhPrice(p.price):p.price;
    const low=p.stock!=null&&!p.soldOut&&p.stock<=p.min;
    return `<button class="item cat-${catCls(c)} ${p.soldOut?"soldout":""}" data-item="${p.id}" ${p.soldOut?'aria-disabled="true"':""} aria-label="${esc(p.name)} ${fmt(price)} ${T("ກີບ","kip")}${p.soldOut?(" "+T("ສິນຄ້າໝົດ","sold out")):""}${inTicket[p.id]?`, ${T("ໃນບິນ","in bill")} ${inTicket[p.id]}`:""}">
      <span class="art">${icon(CAT_ICONS[c.icon]||"i-box")}${p.tag?`<span class="tag">${esc(p.tag)}</span>`:""}${hh?`<span class="tag" style="background:var(--gold-500);color:var(--on-accent)">−${cfg.hh.pct}%</span>`:""}</span>
      ${p.soldOut?`<span class="sold"><span>${T("ໝົດ","Sold out")}</span></span>`:""}
      ${inTicket[p.id]?`<span class="qty">${inTicket[p.id]}</span>`:""}
      <span class="body"><span class="name">${esc(p.name)}</span><span class="sub">${esc(p.sub)}</span>
      <span class="price">${fmt(price)} ₭ ${hh?`<s>${fmt(p.price)}</s>`:""}</span>
      ${p.opts.length?`<span class="has-opt">${icon("i-sliders","xs")}<span>${T("ມີຕົວເລືອກ","Options")}</span></span>`:""}
      ${low?`<span class="low">${T("ເຫຼືອ","Stock")} ${p.stock}</span>`:""}</span>
    </button>`;}).join(""):`<div class="empty" style="grid-column:1/-1">${T("ບໍ່ພົບເມນູ","No menu item matches")} “${esc(state.q)}”</div>`;
}
function renderTicket(){
  const b=bill(); const t=totals(b); const tb=tableOf(b.table);
  $("#menuEyebrow").textContent=`${T("ສັ່ງອາຫານ · ໂຕະ","Order · Table")} ${tb.name}`;
  $("#tkNo").textContent=`Ticket · ${T("ບິນ","Bill")} #${b.no}`;
  $("#tkTable").textContent=`${T("ໂຕະ","Table")} ${tb.name}`;
  $("#tkMeta").innerHTML=`<span>${esc(zoneName(tb.zone))}</span><span aria-hidden="true">·</span><span>${b.guests} ${T("ຄົນ","guests")}</span><span aria-hidden="true">·</span><span>${T("ພະນັກງານ","Staff")} ${esc(b.waiter)}</span><span aria-hidden="true">·</span><span>${minsSince(b.opened)}</span>`;
  const lines=liveLines(b);
  const groups=[["all",lines]];
  $("#tkLines").innerHTML=lines.length?groups.map(([s,ls])=>`
    
    ${ls.map(l=>`<div class="line">
      <div><div class="ln-name">${esc(l.name)}</div>${l.mods.length?`<div class="ln-mods">${l.mods.map(esc).join(" · ")}</div>`:""}</div>
      <div class="ln-amt num">${fmt(l.unit*l.qty)}${l.orig!==l.unit?`<s>${fmt(l.orig*l.qty)}</s>`:""}</div>
      <div class="ln-foot">
        <span class="state ${l.sent?"":"new"}">${l.sent?icon("i-check","xs")+T("ຢືນຢັນແລ້ວ","Confirmed"):icon("i-spark","xs")+T("ຍັງບໍ່ຢືນຢັນ","Not confirmed")} · ${fmt(l.unit)}/${T("ໜ່ວຍ","unit")}</span>
        <span class="stepper">
          <button data-dec="${l.id}" ${l.sent?"disabled":""} aria-label="${T("ຫຼຸດ","Decrease")} ${esc(l.name)}">${l.sent?icon("i-lock","sm"):icon(l.qty===1?"i-trash":"i-minus","sm")}</button>
          <output>${l.qty}</output>
          <button data-inc="${l.id}" aria-label="${T("ເພີ່ມ","Add")} ${esc(l.name)}">${icon("i-plus","sm")}</button>
        </span>
      </div></div>`).join("")}`).join(""):`<div class="empty">${icon("i-receipt")}<p>${T("ຍັງບໍ່ມີລາຍການ","No items yet")}<br>${T("ແຕະເມນູເພື່ອເພີ່ມ","Tap a menu item to add it")}</p></div>`;
  $("#tkSums").innerHTML=`
    <div class="sum-row"><span>${T("ລວມ","Total")} ${t.items} ${T("ລາຍການ","items")}</span><span class="num">${kip(t.sub+t.hhSave)}</span></div>
    ${t.hhSave?`<div class="sum-row disc"><span>Happy hour</span><span class="num">−${kip(t.hhSave)}</span></div>`:""}
    <div class="sum-row total"><span>${T("ຍອດລວມ","Total")}</span><span class="v num">${kip(t.sub)}</span></div>`;
  const pend=lines.filter(l=>!l.sent);
  const pn=pend.reduce((s,l)=>s+l.qty,0);
  $("#sendBtn").disabled=!pn;
  $("#sendBtn span").textContent=pn?`${T("ຢືນຢັນອໍເດີ","Confirm")} ${pn}`:T("ຢືນຢັນອໍເດີ","Confirm");
  $("#tbLabel").textContent=`${T("ໂຕະ","Table")} ${tb.name} · ${t.items} ${T("ລາຍການ","items")}${pn?` · ${T("ຍັງບໍ່ຢືນຢັນ","Not confirmed")} ${pn}`:""}`;
  $("#tbAmt").textContent=kip(t.sub);
}
async function ensureEditable(b){
  if(b.status!=="printed") return true;
  const g=await guard("reopen",T("ແກ້ໄຂບິນທີ່ພິມແລ້ວ","Edit printed bill"),`${T("ບິນ","Bill")} #${b.no} ${T("ພິມໃຫ້ລູກຄ້າແລ້ວ","was already printed for the customer")}`);
  if(!g.ok) return false;
  b.status="open"; log("reopen",`${T("ເປີດບິນ","Reopened bill")} #${b.no} (${T("ໂຕະ","Table")} ${tableOf(b.table).name}) ${T("ທີ່ພິມແລ້ວເພື່ອແກ້ໄຂ","after printing, to edit it")}`,g.by); return true;
}
async function addLine(p,qty,mods,unit,orig){
  const b=bill();
  if(b.status==="paid"){ toast(T("ບິນນີ້ຊຳລະແລ້ວ ເລືອກໂຕະອື່ນ","This bill is paid — choose another table"),"i-alert",true); return; }
  if(can("order")==="no"){ toast(T("ບໍ່ມີສິດຮັບອໍເດີ","No permission to take orders"),"i-lock",true); return; }
  if(!(await ensureEditable(b))) return;
  const ex=b.lines.find(l=>!l.sent&&!l.void&&l.pid===p.id&&l.unit===unit&&l.mods.join()===mods.join());
  if(ex) ex.qty+=qty; else b.lines.push({id:lineSeq++,pid:p.id,cat:p.cat,name:p.name,qty,unit,orig,mods,sent:false,void:false});
  saveSession();
  renderTicket(); renderGrid(); renderNav();
  toast(`${T("ເພີ່ມ","Added")} ${qty} × ${p.name}`);
}
let optCtx=null;
function openOptions(p){
  const c=catOf(p.cat); const hh=hhFor(p);
  optCtx={p,qty:1,one:{},many:new Set(),hh};
  p.opts.forEach((g,gi)=>{ if(g.type==="one") optCtx.one[gi]=0; });
  $("#optHead").className=`dlg-h cat-${catCls(c)}`;
  $("#optArt").innerHTML=icon(CAT_ICONS[c.icon]||"i-box");
  $("#optTitle").textContent=p.name; $("#optSub").textContent=p.sub;
  $("#optHH").innerHTML=hh?`<span class="chip pill-ok" style="margin-top:8px">${icon("i-clock","xs")}Happy hour −${cfg.hh.pct}% ${T("ຄິດອັດຕະໂນມັດ","applied automatically")}</span>`:"";
  $("#optBody").innerHTML=p.opts.map((g,gi)=>g.type==="one"?`
    <div role="group" aria-labelledby="og${gi}"><p class="label" id="og${gi}">${esc(g.name)} · ${T("ເລືອກ","choose")} 1</p>
      <div class="choices">${g.choices.map((ch,ci)=>`<button type="button" class="choice" data-one="${gi}:${ci}" aria-pressed="${ci===0}"><b>${esc(ch.label)}</b><small>${ch.delta?`${ch.delta>0?"+":""}${fmt(ch.delta)} ₭ · ${T("ລວມ","Total")} ${fmt(p.price+ch.delta)}`:fmt(p.price)+" ₭"}</small></button>`).join("")}</div></div>`:`
    <div role="group" aria-labelledby="og${gi}"><p class="label" id="og${gi}">${esc(g.name)} · ${T("ບໍ່ບັງຄັບ","optional")}</p>
      <div class="checks">${g.choices.map((ch,ci)=>`<label class="check"><input type="checkbox" data-many="${gi}:${ci}"><span>${esc(ch.label)}</span><small>+${fmt(ch.delta)}</small></label>`).join("")}</div></div>`).join("")
    +`<div><label class="label" for="optNote">${T("ໝາຍເຫດ","Note")}</label><textarea class="inp" id="optNote" placeholder="${T("ເຊັ່ນ ເຢັນຈັດ, ແຍກຈອກ, ບໍ່ໃສ່ຜັກຫອມ","e.g. extra cold, separate glass, no coriander")}"></textarea></div>`;
  updOpt(); $("#optDlg").returnValue=""; $("#optDlg").showModal();
}
function optUnit(){
  const {p}=optCtx; let base=p.price, extra=0;
  p.opts.forEach((g,gi)=>{ if(g.type==="one") base+=g.choices[optCtx.one[gi]]?.delta||0; });
  optCtx.many.forEach(k=>{const [gi,ci]=k.split(":").map(Number); extra+=p.opts[gi].choices[ci].delta||0;});
  return {unit:optCtx.hh?hhPrice(base)+extra:base+extra, orig:base+extra};
}
function updOpt(){ const {unit,orig}=optUnit(),q=optCtx.qty; $("#optQty").textContent=q; $("#optMinus").disabled=q<=1; $("#optPrice").innerHTML=`${orig!==unit?`<s>${kip(orig*q)}</s>`:""}<b class="num">${kip(unit*q)}</b>`; }
$("#optBody").addEventListener("click",e=>{ const b=e.target.closest("[data-one]"); if(!b) return; const [gi,ci]=b.dataset.one.split(":").map(Number); optCtx.one[gi]=ci; $$(`[data-one^="${gi}:"]`).forEach(x=>x.setAttribute("aria-pressed",x===b)); updOpt(); });
$("#optBody").addEventListener("change",e=>{ const k=e.target.dataset.many; if(!k) return; e.target.checked?optCtx.many.add(k):optCtx.many.delete(k); updOpt(); });
$("#optMinus").onclick=()=>{optCtx.qty=Math.max(1,optCtx.qty-1);updOpt();};
$("#optPlus").onclick=()=>{optCtx.qty++;updOpt();};
$("#optDlg").addEventListener("close",()=>{
  if($("#optDlg").returnValue!=="add"||!optCtx) return;
  const {p}=optCtx,{unit,orig}=optUnit(),mods=[];
  p.opts.forEach((g,gi)=>{ if(g.type==="one"&&optCtx.one[gi]>0) mods.push(g.choices[optCtx.one[gi]].label); });
  [...optCtx.many].sort().forEach(k=>{const [gi,ci]=k.split(":").map(Number); mods.push(p.opts[gi].choices[ci].label);});
  const note=$("#optNote").value.trim(); if(note) mods.push(`“${note}”`);
  $("#optDlg").returnValue="";
  addLine(p,optCtx.qty,mods,unit,orig);
});
$("#catTabs").addEventListener("click",e=>{const b=e.target.closest("[data-cat]"); if(!b)return; state.cat=b.dataset.cat; renderTabs(); renderGrid();});
$("#catTabs").addEventListener("keydown",e=>{ if(!["ArrowRight","ArrowLeft"].includes(e.key))return; const tabs=$$("#catTabs [role=tab]"); const i=tabs.indexOf(document.activeElement); if(i<0)return; const n=tabs[(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length]; n.click(); $(`#catTabs [data-cat="${n.dataset.cat}"]`).focus(); });
$("#menuSearch").addEventListener("input",e=>{state.q=e.target.value; renderGrid();});
$("#menuGrid").addEventListener("click",e=>{
  const b=e.target.closest("[data-item]"); if(!b) return; const p=prod(b.dataset.item);
  if(p.soldOut){ toast(`${p.name} ${T("ໝົດ — ເຈົ້າຂອງເປີດຂາຍໄດ້ທີ່ ຕັ້ງຄ່າ › ເມນູ ແລະ ສິນຄ້າ","is sold out — the owner can re-enable it in Settings › Menu & products")}`,"i-alert",true); return; }
  if(p.opts.length) openOptions(p);
  else { const hh=hhFor(p); addLine(p,1,[],hh?hhPrice(p.price):p.price,p.price); }
});
$("#tkLines").addEventListener("click",async e=>{
  const inc=e.target.closest("[data-inc]"),dec=e.target.closest("[data-dec]"); const b=bill();
  if(inc){ const l=b.lines.find(x=>x.id==inc.dataset.inc); if(l.sent){ addLine(prod(l.pid)||{id:l.pid,cat:l.cat,name:l.name},1,l.mods,l.unit,l.orig); return;} if(!(await ensureEditable(b)))return; l.qty++; }
  else if(dec){ const l=b.lines.find(x=>x.id==dec.dataset.dec); if(l.sent)return; l.qty--; if(l.qty<=0) b.lines=b.lines.filter(x=>x!==l); }
  else return;
  saveSession(); renderTicket(); renderGrid(); renderNav();
});
$("#sendBtn").onclick=async()=>{
  const b=bill(); const pend=b.lines.filter(l=>!l.sent&&!l.void); let n=0;
  if(!pend.length) return;
  const o={seq:state.orderSeq++,at:Date.now(),by:state.user.name}; (b.orders=b.orders||[]).push(o);
  pend.forEach(l=>{ n+=l.qty; l.sent=true; l.ord=o.seq;
    const p=prod(l.pid); if(p&&p.stock!=null){ p.stock=Math.max(0,p.stock-l.qty); if(p.stock===0&&!p.soldOut){ p.soldOut=true; log("product",`${p.name} ${T("ໝົດສະຕັອກ — ຕັ້ງເປັນ “ໝົດ” ອັດຕະໂນມັດ","out of stock — marked “Sold out” automatically")}`); } } });
  save(); renderTicket(); renderGrid(); renderNav();
  log("order",`${T("ຢືນຢັນອໍເດີ","Confirmed order")} ${ordLabel(b,o.seq)} · ${n} ${T("ລາຍການ","items")} · ${tableOf(b.table).name} #${b.no}`); toast(`${T("ຢືນຢັນອໍເດີ","Confirmed order")} ${ordLabel(b,o.seq)} · ${n} ${T("ລາຍການ","items")}`,"i-check");
  if(cfg.printer.autoSlip){ printHTML(slipHTML(b,o)); toast(`${T("ພິມບິນນ້ອຍ","Order slip printed")} ${ordLabel(b,o.seq)}`,"i-print"); }
  else await showSlip(b,o);
};
function openSheet(){ $("#ticket").classList.add("open"); $("#sheetScrim").classList.add("on"); $("#ticketBar").setAttribute("aria-expanded","true"); }
function closeSheet(){ $("#ticket").classList.remove("open"); $("#sheetScrim").classList.remove("on"); $("#ticketBar").setAttribute("aria-expanded","false"); }
$("#ticketBar").onclick=openSheet; $("#ticketClose").onclick=closeSheet; $("#sheetScrim").onclick=closeSheet;
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$("#ticket").classList.contains("open")) closeSheet(); });
$("#toBillBtn").addEventListener("click",()=>closeSheet());
$("#pickTableBtn").onclick=()=>{
  openDyn({eyebrow:T("ເລືອກໂຕະ ຫຼື ເປີດບິນໃໝ່","Choose a table or open a new bill"),title:T("ໂຕະ","Table"),cls:"w-lg",
    body:cfg.zones.map(z=>{ const ts=cfg.tables.filter(t=>t.zone===z.id); if(!ts.length) return "";
      return `<div><p class="label">${esc(z.name)}</p><div class="tables-grid">${ts.map(t=>{
        const b=state.bills.find(x=>x.table===t.id&&x.status!=="paid");
        const st=!t.on?`<small class="muted">${T("ປິດຊົ່ວຄາວ","Closed")}</small>`:b?(b.status==="printed"?`<small style="color:var(--danger)">● ${T("ພິມບິນແລ້ວ","Bill printed")}</small>`:`<small style="color:var(--gold-ink)">● ${T("ມີລູກຄ້າ","Occupied")}</small>`):`<small style="color:var(--ok)">● ${T("ວ່າງ","Free")}</small>`;
        return `<button class="tbl" value="${t.id}" ${!t.on?"disabled":""} aria-current="${!!b&&b.no===state.current}"><b>${esc(t.name)}</b>${st}<small class="muted">${b?kip(totals(b).total):t.on?`${t.seats} ${T("ບ່ອນນັ່ງ · ເປີດບິນໃໝ່","seats · open new bill")}`:""}</small></button>`;}).join("")}</div></div>`; }).join("")
  }).then(({value})=>{
    if(!value||value==="cancel") return;
    let b=state.bills.find(x=>x.table===value&&x.status!=="paid");
    if(!b){ b=mkBill(String(state.billSeq++).padStart(4,"0"),value,2,state.user.name,0,[]); state.bills.push(b); toast(`${T("ເປີດບິນໃໝ່","Opened new bill")} #${b.no} · ${T("ໂຕະ","Table")} ${tableOf(value).name}`,"i-receipt"); }
    state.current=b.no; state.payPart=null; resetPay(); saveSession(); render();
  });
};

