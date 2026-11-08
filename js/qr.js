"use strict";
/* ===================== ຕົວສ້າງ QR (byte mode · ລະດັບແກ້ໄຂ M) =====================
   ຂຽນເອງ ບໍ່ໄດ້ດຶງໄລບຣາຣີຈາກພາຍນອກ ຈຶ່ງໃຊ້ແບບອອບໄລນ໌ໄດ້ ແລະ ບໍ່ມີໂຄດແປກປອມ
   ສົ່ງຄືນເປັນຕາລາງ true/false — true = ຊ່ອງດຳ */

/* ຈຳນວນ codeword ທັງໝົດຕໍ່ເວີຊັນ (1..20) */
const QR_TOTAL=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085];
/* ລະດັບ M: [ec ຕໍ່ block, ຈຳນວນ block ກຸ່ມ1, data ຕໍ່ block ກຸ່ມ1, block ກຸ່ມ2, data ກຸ່ມ2] */
const QR_M=[null,[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],
 [16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44],[30,1,50,4,51],
 [22,6,36,2,37],[22,8,37,1,38],[24,4,40,5,41],[24,5,41,5,42],[28,7,45,3,46],[28,10,46,1,47],
 [26,9,43,4,44],[26,3,44,11,45],[26,3,41,13,42]];
