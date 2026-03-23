/* ============================================================
   UYSOT — Core: State, Utils, Data, Calculations
   ============================================================ */

// === STATE ===
const S={rows:[],qRows:[],payRows:[],y2024Rows:[],perevodRows:[],config:null,sec:'dashboard',cP:0,cN:40,cQ:'',cS:'',cM:'',cR:'',mP:0,mN:40,mQ:'',clP:0,clN:40,clQ:'',mrrP:0,mrrQ:'',mrrYear:2026,dashPre:'y',dashFrom:new Date(2026,0,1),dashTo:new Date(),mrrCols:{mgr:true,hudud:true,mrr:true,deal:true,end:true},mrrSet:false,debtDate:new Date(),apiKey:localStorage.getItem('uysot_apikey')||'',geminiKey:localStorage.getItem('uysot_geminikey')||'',aiProvider:localStorage.getItem('uysot_ai')||'none',repSec:null,_cache:{}};

// === THEME ===
function initTheme(){
  const saved=localStorage.getItem('uysot_theme');
  if(saved)document.documentElement.setAttribute('data-theme',saved);
  else if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark');
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('uysot_theme',next);
}
initTheme();

// === MOBILE SIDEBAR ===
function toggleSidebar(){
  const sb=document.querySelector('.sidebar');
  const ov=document.querySelector('.sidebar-overlay');
  const hb=document.querySelector('.hamburger');
  sb.classList.toggle('open');ov.classList.toggle('active');hb.classList.toggle('active');
}
function closeSidebar(){
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');
  document.querySelector('.hamburger')?.classList.remove('active');
}

// === TOAST ===
function showToast(msg,type='info'){
  let c=document.querySelector('.toast-container');
  if(!c){c=document.createElement('div');c.className='toast-container';document.body.appendChild(c)}
  const t=document.createElement('div');t.className='toast toast-'+type;
  const icons={success:'✓',error:'✕',info:'ℹ'};
  t.innerHTML='<span style="font-size:14px;font-weight:700">'+icons[type]+'</span> '+msg;
  c.appendChild(t);setTimeout(()=>t.remove(),4000);
}

// === DEBOUNCE ===
function debounce(fn,ms=250){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms)}}

// === MEMOIZATION ===
function clearCache(){S._cache={}}
function cached(key,fn){
  if(S._cache[key])return S._cache[key];
  const r=fn();S._cache[key]=r;return r;
}

// === UTILS ===
function pn(s){return parseFloat((s||'').replace(/[$\s]/g,'').replace(/,/g,''))||0}
function fmt(n){return n?Math.round(n).toLocaleString('en-US').replace(/,/g,' '):'—'}
function fk(n){return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1000?Math.round(n/1000)+'k':Math.round(n)}
function fmtD(d){const dd=d.getDate(),mm=d.getMonth()+1,yy=d.getFullYear()%100;return(dd<10?'0':'')+dd+'.'+(mm<10?'0':'')+mm+'.'+yy}
function pd(s){if(!s)return null;let p=s.split('.');if(p.length===3)return new Date(+p[2],+p[1]-1,+p[0]);p=s.split('-');if(p.length===3)return new Date(+p[2],+p[1]-1,+p[0]);return null}

// === PARSE ===
function parse(t){const r=Papa.parse(t,{skipEmptyLines:true});const h=r.data[0];return r.data.slice(1).map(row=>{const o={};h.forEach((k,i)=>o[k.trim()]=(row[i]||'').trim());o._mUSD=pn(o['Oylik USD']);o._mUZS=pn(o['oylik UZS']);o._sUSD=pn(o['sum USD']);o._sUZS=pn(o['sum UZS']);o._tUSD=pn(o['Tadbiq USD']);o._dur=parseFloat(o['muddati (oy)'])||0;o._pre=parseInt(o['Prepayment'])||1;return o}).filter(r=>r.Client||r['Firma nomi'])}
function parseRaw(t){const r=Papa.parse(t,{skipEmptyLines:true});const h=r.data[0];return r.data.slice(1).map(row=>{const o={};h.forEach((k,i)=>o[k.trim()]=(row[i]||'').trim());return o})}

