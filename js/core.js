"use strict";
const LOGO_DEFAULT = LOGO_DATA;

/* ===================== Helpers ===================== */
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString("en-US");
const kip = n => `${fmt(n)} ₭`;
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon = (id,cls="") => `<svg class="i ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const r1000 = n => Math.round(n/1000)*1000;
const uid = p => p+Math.random().toString(36).slice(2,8);
const hhmm = t => { const d=new Date(t); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const dmy = t => { const d=new Date(t); return `${d.getDate()}/${d.getMonth()+1}/${String(d.getFullYear()).slice(2)}`; };
const DAY=86400000;
const getPath=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
const setPath=(o,p,v)=>{const ks=p.split(".");const last=ks.pop();const t=ks.reduce((a,k)=>a[k],o);t[last]=v;};
function toast(msg, ic="i-check", err=false){
  const t=document.createElement("div"); t.className="toast"+(err?" err":""); t.innerHTML=icon(ic)+`<span>${esc(msg)}</span>`;
  $("#toasts").append(t); setTimeout(()=>t.remove(),2800);
}

/* ===================== Config (back office) =====================
   Owner edits these in Settings. Saved in this browser only (localStorage) — no database yet. */
const ROLES = { owner:T("ເຈົ້າຂອງຮ້ານ","Owner"), cashier:T("ແຄັດເຊຍ","Cashier"), waiter:T("ພະນັກງານບໍລິການ","Server") };
const PERMS = [
  {k:"order",     t:T("ຮັບອໍເດີ","Take orders"), d:T("ເພີ່ມລາຍການລົງບິນ ແລະ ຢືນຢັນອໍເດີ","Add items to the bill and confirm orders")},
  {k:"split",     t:T("ແຍກບິນ","Split bill"), d:T("ແຍກເປັນຫຼາຍບິນໃນໂຕະດຽວ ຫານເທົ່າກັນ ຫຼື ເລືອກລາຍການ","Split one table into several bills, equally or by item")},
  {k:"bottleKeep",t:T("ຮັບຝາກ / ເບີກຂວດ","Keep / withdraw bottles"), d:T("ບັນທຶກການຝາກເຫຼົ້າ-ເບຍ ພ້ອມຮູບຖ່າຍ","Record kept bottles with a photo")},
  {k:"payment",   t:T("ຮັບຊຳລະເງິນ","Take payment"), d:T("ເງິນສົດ ໂອນ ທອນເງິນ ພິມໃບຮັບເງິນ","Cash, transfer, change, print receipt")},
  {k:"discount",  t:T("ໃຫ້ສ່ວນຫຼຸດ","Give discounts"), d:T("ໃຊ້ສ່ວນຫຼຸດຈາກລາຍການທີ່ເຈົ້າຂອງຕັ້ງໄວ້","Apply discounts the owner has set up")},
  {k:"void",      t:T("ຍົກເລີກລາຍການທີ່ຢືນຢັນແລ້ວ","Void confirmed items"), d:(T("ຕ້ອງເລືອກເຫດຜົນ ບັນທຶກໃນ","Reason required · recorded in")+" Audit log")},
  {k:"editPrice", t:T("ແກ້ລາຄາໃນບິນ","Change price on bill"), d:T("ປ່ຽນລາຄາຕໍ່ໜ່ວຍຂອງລາຍການໃນບິນ","Change the unit price of a bill item")},
  {k:"reopen",    t:T("ແກ້ໄຂບິນທີ່ພິມແລ້ວ","Edit printed bill"), d:T("ເພີ່ມ/ຫຼຸດລາຍການຫຼັງພິມບິນໃຫ້ລູກຄ້າແລ້ວ","Add/remove items after the bill was printed")},
  {k:"viewSales", t:T("ເບິ່ງສະຫຼຸບຍອດຂາຍ","View sales summary"), d:T("ຍອດຂາຍ ກຣາຟ ເມນູຂາຍດີ","Sales, charts, best sellers")},
  {k:"closeShift",t:T("ປິດກະ / ນັບເງິນສົດ","Close shift / count cash"), d:T("ຢືນຢັນຍອດເງິນສົດ ໃສ່ເຫດຜົນເງິນຂາດ-ເກີນ","Confirm cash, explain any shortage or overage")},
  {k:"settings",  t:T("ຕັ້ງຄ່າຫຼັງບ້ານ","Back-office settings"), d:T("ຂໍ້ມູນຮ້ານ ເມນູ ລາຄາ ພະນັກງານ ສິດ ອັດຕາແລກປ່ຽນ","Shop info, menu, prices, staff, permissions, exchange rates"), ownerOnly:true},
];
const CAT_ICONS = {beer:"i-beer",cocktail:"i-cocktail",liquor:"i-bottle",soft:"i-cup",food:"i-food",snack:"i-snack",x:"i-box"};
function defaults(){
  const beerOpts=()=>[
    {name:T("ເສີບແບບ","Serving"),type:"one",choices:[{label:T("ຂວດ","Bottle"),delta:0},{label:("Bucket · 5 "+T("ຂວດ","Bottle")),delta:0}]},
    {name:T("ເພີ່ມເຕີມ","Extras"),type:"many",choices:[{label:T("ຖັງນ້ຳກ້ອນ","Ice bucket"),delta:10000},{label:T("ຈອກແຊ່ເຢັນ","Frosted glass"),delta:0}]}];
  const sweet=[{name:T("ຄວາມຫວານ","Sweetness"),type:"one",choices:[{label:T("ປົກກະຕິ","Regular"),delta:0},{label:T("ຫວານໜ້ອຍ","Less sweet"),delta:0},{label:T("ບໍ່ຫວານ","No sugar"),delta:0}]},{name:T("ເພີ່ມເຕີມ","Extras"),type:"many",choices:[{label:T("ເພີ່ມຊັອດ","Extra shot"),delta:20000},{label:T("ບໍ່ໃສ່ນ້ຳກ້ອນ","No ice"),delta:0}]}];
  const mixer=[{name:T("ມິກເຊີ","Mixer"),type:"one",choices:[{label:T("ພຽວ","Neat"),delta:0},{label:T("ໂຊດາ","Soda"),delta:0},{label:T("ໂຄ້ກ","Coke"),delta:5000},{label:T("ໂທນິກ","Tonic"),delta:8000}]}];
  const spicy=[{name:T("ຄວາມເຜັດ","Spiciness"),type:"one",choices:[{label:T("ບໍ່ເຜັດ","Not spicy"),delta:0},{label:T("ເຜັດກາງ","Medium spicy"),delta:0},{label:T("ເຜັດຫຼາຍ","Very spicy"),delta:0}]}];
  const P=(id,cat,name,sub,price,opts,extra={})=>({id,cat,name,sub,price,opts:opts?structuredClone(opts):[],hidden:false,soldOut:false,stock:null,min:0,keep:false,...extra});
  const B=(...a)=>{ const p=P(...a); p.opts[0].choices[1].delta=r1000(p.price*4.6)-p.price; return p; };
  return {
    v:2, menuV:4,
    shop:{name:"Midnight Bar",address:T("ຖ.ເຈົ້າອານຸ · ວຽງຈັນ","Chao Anou Rd · Vientiane"),phone:"020 5555 0142",logo:LOGO_DEFAULT,footer:T("ຂອບໃຈ ແລ້ວພົບກັນໃໝ່ · Thank you","Thank you — see you again"),svcDefault:false,svcPct:10},
    perms:{order:{cashier:"yes",waiter:"yes"},split:{cashier:"yes",waiter:"yes"},bottleKeep:{cashier:"yes",waiter:"yes"},payment:{cashier:"yes",waiter:"no"},discount:{cashier:"pin",waiter:"no"},void:{cashier:"pin",waiter:"pin"},editPrice:{cashier:"pin",waiter:"no"},reopen:{cashier:"pin",waiter:"no"},viewSales:{cashier:"pin",waiter:"no"},closeShift:{cashier:"pin",waiter:"no"},settings:{cashier:"no",waiter:"no"}},
    staff:[
      {id:"s1",name:"Kham",role:"owner",pin:"1111",active:true},
      {id:"s2",name:"Noy",role:"cashier",pin:"2222",active:true},
      {id:"s3",name:"Bee",role:"waiter",pin:"3333",active:true},
      {id:"s4",name:"Tou",role:"waiter",pin:"4444",active:true},
    ],
    cats:[
      {id:"beer",th:T("ເບຍ","Beer"),en:"Beer",station:"bar",icon:"beer"},
      {id:"cocktail",th:T("ຄັອກເທວ","Cocktails"),en:"Cocktails",station:"bar",icon:"cocktail"},
      {id:"liquor",th:T("ຊັອດ","Shots"),en:"Shots",station:"bar",icon:"liquor"},
      {id:"gin",th:T("ຈິນ","Gin"),en:"Gin",station:"bar",icon:"liquor"},
      {id:"wine",th:T("ໄວນ໌","Wine"),en:"Wine",station:"bar",icon:"cocktail"},
      {id:"soft",th:T("ນ້ຳ & ເຄື່ອງດື່ມ","Soft drinks"),en:"Soft drinks",station:"bar",icon:"soft"},
      {id:"snack",th:T("ຂອງວ່າງ","Snacks"),en:"Snacks",station:"kitchen",icon:"snack"},
    ],
    products:[
      /* ---- BEER BOTTLE ---- */
      B("b1","beer","Heineken 670 ml",T("ໄຮເນເກັ້ນ ຂວດໃຫຍ່","Heineken · large bottle"),65000,beerOpts()),
      B("b2","beer","Beerlao 670 ml",T("ເບຍລາວ ຂວດໃຫຍ່","Beerlao · large bottle"),50000,beerOpts()),
      B("b3","beer","Beerlao Gold 330 ml",T("ເບຍລາວ ໂກລ","Beerlao Gold · 330 ml"),50000,beerOpts()),
      B("b4","beer","Beerlao Dark 330 ml",T("ເບຍລາວ ດຳ","Beerlao Dark · 330 ml"),50000,beerOpts()),
      B("b5","beer","Beerlao IPA 330 ml",T("ເບຍລາວ ໄອພີເອ","Beerlao IPA · 330 ml"),50000,beerOpts()),
      P("b6","beer","Corona",T("ໂຄໂຣນາ","Corona"),80000),
      P("b7","beer","Hoegaarden Rosée",T("ເຮີກາເດິນ ໂຣເຊ","Hoegaarden Rosée"),80000),
      P("b8","beer","Budweiser",T("ບັດໄວເຊີ","Budweiser"),80000),
      /* ---- CRAFT BEER ON TAP ---- */
      P("t1","beer","Lager Beer 500 ml",T("ເບຍສົດ ແບບເຢຍລະມັນ · ABV 5%","On tap · German style · ABV 5%"),65000),
      P("t2","beer","Stout Beer 500 ml",T("ເບຍສົດ ແບບກິນເນສ · ABV 5.5%","On tap · Guinness style · ABV 5.5%"),65000),
      P("t3","beer","Weizen Beer 500 ml",T("ເບຍສົດ ແບບເບວຢຽມ · ABV 5.2%","On tap · Belgian style · ABV 5.2%"),65000,[{name:T("ກິ່ນລົດ","Flavour"),type:"one",choices:[{label:T("ປົກກະຕິ","Regular"),delta:0},{label:T("ສະຕໍເບີຣີ","Strawberry"),delta:0},{label:T("ນ້ຳສົ້ມ","Orange juice"),delta:0}]}]),
      P("t4","beer","Irish Car Bomb Stout",T("ສະເຕົາ ໄອຣິດ ຄາ ບອມ","Irish Car Bomb · stout"),150000),
      /* ---- COCKTAIL ---- */
      P("c1","cocktail","Mojito",T("ໂມຈິໂຕ້","Mojito"),110000,sweet),
      P("c2","cocktail","Margarita",T("ມາກາຣິຕ້າ","Margarita"),115000,sweet),
      P("c3","cocktail","Mai Tai",T("ໄມ ໄທ","Mai Tai"),110000,sweet),
      P("c4","cocktail","Blue gamikaze",T("ບລູ ຄາມິກາເຊ","Blue gamikaze"),105000,sweet),
      P("c5","cocktail","Martini",T("ມາຕີນີ","Martini"),120000,sweet),
      P("c6","cocktail","Negroni",T("ເນໂກຣນີ","Negroni"),120000,sweet),
      P("c7","cocktail","Lond ice land",T("ລອງ ໄອແລນ","Lond ice land"),150000,sweet),
      P("c8","cocktail","Black rusain",T("ແບລັກ ຣັດເຊຍ","Black rusain"),120000,sweet),
      P("c9","cocktail","Whrit rusain",T("ໄວ ຣັດເຊຍ","Whrit rusain"),120000,sweet),
      P("c10","cocktail","Whiskey sour",T("ວິສກີ້ ເຊົາ","Whiskey sour"),120000,sweet),
      P("c11","cocktail","Piña Colada",T("ປີນາ ໂຄລາດາ","Piña Colada"),110000,sweet),
      P("c12","cocktail","Sex on the Beach",T("ເຊັກ ອອນ ເດະ ບີ","Sex on the Beach"),110000,sweet),
      P("c13","cocktail","Blue Hawaii",T("ບລູ ຮາວາຍ","Blue Hawaii"),110000,sweet),
      P("c14","cocktail","Cuba Libre",T("ຄິວບາ ລິເບຣ","Cuba Libre"),110000,sweet),
      P("c15","cocktail","Gin Fizz",T("ຈິນ ຟິຊ","Gin Fizz"),120000,sweet),
      /* ---- SHOT ---- */
      P("l1","liquor","Gold Label",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l2","liquor","Black Label",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l3","liquor","Red Label",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l4","liquor","Jack daniels",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l5","liquor","Tegulla",T("ຊັອດ","Shot"),100000,null,{keep:true}),
      P("l6","liquor","Bundaberg",T("ຊັອດ","Shot"),100000,mixer,{keep:true}),
      P("l7","liquor","Pastis",T("ຊັອດ","Shot"),100000,null,{keep:true}),
      P("l8","liquor","Ararat",T("ຊັອດ","Shot"),130000,null,{keep:true}),
      P("l9","liquor","B52",T("ຊັອດ","Shot"),100000),
      P("l10","liquor","Vodka",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l11","liquor","Double Black Label",T("ຊັອດ","Shot"),120000,mixer,{keep:true}),
      P("l12","liquor","Baileys",T("ຊັອດ","Shot"),100000,null,{keep:true}),
      P("l13","liquor","Havana Club",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l14","liquor","Jameson",T("ຊັອດ","Shot"),110000,mixer,{keep:true}),
      P("l15","liquor","Sambuca",T("ຊັອດ","Shot"),100000),
      P("l16","liquor","Bacardi",T("ຊັອດ","Shot"),100000,mixer,{keep:true}),
      P("l17","liquor","Malibu",T("ຊັອດ","Shot"),100000,mixer,{keep:true}),
      P("l18","liquor","Jampari",T("ຊັອດ","Shot"),100000,null,{keep:true}),
      P("l19","liquor","Kahlúa",T("ຊັອດ","Shot"),100000),
      P("l20","liquor","Jägermeister",T("ຊັອດ","Shot"),100000),
      /* ---- GIN ---- */
      P("g1","gin","Gin hendrick",T("ຈິນ","Gin"),150000,mixer,{keep:true}),
      P("g2","gin","Gin Bombay",T("ຈິນ","Gin"),110000,mixer,{keep:true}),
      P("g3","gin","Gin Tanqueray",T("ຈິນ","Gin"),110000,mixer,{keep:true}),
      /* ---- WINE ---- */
      P("w1","wine","Red Wine",T("ໄວນ໌ແດງ","Red wine"),120000,null,{keep:true}),
      P("w2","wine","White Wine",T("ໄວນ໌ຂາວ","White wine"),120000,null,{keep:true}),
      /* ---- SOFT DRINKS ---- */
      P("s1","soft","Schwepes Tonic",T("ຊເວັບສ໌ ໂທນິກ","Schwepes Tonic"),30000),
      P("s2","soft","Schwepes manao",T("ຊເວັບສ໌ ໝາກນາວ","Schwepes manao"),30000),
      P("s3","soft","Coke Zero",T("ໂຄ້ກ ຊີໂຣ","Coke Zero"),30000),
      P("s4","soft","Coke Original",T("ໂຄ້ກ","Coke Original"),30000),
      P("s5","soft","Soda Water",T("ໂຊດາ","Soda water"),30000),
      P("s6","soft","Water",T("ນ້ຳດື່ມ","Drinking water"),15000),
      P("s7","soft","Ice",T("ນ້ຳກ້ອນ","Ice"),15000),
      /* ---- SNACK ---- */
      P("k1","snack","Roasted Peanuts",T("ຖົ່ວດິນຄົ່ວ","Roasted peanuts"),40000),
      P("k2","snack","Marinated Olives",T("ໝາກກອກໝັກ","Marinated olives"),75000),
      P("k3","snack",T("ຖົ່ວຍີ່ປຸ່ນ","Japanese peanuts"),"Japanese peanuts",65000),
    ],
    hh:{on:true,start:"17:00",end:"19:00",cats:["beer"],pct:20,force:true},
    discounts:[{id:"d1",label:"5%",type:"pct",value:5},{id:"d2",label:"10%",type:"pct",value:10},{id:"d3",label:T("ສະມາຊິກ 20%","Member 20%"),type:"pct",value:20},{id:"d4",label:"−50,000 ₭",type:"amt",value:50000}],
    cur:{THB:{rate:650,on:true},USD:{rate:21500,on:true},foreignRound:1,changeRound:1000,updated:Date.now()},
    pay:{cash:true,transfer:true,banks:[
      {id:"k1",name:"BCEL One",acc:"010-12-00-01234567-001",accName:"MIDNIGHT BAR CO.,LTD",on:true},
      {id:"k2",name:"LDB",acc:"0302-000-123456",accName:"MIDNIGHT BAR",on:true},
      {id:"k3",name:"JDB",acc:"1100-2233-4455",accName:"MIDNIGHT BAR",on:true}]},
    zones:[{id:"z1",name:T("ໃນຮ້ານ","Indoor")},{id:"z2",name:T("ລະບຽງ","Terrace")},{id:"z3",name:T("ເຄົາເຕີບາ","Bar counter")}],
    tables:[...Array.from({length:8},(_,i)=>({id:"t"+(i+1),name:"T"+(i+1),zone:"z1",seats:[4,2,4,6,4,2,4,8][i],on:true})),
            ...Array.from({length:4},(_,i)=>({id:"t"+(i+9),name:"T"+(i+9),zone:"z2",seats:4,on:i!==3})),
            {id:"t13",name:"B1",zone:"z3",seats:2,on:true},{id:"t14",name:"B2",zone:"z3",seats:2,on:true}],
    printer:{paper:80,copies:1,auto:false,receipt:("EPSON TM-T82 · "+T("ແຄັດເຊຍ","Cashier")),bar:("Xprinter XP-80 · "+T("ບາ","Bar")),kitchen:("Xprinter XP-80 · "+T("ເຮືອນຄົວ","Kitchen"))},
    security:{diffThreshold:10000,lockMin:5,pinLen:4,maxTries:3},
  };
}
const SEED_AUDIT=()=>[];
const SEED_BOTTLES=()=>[];
const KEY="midnight-bar-pos-v4";
let cfg, bottles, audit;
function load(){
  try{ const raw=localStorage.getItem(KEY); if(raw){ const d=JSON.parse(raw); if(d.cfg?.v===2){ cfg=d.cfg; bottles=d.bottles||[]; audit=d.audit||[]; if(cfg.menuV!==4){ const f=defaults(); cfg.products=f.products; cfg.cats=f.cats; cfg.hh=cfg.hh||f.hh; cfg.menuV=4; } return; } } }catch(e){}
  cfg=defaults(); bottles=SEED_BOTTLES(); audit=SEED_AUDIT().sort((a,b)=>b.t-a.t);
}
let saveT;
let afterSave=null;   /* js/sync.js ຕິດຟັງຊັນໄວ້ບ່ອນນີ້ — ສົ່ງການຕັ້ງຄ່າຂຶ້ນຊີດເມື່ອເຈົ້າຂອງແກ້ */
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(()=>{ try{ localStorage.setItem(KEY,JSON.stringify({cfg,bottles,audit})); }catch(e){ toast(T("ພື້ນທີ່ເກັບໃນບຣາວເຊີເຕັມ — ຂໍ້ມູນບາງສ່ວນອາດບໍ່ຖືກບັນທຶກ","Browser storage is full — some data may not be saved"),"i-alert",true); } if(typeof afterSave==="function"){ try{ afterSave(); }catch(e){} } },200);
  const f=$("#savedFlag"); if(f){ f.classList.add("on"); clearTimeout(f._t); f._t=setTimeout(()=>f.classList.remove("on"),1600); }
}
load(); cfg.sheets=cfg.sheets||{url:"",token:""}; cfg.printer.mode=cfg.printer.mode||"save"; relang([cfg,bottles,audit],I18N.lang);

/* สีตามทะนาคาร — BCEL แดง · JDB น้ำเงิน · LDB เขียวอมฟ้า */
const bankColor = name => { const n=String(name||""); return /bcel/i.test(n)?"#E5383B":/jdb/i.test(n)?"#1FA2B8":/ldb|trust/i.test(n)?"#3B82D6":null; };
const prod = id => cfg.products.find(p=>p.id===id);
const catOf = id => cfg.cats.find(c=>c.id===id) || {id:"x",th:T("ອື່ນໆ","Other"),en:"Other",station:"bar",icon:"x"};
const stationOf = catId => catOf(catId).station;
const catCls = c => CAT_ICONS[c.icon]?c.icon:"x";
const STATION = {bar:{th:T("ບາ","Bar"),ic:"i-cocktail",cls:"bar"},kitchen:{th:T("ເຮືອນຄົວ","Kitchen"),ic:"i-chef",cls:"kitchen"}};
const tableOf = id => cfg.tables.find(t=>t.id===id) || {id,name:id,zone:"",seats:0,on:true};
const zoneName = id => cfg.zones.find(z=>z.id===id)?.name || "";
const staffBy = id => cfg.staff.find(s=>s.id===id);

/* ===================== Session state (resets on reload) ===================== */
const now=Date.now(); let lineSeq=1;
function L(pid,qty,mods=[]){ const p=prod(pid)||{id:pid,cat:"x",name:pid,price:0}; return {id:lineSeq++,pid,cat:p.cat,name:p.name,qty,unit:p.price,orig:p.price,mods,sent:true,void:false}; }
function mkBill(no,table,guests,waiter,minsAgo,lines,status="open"){ return {no,table,guests,waiter,opened:Date.now()-minsAgo*60000,lines,disc:null,svc:cfg.shop.svcDefault,status,split:null}; }
const state={
  user:null, route:null, cat:"all", q:"", tries:0, lockUntil:0, lastAct:Date.now(), grants:{},
  bills:[],
  current:null, billSeq:1, payPart:null, orderSeq:1, closeInfo:null, shift:null,
  pay:{method:"cash",cur:"LAK",bank:null,ok:false},
  sales:[], counted:{LAK:null,THB:null,USD:null}, shiftClosed:false,
  setTab:"shop", auditFilter:"all", pf:"all", bkFilter:"all", bkQ:"",
  sbQ:"", sbRange:"today", sbOnly:"all",
  bkDraft:{level:50,photo:null,target:null},
};
const bill = () => state.bills.find(b=>b.no===state.current);
const liveLines = b => b.lines.filter(l=>!l.void);

/* ===================== Permissions ===================== */
function permOf(role,k){ if(role==="owner") return "yes"; const p=PERMS.find(x=>x.k===k); if(p?.ownerOnly) return "no"; return cfg.perms[k]?.[role]||"no"; }
const can = k => state.user ? permOf(state.user.role,k) : "no";
const PERM_LABEL = {yes:T("ໄດ້","Yes"),pin:T("PIN ເຈົ້າຂອງ","Owner PIN"),no:T("ບໍ່ໄດ້","No")};
function log(type,detail,by){ audit.unshift({t:Date.now(),who:state.user?.name||T("ລະບົບ","System"),role:state.user?.role||"",type,detail,by:by||""}); if(audit.length>800) audit.length=800; save(); }

/* Owner approval — resolves to the approving owner's name, or null */
function approve(title, detail){
  let done=null, pin="";
  return openDyn({
    cls:"w-sm", eyebrow:T("ຕ້ອງໃຫ້ເຈົ້າຂອງອະນຸມັດ","Owner approval required"), title:esc(title),
    body:`<div class="approve-ic">${icon("i-key")}</div>
      <p class="muted" style="text-align:center;margin:0">${esc(detail)}<br>${T("ໃຫ້ເຈົ້າຂອງຮ້ານໃສ່ PIN ຂອງເຈົ້າຂອງໃນເຄື່ອງນີ້","Ask the owner to enter the owner PIN on this device")}</p>
      <div class="pin-dots" id="apDots"></div>
      <div class="keypad" id="apPad" style="margin:0 auto"></div>
      <div class="small" id="apMsg" style="text-align:center;min-height:20px;color:var(--danger)" aria-live="assertive"></div>`,
    actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"}],
    mount(el,close){
      const owners=cfg.staff.filter(s=>s.role==="owner"&&s.active);
      const maxLen=Math.max(cfg.security.pinLen,...owners.map(o=>o.pin.length));
      const draw=()=>{ $("#apDots",el).innerHTML=Array.from({length:maxLen},(_,i)=>`<i class="${i<pin.length?"on":""}"></i>`).join(""); };
      pinPad($("#apPad",el),k=>{
        if(k==="C") pin=""; else if(k==="⌫") pin=pin.slice(0,-1); else if(pin.length<maxLen) pin+=k;
        draw();
        const hit=owners.find(o=>o.pin===pin);
        if(hit){ done=hit.name; close("ok"); }
        else if(pin.length>=maxLen){ $("#apMsg",el).textContent=T("PIN ບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ແມ່ນ PIN ຂອງເຈົ້າຂອງຮ້ານ","Wrong PIN, or not the owner's PIN"); const d=$("#apDots",el); d.classList.remove("err"); void d.offsetWidth; d.classList.add("err"); pin=""; setTimeout(draw,300); }
      });
      draw();
    }
  }).then(()=>done);
}
async function guard(k, title, detail){
  const p=can(k), def=PERMS.find(x=>x.k===k);
  if(p==="yes") return {ok:true,by:""};
  if(p==="pin"){
    const by=await approve(title||def.t, detail||`${ROLES[state.user.role]}${T("ເຮັດລາຍການນີ້ໄດ້ເມື່ອເຈົ້າຂອງອະນຸມັດ","This needs the owner's approval")}`);
    if(by){ toast(`${T("ອະນຸມັດໂດຍ","Approved by")} ${by}`,"i-key"); return {ok:true,by}; }
    return {ok:false};
  }
  toast(`${ROLES[state.user.role]}${T("ບໍ່ມີສິດ:","No permission:")} ${def.t}`,"i-lock",true);
  return {ok:false};
}

/* ===================== Generic dialog ===================== */
function openDyn({eyebrow="",title="",sub="",body="",actions=[],cls="",mount}){
  const dlg=$("#dyn"), form=$("#dynForm");
  if(dlg.open) dlg.close("cancel");
  dlg.className=cls;
  form.innerHTML=`<div class="dlg-h"><div style="min-width:0">${eyebrow?`<div class="eyebrow">${eyebrow}</div>`:""}<h2 id="dynTitle">${title}</h2>${sub?`<div class="muted small">${sub}</div>`:""}</div><button class="btn icon-btn x" value="cancel" aria-label="${T("ປິດ","Close")}" formnovalidate>${icon("i-x")}</button></div>
    <div class="dlg-b">${body}</div>
    ${actions.length?`<div class="dlg-f">${actions.map(a=>`<button class="btn ${a.cls||""}" value="${a.value}" ${a.id?`id="${a.id}"`:""} ${a.disabled?"disabled":""} ${a.value==="cancel"?"formnovalidate":""}>${a.icon?icon(a.icon):""}${a.label}</button>`).join("")}</div>`:""}`;
  dlg.setAttribute("aria-labelledby","dynTitle");
  return new Promise(res=>{
    const close=v=>dlg.close(v);
    const onClose=()=>{ dlg.removeEventListener("close",onClose); res({value:dlg.returnValue||"cancel",data:Object.fromEntries(new FormData(form)),el:form}); };
    dlg.addEventListener("close",onClose);
    dlg.returnValue="";
    dlg.showModal();
    mount && mount(form,close);
  });
}
const confirmBox=(title,text,okLabel=T("ຢືນຢັນ","Confirm"),danger=false)=>openDyn({cls:"w-sm",title,body:`<p style="margin:0">${text}</p>`,actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:okLabel,value:"ok",cls:danger?"btn-danger":"btn-gold"}]}).then(r=>r.value==="ok");
function pinPad(el,on,keys=["1","2","3","4","5","6","7","8","9","C","0","⌫"]){
  el.innerHTML=keys.map(k=>`<button type="button" data-k="${k}" aria-label="${k==="⌫"?T("ລຶບ","Delete"):k==="C"?T("ລ້າງ","Clear"):k}">${k==="C"?T("ລ້າງ","Clear"):k}</button>`).join("");
  el.addEventListener("click",e=>{ const k=e.target.closest("[data-k]")?.dataset.k; if(k) on(k); });
}

