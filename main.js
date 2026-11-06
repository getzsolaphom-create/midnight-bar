"use strict";
/* ===================== Render ===================== */
function applyBrand(){
  $$("[data-logo]").forEach(i=>{ if(i.getAttribute("src")!==cfg.shop.logo) i.src=cfg.shop.logo; }); document.documentElement.style.setProperty("--logo-url",`url("${cfg.shop.logo}")`);
  $$("[data-shopname]").forEach(e=>e.textContent=e.closest(".login-brand")?cfg.shop.name.toUpperCase():cfg.shop.name);
  $$("[data-paper]").forEach(e=>e.textContent=cfg.printer.paper);
  document.title=`${cfg.shop.name} POS`;
}
function render(){
  if(!state.user) return;
  if(!bill()) state.current=state.bills[0].no;
  applyBrand(); renderNav();
  switch(state.route){
    case "menu": renderTabs(); renderGrid(); renderTicket(); break;
    case "bill": renderBill(); break;
    case "pay": renderPay(); break;
    case "saved": renderSaved(); break;
    case "summary": renderSummary(); break;
    case "bottles": renderBottles(); break;
    case "access": renderAccess(); break;
    case "settings": renderSettings(); break;
  }
}
let rz; window.addEventListener("resize",()=>{clearTimeout(rz); rz=setTimeout(()=>{ if(state.route==="summary") renderSummary(); },150);});
setInterval(()=>{ if(state.user&&state.route==="menu") renderTicket(); },60000);
applyBrand(); renderLogin(); tick(); $("#app").inert=true;
function setLang(l){
  if(l===I18N.lang) return;
  I18N.lang=l; try{ localStorage.setItem("mb-lang",l); }catch(e){}
  relang([ROLES,PERMS,PERM_LABEL,NAV,REASONS,CURNAME,BASE,PAGE_ACCESS,SET_TABS,AUDIT_TYPES,STATION,state,cfg,bottles,audit],l);
  $("#countRows").innerHTML="";   // cached table — rebuild in the new language
  I18N.applyStatic(); applyBrand(); renderLogin(); tick(); render(); save();
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-lang]"); if(b) setLang(b.dataset.lang); });