// === STATUS ===
function sc(s){if(!s)return'?';const l=s.toLowerCase();if(l.includes('active')||l==='yangi')return'A';if(l.includes('bajarildi'))return'D';if(l.includes('muammo')||l.includes('katta'))return'P';if(l.includes('eski qarz')||l.includes('tolov qilmagan'))return'Q';if(l.includes('ortiqcha'))return'O';if(l.includes('tugatildi')||l.includes('bekor'))return'X';return'B'}
function sb(s){const c=sc(s);const m={A:'b-green',D:'b-blue',P:'b-red',Q:'b-amber',O:'b-purple',X:'b-gray',B:'b-gray','?':'b-gray'};return`<span class="badge ${m[c]}">${s||'—'}</span>`}
function activeR(){return S.rows.filter(r=>sc(r.status)==='A')}
function uq(key){return[...new Set(S.rows.map(r=>r[key]).filter(Boolean))].sort()}

// === PAYMENTS ===
function calcPayments(){
  return cached('payments',()=>{
    const pm={};
    S.payRows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].pay+=pn(r.USD)});
    S.y2024Rows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].y24+=pn(r.USD)});
    S.perevodRows.forEach(r=>{const c=r.Client?.trim(),sh=r.shartnoma?.trim();if(!c||!sh)return;const k=c+'|'+sh;if(!pm[k])pm[k]={client:c,shartnoma:sh,pay:0,y24:0,per:0};pm[k].per+=pn(r['Tolov(usd)'])});
    Object.values(pm).forEach(v=>v.total=v.pay+v.y24+v.per);
    return pm;
  });
}
function calcClientPayments(){
  return cached('clientPay',()=>{
    const pm=calcPayments();const cp={};
    Object.values(pm).forEach(v=>{cp[v.client]=(cp[v.client]||0)+v.total});
    S.rows.forEach(r=>{if(r.Client&&r._tUSD)cp[r.Client]=(cp[r.Client]||0)-r._tUSD});
    S.qRows.forEach(r=>{const t=pn(r['Tadbiq USD']);if(r.Client&&t)cp[r.Client]=(cp[r.Client]||0)-t});
    return cp;
  });
}

