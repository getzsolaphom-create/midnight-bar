/* Motion layer · แบบที่ 1 — สังเกต DOM อย่างเดียว ไม่เรียก/แก้ฟังก์ชันเดิม */
(()=>{
  const grid=document.getElementById("menuGrid"); if(!grid) return;
  const calm=matchMedia("(prefers-reduced-motion: reduce)");
  let lastKey="", pressed=null;
  grid.addEventListener("pointerdown",e=>{ const b=e.target.closest("[data-item]"); pressed=b?{id:b.dataset.item,t:Date.now()}:null; },{passive:true});
  new MutationObserver(()=>{
    if(calm.matches) return;
    const page=document.getElementById("page-menu");
    const cat=document.querySelector("#catTabs [aria-selected=true]")?.dataset.cat||"";
    const key=(page&&page.classList.contains("active")?"on":"off")+"|"+cat;
    const items=grid.querySelectorAll(".item");
    if(key!==lastKey){ items.forEach((el,i)=>{ el.style.setProperty("--i",Math.min(i,12)); el.classList.add("mb-in"); }); }
    else if(pressed&&Date.now()-pressed.t<800){ grid.querySelector(`[data-item="${CSS.escape(pressed.id)}"]`)?.classList.add("mb-pop"); }
    lastKey=key; pressed=null;
  }).observe(grid,{childList:true});
  // ออกจากหน้าเมนูแล้วกลับมา → stagger ใหม่
  addEventListener("hashchange",()=>{ lastKey=""; });
  new MutationObserver(()=>{ if(!document.getElementById("login").hidden) lastKey=""; }).observe(document.getElementById("login"),{attributes:true,attributeFilter:["hidden"]});
})();