/* ຈຸດກາງຂອງ alignment pattern ຕໍ່ເວີຊັນ */
const QR_ALIGN=[[],[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
 [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],
 [6,30,58,86],[6,34,62,90]];

/* ---- ເລກຄະນິດໃນ GF(256) ສຳລັບ Reed-Solomon ---- */
const QR_EXP=new Uint8Array(512), QR_LOG=new Uint8Array(256);
(function(){ let x=1;
  for(let i=0;i<255;i++){ QR_EXP[i]=x; QR_LOG[x]=i; x<<=1; if(x&0x100) x^=0x11D; }
  for(let i=255;i<512;i++) QR_EXP[i]=QR_EXP[i-255];
})();
const qrMul=(a,b)=>(a===0||b===0)?0:QR_EXP[QR_LOG[a]+QR_LOG[b]];

function qrRsGen(n){
  let g=[1];
  for(let i=0;i<n;i++){
    const ng=new Array(g.length+1).fill(0);
    for(let j=0;j<g.length;j++){ ng[j]^=g[j]; ng[j+1]^=qrMul(g[j],QR_EXP[i]); }
    g=ng;
  }
  return g;
}
function qrRsEnc(data,ecLen){
  const g=qrRsGen(ecLen), res=new Array(ecLen).fill(0);
  for(const d of data){
    const f=d^res[0];
    res.shift(); res.push(0);
    if(f) for(let i=0;i<ecLen;i++) res[i]^=qrMul(g[i+1],f);
  }
  return res;
}

/* ---- ຕົວແບບ (mask) ແລະ ຂໍ້ມູນຮູບແບບ ---- */
const QR_MASK=[
  (r,c)=>((r+c)&1)===0, (r,c)=>(r&1)===0, (r,c)=>c%3===0, (r,c)=>(r+c)%3===0,
  (r,c)=>(((r>>1)+Math.floor(c/3))&1)===0, (r,c)=>((r*c)&1)+((r*c)%3)===0,
  (r,c)=>((((r*c)&1)+((r*c)%3))&1)===0, (r,c)=>((((r+c)&1)+((r*c)%3))&1)===0];

function qrFormatBits(maskIdx){
  const data=(0x00<<3)|maskIdx;          // 0x00 = ລະດັບ M
  let v=data<<10;
  for(let i=4;i>=0;i--) if(v&(1<<(i+10))) v^=0x537<<i;
  return ((data<<10)|v)^0x5412;
}
function qrVersionBits(ver){
  let v=ver<<12;
  for(let i=5;i>=0;i--) if(v&(1<<(i+12))) v^=0x1F25<<i;
  return (ver<<12)|v;
}

/* ---- ສ້າງຕາລາງ QR ---- */
function qrMatrix(text){
  const bytes=[...new TextEncoder().encode(text)];

  let ver=0;
  for(let v=1;v<=20;v++){
    const [ec,g1,d1,g2,d2]=QR_M[v];
    const cap=g1*d1+g2*d2;
    const need=bytes.length+2+(v>=10?1:0);   // 4 bit ໂໝດ + ຄວາມຍາວ (8 ຫຼື 16 bit)
    if(cap>=need){ ver=v; break; }
  }
  if(!ver) throw new Error("QR: ຂໍ້ມູນຍາວເກີນໄປ");

  const [ecLen,g1,d1,g2,d2]=QR_M[ver];
  const dataCW=g1*d1+g2*d2;
  const lenBits=ver<10?8:16;

  /* ສາຍ bit: ໂໝດ 0100 + ຄວາມຍາວ + ຂໍ້ມູນ + ສິ້ນສຸດ */
  const bits=[];
  const push=(val,n)=>{ for(let i=n-1;i>=0;i--) bits.push((val>>i)&1); };
  push(4,4); push(bytes.length,lenBits);
  bytes.forEach(b=>push(b,8));
  for(let i=0;i<4&&bits.length<dataCW*8;i++) bits.push(0);
  while(bits.length%8) bits.push(0);
  const cw=[];
  for(let i=0;i<bits.length;i+=8) cw.push(parseInt(bits.slice(i,i+8).join(""),2));
  const PAD=[0xEC,0x11];
  for(let i=0;cw.length<dataCW;i++) cw.push(PAD[i%2]);

  /* ແບ່ງເປັນ block ແລ້ວຄິດ EC */
  const blocks=[], ecBlocks=[];
  let pos=0;
  for(let i=0;i<g1;i++){ const b=cw.slice(pos,pos+d1); pos+=d1; blocks.push(b); ecBlocks.push(qrRsEnc(b,ecLen)); }
  for(let i=0;i<g2;i++){ const b=cw.slice(pos,pos+d2); pos+=d2; blocks.push(b); ecBlocks.push(qrRsEnc(b,ecLen)); }

  /* ສະຫຼັບລຳດັບ (interleave) */
  const final=[];
  const maxD=Math.max(d1,d2||0);
  for(let i=0;i<maxD;i++) blocks.forEach(b=>{ if(i<b.length) final.push(b[i]); });
  for(let i=0;i<ecLen;i++) ecBlocks.forEach(b=>final.push(b[i]));

  /* ວາງລົງຕາລາງ */
  const size=ver*4+17;
  const m=Array.from({length:size},()=>new Array(size).fill(null));
  const set=(r,c,v)=>{ if(r>=0&&r<size&&c>=0&&c<size) m[r][c]=v; };

  const finder=(r,c)=>{ for(let i=-1;i<=7;i++) for(let j=-1;j<=7;j++){
    const inB=i>=0&&i<=6&&j>=0&&j<=6;
    const dark=inB&&((i===0||i===6||j===0||j===6)||(i>=2&&i<=4&&j>=2&&j<=4));
    set(r+i,c+j,dark); }; };
  finder(0,0); finder(0,size-7); finder(size-7,0);

  for(let i=8;i<size-8;i++){ const d=i%2===0; set(6,i,d); set(i,6,d); }

  const centers=QR_ALIGN[ver];
  centers.forEach(r=>centers.forEach(c=>{
    if((r<=8&&c<=8)||(r<=8&&c>=size-9)||(r>=size-9&&c<=8)) return;
    for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++)
      set(r+i,c+j, Math.max(Math.abs(i),Math.abs(j))!==1);
  }));

  set(size-8,8,true);                                   // ຊ່ອງດຳຄົງທີ່
  for(let i=0;i<9;i++){ if(m[8][i]===null) set(8,i,false); if(m[i][8]===null) set(i,8,false); }
  for(let i=0;i<8;i++){ if(m[8][size-1-i]===null) set(8,size-1-i,false); if(m[size-1-i][8]===null) set(size-1-i,8,false); }
  if(ver>=7) for(let i=0;i<18;i++){ const r=Math.floor(i/3), c=i%3;
    set(size-11+c,r,false); set(r,size-11+c,false); }

  const reserved=m.map(row=>row.map(v=>v!==null));

  let bi=0;
  const bitAt=i=>i<final.length*8 ? (final[i>>3]>>(7-(i&7)))&1 : 0;
  for(let col=size-1;col>0;col-=2){
    if(col===6) col--;
    for(let k=0;k<size;k++){
      const up=((size-1-col)>>1)%2===0;
      const row=up?size-1-k:k;
      for(const c of [col,col-1]) if(!reserved[row][c]){ m[row][c]=bitAt(bi)===1; bi++; }
    }
  }

  /* ເລືອກ mask ທີ່ໄດ້ຄະແນນໂທດຕ່ຳສຸດ */
  const penalty=g=>{
    let p=0;
    for(let r=0;r<size;r++) for(let c=0;c<size;c++){
      if(c<size-1&&r<size-1&&g[r][c]===g[r][c+1]&&g[r][c]===g[r+1][c]&&g[r][c]===g[r+1][c+1]) p+=3;
    }
    const runs=line=>{ let run=1,s=0;
      for(let i=1;i<line.length;i++){ if(line[i]===line[i-1]) run++; else { if(run>=5) s+=run-2; run=1; } }
      if(run>=5) s+=run-2; return s; };
    for(let r=0;r<size;r++) p+=runs(g[r]);
    for(let c=0;c<size;c++) p+=runs(g.map(row=>row[c]));
    let dark=0; g.forEach(row=>row.forEach(v=>{ if(v) dark++; }));
    p+=Math.floor(Math.abs(dark*100/(size*size)-50)/5)*10;
    return p;
  };

  let best=null,bestP=Infinity,bestMask=0;
  for(let k=0;k<8;k++){
    const g=m.map((row,r)=>row.map((v,c)=>reserved[r][c]?v:(QR_MASK[k](r,c)?!v:v)));
    const f=qrFormatBits(k);
    for(let i=0;i<15;i++){
      const b=((f>>(14-i))&1)===1;   /* ບິດສູງສຸດລົງກ່ອນ */
      if(i<6) g[8][i]=b; else if(i<8) g[8][i+1]=b; else if(i===8) g[7][8]=b; else g[14-i][8]=b;
      if(i<8) g[size-1-i][8]=b; else g[8][size-15+i]=b;
    }
    g[size-8][8]=true;
    if(ver>=7){ const vb=qrVersionBits(ver);
      for(let i=0;i<18;i++){ const b=((vb>>i)&1)===1, r=Math.floor(i/3), c=i%3;
        g[size-11+c][r]=b; g[r][size-11+c]=b; } }
    const p=penalty(g);
    if(p<bestP){ bestP=p; best=g; bestMask=k; }
  }
  return best.map(row=>row.map(v=>v===true));
}

