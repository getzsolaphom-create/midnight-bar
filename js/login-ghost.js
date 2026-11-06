/* Style-1 — ตัวอักษรเงาหลังโลโก้ตามชื่อร้าน + staff card stagger (สังเกต DOM อย่างเดียว) */
(()=>{
  const brand=document.querySelector(".login-brand"), name=brand&&brand.querySelector("[data-shopname]");
  const login=document.getElementById("login"), staff=document.getElementById("loginStaff");
  if(!brand||!login||!staff) return;
  const ghost=()=>{ brand.dataset.ghost=(name.textContent||"").trim().split(/\s+/)[0]||""; };
  ghost(); new MutationObserver(ghost).observe(name,{childList:true,characterData:true,subtree:true});
  const calm=matchMedia("(prefers-reduced-motion: reduce)");
  let intro=true;
  const stagger=()=>{ if(!intro||calm.matches||login.hidden) return; intro=false;
    staff.querySelectorAll(".staff-card").forEach((el,i)=>{ el.style.setProperty("--i",i); el.classList.add("mb-in"); }); };
  stagger();
  new MutationObserver(stagger).observe(staff,{childList:true});
  new MutationObserver(()=>{ if(!login.hidden){ intro=true; stagger(); } }).observe(login,{attributes:true,attributeFilter:["hidden"]});
})();