// === CONTRACTS ===
function buildContracts(){
  return cached('contracts',()=>{
    const all=[],qAll=[];
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);all.push({client:r.Client,musd:r._mUSD||0,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',dur:r._dur||0,tUSD:r._tUSD||0,sUSD:r._sUSD||0,izoh:r.izoh||'',raqami:r.raqami||''})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const musd=pn(r['Oylik USD']);if(!musd)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);qAll.push({client:r.Client,musd,st,endD,mgr:r.Manager||'',hudud:'',dur:0,tUSD:0,sUSD:0,izoh:'',raqami:''})});
    return{all,qAll};
  });
}

// === MRR ON DATE ===
function mrrOnDate(dt,allCts,qCts){
  let total=0;const active=new Set();const contracts=[];
  allCts.forEach(ct=>{if(ct.st<=dt&&ct.endD>=dt&&ct.musd>0){total+=ct.musd;active.add(ct.client);contracts.push(ct)}});
  qCts.forEach(ct=>{if(ct.st<=dt&&ct.endD>=dt&&ct.musd){total+=ct.musd;if(ct.musd>0){active.add(ct.client);contracts.push(ct)}}});
  return{total:Math.round(total),active,contracts};
}

// === DEBT TABLE ===
function calcDebtTable(reportDate){
  if(!reportDate)reportDate=new Date();
  const repMonthEnd=new Date(reportDate.getFullYear(),reportDate.getMonth()+1,0);
  const rawPay={};const pm=calcPayments();
  const tadbiqPerClient={};
  S.rows.forEach(r=>{if(r.Client)tadbiqPerClient[r.Client]=(tadbiqPerClient[r.Client]||0)+r._tUSD});
  S.qRows.forEach(r=>{if(r.Client){const t=pn(r['Tadbiq USD']);if(t)tadbiqPerClient[r.Client]=(tadbiqPerClient[r.Client]||0)+t}});
  const clPay=calcClientPayments();
  Object.keys(clPay).forEach(c=>{rawPay[c]=clPay[c]+(tadbiqPerClient[c]||0)});
  Object.values(pm).forEach(v=>{if(!rawPay[v.client])rawPay[v.client]=v.total});
  const clients={};
  S.rows.forEach(r=>{
    if(!r.Client||!r.sanasi)return;
    const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;
    const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);
    const c=r.Client;
    if(!clients[c])clients[c]={name:c,contracts:[],totalSum:0,firma:r['Firma nomi']||''};
    clients[c].totalSum+=r._sUSD;
    if(r._mUSD>0||r._tUSD>0)clients[c].contracts.push({musd:r._mUSD,tUSD:r._tUSD,st,endD,pre:r._pre||1,isMain:true});
  });
  S.qRows.forEach(r=>{
    if(!r.Client||!r.sanasi)return;
    const musd=pn(r['Oylik USD']),tUSD=pn(r['Tadbiq USD']);
    const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;
    const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);
    const c=r.Client;
    if(!clients[c])clients[c]={name:c,contracts:[],totalSum:0,firma:''};
    if(musd>0){
      let actualSum=tUSD||0;let d=new Date(st.getFullYear(),st.getMonth(),1);
      const fmE=new Date(st.getFullYear(),st.getMonth()+1,0);
      const fmDays=Math.round((fmE-st)/864e5)+1;const on1st=st.getDate()===1;
      const firstMP=on1st?musd:Math.round(musd*fmDays/fmE.getDate());
      while(d<=endD){
        const mE=new Date(d.getFullYear(),d.getMonth()+1,0);
        if(st>mE||endD<d){d.setMonth(d.getMonth()+1);continue}
        const isF=(st.getFullYear()===d.getFullYear()&&st.getMonth()===d.getMonth());
        const isL=(endD.getFullYear()===d.getFullYear()&&endD.getMonth()===d.getMonth());
        if(isF&&isL){actualSum+=Math.round(musd*Math.round((endD-st)/864e5+1)/mE.getDate())}
        else if(isF){actualSum+=firstMP}
        else if(isL){const mS=new Date(d);actualSum+=Math.round(musd*Math.round((endD-mS)/864e5+1)/mE.getDate())}
        else{actualSum+=musd}
        d.setMonth(d.getMonth()+1);
      }
      clients[c].totalSum+=actualSum;
      clients[c].contracts.push({musd,tUSD:tUSD||0,st,endD,pre:1,isMain:false});
    }
  });
  Object.values(clients).forEach(cl=>{
    const mainCts=cl.contracts.filter(c=>c.isMain&&c.musd>0);if(!mainCts.length)return;
    const anchor=mainCts.reduce((a,c)=>c.st<a.st?c:a,mainCts[0]);
    cl.contracts.filter(c=>!c.isMain).forEach(q=>{q.pre=anchor.pre});
  });
  const result=[];
  Object.values(clients).forEach(cl=>{
    const paid=rawPay[cl.name]||0;const qoldiq=Math.round(cl.totalSum-paid);
    let cumExp=0;
    cl.contracts.forEach(ct=>{
      if(ct.st>repMonthEnd)return;cumExp+=ct.tUSD;if(ct.musd<=0)return;
      const fmE=new Date(ct.st.getFullYear(),ct.st.getMonth()+1,0);
      const fmDays=Math.round((fmE-ct.st)/864e5)+1;const on1st=ct.st.getDate()===1;
      const firstMP=on1st?ct.musd:Math.round(ct.musd*fmDays/fmE.getDate());
      let lastMP;
      if(ct.isMain){if(on1st){const lmE=new Date(ct.endD.getFullYear(),ct.endD.getMonth()+1,0);lastMP=ct.endD.getDate()===lmE.getDate()?ct.musd:Math.round(ct.musd*ct.endD.getDate()/lmE.getDate())}else{lastMP=ct.musd-firstMP}}
      else{const lmS=new Date(ct.endD.getFullYear(),ct.endD.getMonth(),1);const lmE=new Date(ct.endD.getFullYear(),ct.endD.getMonth()+1,0);lastMP=Math.round(ct.musd*Math.round((ct.endD-lmS)/864e5+1)/lmE.getDate())}
      const mEnd=ct.endD<repMonthEnd?ct.endD:repMonthEnd;
      let d=new Date(ct.st.getFullYear(),ct.st.getMonth(),1);
      while(d<=mEnd){
        if(ct.st>new Date(d.getFullYear(),d.getMonth()+1,0)||ct.endD<d){d.setMonth(d.getMonth()+1);continue}
        const isF=(ct.st.getFullYear()===d.getFullYear()&&ct.st.getMonth()===d.getMonth());
        const isL=(ct.endD.getFullYear()===d.getFullYear()&&ct.endD.getMonth()===d.getMonth());
        if(isF&&isL){cumExp+=Math.min(firstMP,lastMP)}else if(isF){cumExp+=firstMP}else if(isL){cumExp+=lastMP}else{cumExp+=ct.musd}
        d.setMonth(d.getMonth()+1);
      }
    });
    const oyQarz=Math.round(cumExp-paid);
    const mainCts=cl.contracts.filter(c=>c.isMain&&c.musd>0);
    const anchor=mainCts.length?mainCts.reduce((a,c)=>c.st<a.st?c:a,mainCts[0]):cl.contracts.find(c=>c.musd>0);
    let kelExp=0;cl.contracts.forEach(ct=>{kelExp+=ct.tUSD});
    if(anchor){
      const anchorPre=anchor.pre||1;const aM0=anchor.st.getFullYear()*12+anchor.st.getMonth();
      const rM=repMonthEnd.getFullYear()*12+repMonthEnd.getMonth();
      const blocksDue=Math.floor(Math.max(0,rM-aM0)/anchorPre)+1;
      const paidThroughM=aM0+blocksDue*anchorPre-1;
      cl.contracts.forEach(ct=>{
        if(ct.musd<=0||ct.st>repMonthEnd)return;
        if(ct.isMain){
          const ctOn1st=ct.st.getDate()===1;
          const ctCalM=(ct.endD.getFullYear()-ct.st.getFullYear())*12+(ct.endD.getMonth()-ct.st.getMonth())+1;
          const ctEffM=ctOn1st?ctCalM:Math.max(ctCalM-1,1);
          const ctM0=ct.st.getFullYear()*12+ct.st.getMonth();const ctM1=ct.endD.getFullYear()*12+ct.endD.getMonth();
          const dueCalM=Math.max(0,Math.min(ctM1,paidThroughM)-ctM0+1);
          const dueEffM=dueCalM>=ctCalM?ctEffM:Math.min(dueCalM,ctEffM);
          kelExp+=ct.musd*dueEffM;
        }else{
          const ctM0=ct.st.getFullYear()*12+ct.st.getMonth();const ctM1=ct.endD.getFullYear()*12+ct.endD.getMonth();
          const dueEnd=Math.min(ctM1,paidThroughM);
          for(let mi=ctM0;mi<=dueEnd;mi++){
            const y=Math.floor(mi/12),m=mi%12;const mS=new Date(y,m,1),mE=new Date(y,m+1,0);
            const isF=(mi===ctM0&&ct.st.getDate()!==1);const isL=(mi===ctM1);
            if(isF&&isL){kelExp+=Math.round(ct.musd*Math.round((ct.endD-ct.st)/864e5+1)/mE.getDate())}
            else if(isF){kelExp+=Math.round(ct.musd*Math.round((mE-ct.st)/864e5+1)/mE.getDate())}
            else if(isL){kelExp+=Math.round(ct.musd*Math.round((ct.endD-mS)/864e5+1)/mE.getDate())}
            else{kelExp+=ct.musd}
          }
        }
      });
    }
    const kelQarz=Math.round(kelExp-paid);
    if(qoldiq>1||oyQarz>1||kelQarz>1)result.push({name:cl.name,firma:cl.firma,qoldiq,oyQarz,kelQarz,totalSum:Math.round(cl.totalSum),paid:Math.round(paid)});
  });
  result.sort((a,b)=>b.kelQarz-a.kelQarz);return result;
}

// === DASHBOARD PRESETS ===
function dashPreset(key){
  const now=new Date();const y=now.getFullYear(),m=now.getMonth(),d=now.getDate();
  const dow=now.getDay()||7;const wkS=new Date(y,m,d-(dow-1));
  const presets={
    'w':{from:wkS,to:now,label:'Bu hafta'},'m':{from:new Date(y,m,1),to:now,label:'Bu oy'},
    'q':{from:new Date(y,Math.floor(m/3)*3,1),to:now,label:'Bu chorak'},'y':{from:new Date(y,0,1),to:now,label:y+''},
    '30':{from:new Date(y,m,d-30),to:now,label:'30 kun'},'90':{from:new Date(y,m,d-90),to:now,label:'90 kun'},
    '25':{from:new Date(2025,0,1),to:new Date(2025,11,31),label:'2025'},'24':{from:new Date(2024,0,1),to:new Date(2024,11,31),label:'2024'},
  };
  return presets[key]||presets['y'];
}
function applyPreset(key){S.dashPre=key;const p=dashPreset(key);S.dashFrom=p.from;S.dashTo=p.to;clearCache();render()}