/* ---- ວາດເປັນ SVG ---- */
function qrSvgPath(text){
  const m=qrMatrix(text), n=m.length;
  let d="";
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(m[r][c]) d+=`M${c} ${r}h1v1h-1z`;
  return {d,n};
}

/* ===================== Lao QR (EMV) ສຳລັບບິນແຕ່ລະໃບ =====================
   ເອົາ QR ຮັບເງິນຂອງຮ້ານ (ແບບຄົງທີ່ ບໍ່ມີຍອດ) ມາເປັນແມ່ແບບ
   ແລ້ວໃສ່ຍອດ (tag 54) ກັບເລກບິນອ້າງອີງ (tag 62/05) ພ້ອມຄິດ CRC ໃໝ່ */
function emvCrc(s){
  let crc=0xFFFF;
  for(let i=0;i<s.length;i++){
    crc^=s.charCodeAt(i)<<8;
    for(let b=0;b<8;b++) crc = (crc&0x8000) ? ((crc<<1)^0x1021)&0xFFFF : (crc<<1)&0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4,"0");
}
function emvSplit(s){
  const out={}; let i=0;
  while(i+4<=s.length){
    const t=s.slice(i,i+2), n=parseInt(s.slice(i+2,i+4),10);
    if(!/^\d{2}$/.test(t)||isNaN(n)) return null;
    out[t]=s.slice(i+4,i+4+n); i+=4+n;
  }
  return out;
}
const emvTlv=(t,v)=>t+String(v.length).padStart(2,"0")+v;
/* ແມ່ແບບ QR ຖືກຕ້ອງບໍ? (ໃຊ້ກວດຕອນເຈົ້າຂອງວາງຄ່າໃສ່ໃນຕັ້ງຄ່າ) */
function laoQrValid(tpl){
  if(!tpl||tpl.length<20) return false;
  const f=emvSplit(tpl.slice(0,-4));
  return !!(f&&f["38"]&&f["53"]&&emvCrc(tpl.slice(0,-4))===tpl.slice(-4).toUpperCase());
}
/* ສ້າງ payload ທີ່ລັອກຍອດແລ້ວ — ຄືນ null ຖ້າແມ່ແບບບໍ່ຖືກຕ້ອງ */
function laoQrPayload(tpl,amount,ref){
  if(!laoQrValid(tpl)) return null;
  const f=emvSplit(tpl.slice(0,-4)); if(!f) return null;
  delete f["63"];
  f["01"]="12";                                   // ໃຊ້ເທື່ອດຽວ (ມີຍອດ)
  const amt=Math.round(Number(amount)||0);
  if(amt>0) f["54"]=String(amt); else delete f["54"];
  if(ref) f["62"]=emvTlv("05",String(ref).slice(0,25));
  const body=Object.keys(f).sort().map(t=>emvTlv(t,f[t])).join("")+"6304";
  return body+emvCrc(body);
}
/* <svg> ພ້ອມໃຊ້ — ວາງໃນໃບບິນ ຫຼື ໜ້າຊຳລະເງິນໄດ້ເລີຍ */
function laoQrSvg(tpl,amount,ref,px){
  const payload=laoQrPayload(tpl,amount,ref); if(!payload) return "";
  const {d,n}=qrSvgPath(payload);
  return `<svg class="qr-img" viewBox="-1 -1 ${n+2} ${n+2}" width="${px||150}" height="${px||150}" shape-rendering="crispEdges" role="img" aria-label="QR ${fmt(amount)} ກີບ"><rect x="-1" y="-1" width="${n+2}" height="${n+2}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}
