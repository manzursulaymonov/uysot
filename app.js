/* ============================================================
   UYSOT — UI: Dashboard Range, Render, Pages, Charts, Config
   ============================================================ */

// === DASHBOARD RANGE ===
function dashRange(){
  const cacheKey='dr_'+S.dashPre+'_'+S.dashFrom?.getTime()+'_'+S.dashTo?.getTime();
  return cached(cacheKey,()=>{
    const from=S.dashFrom,to=S.dashTo;const days=Math.round((to-from)/864e5);
    let gran=days<=31?'day':'month';const points=[];
    if(gran==='day'){for(let d=new Date(from);d<=to;d.setDate(d.getDate()+1))points.push(new Date(d))}
    else{for(let d=new Date(from.getFullYear(),from.getMonth(),1);d<=to;d.setMonth(d.getMonth()+1))points.push(new Date(d))}
    if(!points.length)points.push(new Date(from));
    const labels=points.map(d=>{
      if(gran==='day')return fmtD(d);
      const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
      const span=(to.getFullYear()-from.getFullYear())*12+(to.getMonth()-from.getMonth());
      return span>11?mos[d.getMonth()]+' '+(d.getFullYear()%100):mos[d.getMonth()];
    }); const {all, qAll} = buildContracts();
    const allData = all.concat(qAll).filter(c=>c.musd>0);
    const names = [...new Set(allData.map(c=>c.client))];
    const now = new Date();

    const getMRR = (name, date) => allData.filter(c=>c.client===name && c.st<=date && c.endD>=date).reduce((s,x)=>s+x.musd,0);
    
    const baseDate = new Date(from.getFullYear(), from.getMonth(), from.getDate()-1); 
    const nextDay = from;

    const clientMeta = {};
    names.forEach(name => {
        const cts = allData.filter(c=>c.client===name);
        const firstEver = cts.reduce((a,c)=>c.st < a.st ? c : a);
        const lastEver = cts.reduce((a,c)=>c.endD > a.endD ? c : a);
        
        const mBase = getMRR(name, baseDate);
        const mNext = getMRR(name, nextDay);
        // Baseline: 01.01.2026 da bor bo'lgan va oldindan kelayotgan mijozlar
        const inBase = mNext > 0 && firstEver.st < from;
        
        const joinedInPeriod = firstEver.st >= from && firstEver.st <= to;
        const leftInPeriod = lastEver.endD >= from && lastEver.endD <= to;
        const renewedSoon = allData.some(c=>c.client===name && c.st.getTime() === lastEver.endD.getTime()+864e5);
        const actuallyLeft = leftInPeriod && !renewedSoon;

        let cat = 'Other';
        if(joinedInPeriod && actuallyLeft) cat = 'Transient';
        else if(joinedInPeriod) cat = 'New';
        else if(actuallyLeft && inBase) cat = 'Churn';
        else if(inBase) cat = 'Retained';
        else if(firstEver.st < from && getMRR(name, now) > 0) cat = 'Resurrected';
        
        clientMeta[name] = {cat, firstEver, lastEver, mrrBase: inBase ? mNext : 0};
    });

    const newClients=[], churnClients=[], expClients=[];
    const seenNew=new Set(), seenChurn=new Set(), seenExp=new Set();
    let startMRRsum = 0, exactBaseClients = 0;
    const newPerPt=[],churnPerPt=[],newMrrArr=[],churnMrrArr=[],expMrrArr=[],conMrrArr=[],totals=[],cpmArr=[];

    points.forEach((pt, i) => {
        const binStart = gran==='day' ? new Date(pt) : new Date(pt.getFullYear(), pt.getMonth(), 1);
        let binEnd = gran==='day' ? new Date(pt) : new Date(pt.getFullYear(), pt.getMonth()+1, 0, 23, 59, 59);
        let binOut = gran==='day' ? new Date(pt.getFullYear(), pt.getMonth(), pt.getDate() + 1) : new Date(pt.getFullYear(), pt.getMonth()+1, 1);
        
        if(binEnd > now) binEnd = now;
        if(binOut > now) binOut = now;
        
        const sSnap = mrrOnDate(binStart, all, qAll);
        const eSnap = mrrOnDate(binOut, all, qAll);
        
        let newM=0, churnM=0, expM=0, conM=0;
        let newCount=0, churnCount=0;
        
        totals.push(Math.round(eSnap.total));
        cpmArr.push(eSnap.active.size);
        
        names.forEach(name => {
           const meta = clientMeta[name];
           if (meta.cat === 'Other') return;

           const mStart = sSnap.contracts.filter(c=>c.client===name).reduce((s,x)=>s+x.musd,0);
           const mEnd = eSnap.contracts.filter(c=>c.client===name).reduce((s,x)=>s+x.musd,0);
           const delta = mEnd - mStart;
           const mgr = (meta.lastEver||{}).mgr||'';

           // === ATRIBUCIYA (Confirmed Spec) ===
           if (meta.cat === 'New' || meta.cat === 'Transient') {
              if (delta > 0) newM += delta;
              if (meta.cat === 'Transient' && delta < 0) churnM += Math.abs(delta);
              
              if (!seenNew.has(name) && delta > 0) {
                 seenNew.add(name);
                 newClients.push({name, date: meta.firstEver.st, mgr, mrr: Math.round(getMRR(name, now)), isRechurn: false, hudud: meta.firstEver.hudud||'', dur: meta.firstEver.dur||0, tUSD: meta.firstEver.tUSD||0});
              }
              if (meta.cat === 'Transient' && !seenChurn.has(name) && delta < 0) {
                 seenChurn.add(name);
                 churnClients.push({name, date: meta.lastEver.endD, mgr, mrr: Math.round(mStart), izoh: 'Joined & Left in period'});
              }
           }
           else if (meta.cat === 'Churn') {
              const isDeparture = meta.lastEver.endD >= binStart && meta.lastEver.endD <= binEnd;
              if (isDeparture) {
                 churnM += mStart; churnCount++;
                 if (!seenChurn.has(name)) {
                    seenChurn.add(name);
                    churnClients.push({name, date: meta.lastEver.endD, mgr, mrr: Math.round(meta.mrrBase), izoh: ''});
                 }
              } else { churnM -= delta; } 
           }
           else { // Retained yoki Resurrected
              if (Math.abs(delta) > 1) {
                 if (delta > 0) expM += delta; else conM += Math.abs(delta);
                 if (!seenExp.has(name)) {
                    seenExp.add(name);
                    const mToday = getMRR(name, now);
                    expClients.push({name, mrrStart: Math.round(meta.mrrBase), mrrEnd: Math.round(mToday), delta: Math.round(mToday - meta.mrrBase), mgr, date: binStart});
                 }
              }
           }
           if (i === 0 && meta.mrrBase > 0) { startMRRsum += meta.mrrBase; exactBaseClients++; }
        });
        
        newMrrArr.push(Math.round(newM));
        churnMrrArr.push(Math.round(churnM));
        expMrrArr.push(Math.round(expM));
        conMrrArr.push(Math.round(conM));
        newPerPt.push(newCount);
        churnPerPt.push(churnCount);
    });

    newClients.sort((a,b)=>b.date-a.date); churnClients.sort((a,b)=>b.date-a.date);
    expClients.sort((a,b)=>b.date-a.date);
    return {labels, totals, cpmArr, newPerPt, churnPerPt, addedMRR: newMrrArr, lostMRR: churnMrrArr, expMRR: expMrrArr, conMRR: conMrrArr, newClients, churnClients, expClients, gran, points, baseMRR: Math.round(startMRRsum), baseClients: exactBaseClients};
  });
}

// === MRR DATA ===
function mrrData(year){
  year=year||S.mrrYear||2026;
  const cacheKey='mrr_'+year;
  return cached(cacheKey,()=>{
    const allC={};
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);const c=r.Client;if(!allC[c])allC[c]=[];allC[c].push({musd:r._mUSD||0,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',sanasi:r.sanasi||'',amal:r['amal qilishi']||''})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);const c=r.Client;if(!allC[c])allC[c]=[];allC[c].push({musd:r._mUSD||0,st,endD,mgr:r.Manager||'',hudud:r.Hudud||'',sanasi:r.sanasi||'',amal:r['amal qilishi']||'',isQ:true})});
    
    const cmap={};
    Object.entries(allC).forEach(([name,contracts])=>{
      const paid=contracts.filter(ct=>ct.musd>0);
      if(!paid.length) return;
      
      const mains = contracts.filter(c => !c.isQ).sort((a,b)=>a.st-b.st);
      if(!mains.length) return; // Qo'shimchani o'zi bo'lsa, mijoz sanalmaydi
      
      const firstMgr=mains[0].mgr, firstDeal=mains[0].sanasi, firstSt=mains[0].st;
      const latest=mains.reduce((a,b)=>b.endD>a.endD?b:a,mains[0]);
      
      const monthly=new Array(12).fill(0);
      
      for(let m=0; m<12; m++) {
        const mS = new Date(year, m, 1);
        const mE = new Date(year, m + 1, 0, 23, 59, 59);
        const act = paid.filter(ct => ct.st <= mE && ct.endD >= mS);
        
        if(!act.length) continue;
        
        // Max Daily MRR in this month
        let maxMrr = 0;
        const endDay = mE.getDate();
        for(let d=1; d<=endDay; d++) {
            const checkDt = new Date(year, m, d, 23, 59, 59); // Kun oxiridagi faollikni tekshiramiz
            let dayMrr = 0;
            for(let i=0; i<act.length; i++) {
                const ct = act[i];
                if(ct.st <= checkDt && ct.endD >= checkDt) {
                    dayMrr += ct.musd;
                }
            }
            if(dayMrr > maxMrr) maxMrr = dayMrr;
        }
        monthly[m] = maxMrr;
      }
      
      if(Math.max(...monthly) > 0) {
          cmap[name]={name,mgr:firstMgr,hudud:mains[0].hudud,mrr:0,dealStart:firstDeal,dealEnd:latest.amal,startDate:firstSt,monthly};
      }
    });

    const now=new Date();const curM=now.getFullYear()===year?now.getMonth():(year<now.getFullYear()?11:0);
    Object.values(cmap).forEach(c=>{c.mrr=c.monthly[curM]||Math.max(...c.monthly)});
    const clients=Object.values(cmap).sort((a,b)=>(a.startDate||0)-(b.startDate||0));
    
    const totals=new Array(12).fill(0);
    clients.forEach(c=>c.monthly.forEach((v,i)=>totals[i]+=v));
    
    let prevDec=0;
    const pdS=new Date(year-1, 11, 1);
    const pdE=new Date(year-1, 11, 31, 23, 59, 59);
    Object.values(allC).forEach(contracts=>{
        const paid=contracts.filter(ct=>ct.musd>0);
        if(!paid.length) return;
        const act=paid.filter(ct=>ct.st<=pdE && ct.endD>=pdS);
        if(!act.length) return;
        
        let maxMrr = 0;
        for(let d=1; d<=31; d++) {
            const checkDt = new Date(year-1, 11, d, 23, 59, 59);
            let dayMrr = 0;
            for(let i=0; i<act.length; i++) {
                const ct = act[i];
                if(ct.st <= checkDt && ct.endD >= checkDt) {
                    dayMrr += ct.musd;
                }
            }
            if(dayMrr > maxMrr) maxMrr = dayMrr;
        }
        prevDec += maxMrr;
    });
    
    const mom=totals.map((v,i)=>{const prev=i===0?prevDec:totals[i-1];return prev?((v-prev)/prev*100):0});
    const cSets=Array.from({length:12},()=>new Set());
    clients.forEach(c=>c.monthly.forEach((v,i)=>{if(v>0)cSets[i].add(c.name)}));
    const cpm=cSets.map(s=>s.size);
    const prevDecCl=new Set();clients.forEach(c=>{const pAct=(allC[c.name]||[]).filter(ct=>ct.musd>0&&ct.st<=pdE&&ct.endD>=pdE);if(pAct.length)prevDecCl.add(c.name)});
    const newPM=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n)).length});
    const churnPM=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...prev].filter(n=>!s.has(n)).length});
    const newNames=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n))});
    const churnNames=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...prev].filter(n=>!s.has(n))});
    const everBefore=Array.from({length:12},()=>new Set());const preYear=new Set();const yrStart=new Date(year,0,1);
    Object.entries(allC).forEach(([name,cts])=>{if(cts.some(ct=>ct.musd>0&&ct.endD<yrStart))preYear.add(name)});
    prevDecCl.forEach(n=>preYear.add(n));
    for(let m=0;m<12;m++){preYear.forEach(n=>everBefore[m].add(n));for(let j=0;j<m;j++)cSets[j].forEach(n=>everBefore[m].add(n))}
    const rechurnPM=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n)).filter(n=>everBefore[i].has(n)).length});
    const rechurnNames=cSets.map((s,i)=>{const prev=i===0?prevDecCl:cSets[i-1];return[...s].filter(n=>!prev.has(n)).filter(n=>everBefore[i].has(n))});
    const mrrChange=totals.map((v,i)=>{const prev=i===0?prevDec:totals[i-1];return v-prev});
    return{clients,totals,mom,year,cpm,newPM,churnPM,newNames,churnNames,rechurnPM,rechurnNames,mrrChange,prevDec};
  });
}

// === CUM EXPECTED ===
function calcCumExpected(year){
  return cached('cumExp_'+year,()=>{
    const result={};const allCts={};
    S.rows.forEach(r=>{if(!r.Client||!r.sanasi)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st||!r._mUSD||r._mUSD<=0)return;const endD=en||new Date(st.getTime()+(r._dur||12)*30.44*24*3600*1000);const c=r.Client;if(!allCts[c])allCts[c]=[];allCts[c].push({musd:r._mUSD,st,endD,isQ:false})});
    S.qRows.forEach(r=>{if(!r.Client||!r.sanasi)return;const musd=pn(r['Oylik USD']);if(!musd)return;const st=pd(r.sanasi),en=pd(r['amal qilishi']);if(!st)return;const endD=en||new Date(st.getTime()+(parseFloat(r['muddati (oy)'])||12)*30.44*24*3600*1000);const c=r.Client;if(!allCts[c])allCts[c]=[];allCts[c].push({musd,st,endD,isQ:true})});
    Object.entries(allCts).forEach(([name,cts])=>{
      const minSt=cts.reduce((a,c)=>c.st<a?c.st:a,cts[0].st);
      let cumTotal=0,preYear=0;const cum12=new Array(12).fill(0);
      for(let y=minSt.getFullYear();y<=year;y++){
        const m0=(y===minSt.getFullYear()?minSt.getMonth():0);
        for(let m=m0;m<=11;m++){
          const mS=new Date(y,m,1),mE=new Date(y,m+1,0);const dim=mE.getDate();let monthExp=0;
          cts.forEach(ct=>{if(ct.st>mE||ct.endD<mS)return;const isFirst=(ct.st>=mS&&ct.st<=mE),isLast=(ct.endD>=mS&&ct.endD<=mE);
            if(isFirst&&isLast){monthExp+=ct.musd*Math.max(1,Math.round((ct.endD-ct.st)/864e5)+1)/dim}
            else if(isFirst){monthExp+=ct.musd*Math.max(1,Math.round((mE-ct.st)/864e5)+1)/dim}
            else if(isLast&&ct.isQ){monthExp+=ct.musd*Math.max(1,ct.endD.getDate())/dim}
            else{monthExp+=ct.musd}
          });
          cumTotal+=monthExp;if(y===year)cum12[m]=Math.round(cumTotal);
        }
        if(y===year-1)preYear=Math.round(cumTotal);
      }
      result[name]={cum:cum12,preYear};
    });
    return result;
  });
}

// === RENDER ===
let _rdT;function render(){clearTimeout(_rdT);_rdT=setTimeout(_render,0)}
let _lastSec=null;
function _render(){
  if(!S.rows.length){showWelcome();return}
  const ae=document.activeElement;const isInput=ae&&ae.tagName==='INPUT'&&ae.type==='text';
  const sel=isInput?{s:ae.selectionStart,e:ae.selectionEnd,sec:S.sec,ph:ae.placeholder}:null;
  const f={dashboard:rD,contracts:rC,mrrtable:rMRR,managers:rM,clients:rCl,topmrr:rT,debts:rDebt};
  // Save scroll positions before re-render
  const tbl=document.querySelector('.tbl-scroll');
  const savedTop=tbl?tbl.scrollTop:0;
  const savedLeft=tbl?tbl.scrollLeft:0;
  const root=document.getElementById('root');
  const secChanged=_lastSec!==S.sec;
  _lastSec=S.sec;
  const html=(f[S.sec]||rD)();
  root.innerHTML=secChanged?'<div class="page-enter">'+html+'</div>':html;
  iC();
  // Restore scroll positions after re-render (prevents jitter)
  if(!secChanged&&(savedTop>0||savedLeft>0)){
    requestAnimationFrame(()=>{const t=document.querySelector('.tbl-scroll');if(t){t.scrollTop=savedTop;t.scrollLeft=savedLeft;}});
  }
  if(S.sec==='dashboard')requestAnimationFrame(animateNumbers);
  if(sel&&sel.sec===S.sec){const inp=document.querySelector('input[placeholder="'+sel.ph+'"]');if(inp){inp.focus();inp.setSelectionRange(sel.s,sel.e)}}
}

function animateNumbers(){
  document.querySelectorAll('.anim-val').forEach(el=>{
    const end=parseFloat(el.dataset.val)||0;
    const isFmt=el.dataset.fmt==='1';
    const isSign=el.dataset.sign==='1';
    if(end===0){el.textContent=isFmt?fmt(0):'0';return}
    const dur=800,st=performance.now();
    const update=t=>{
      let p=(t-st)/dur;if(p>1)p=1;
      const cur=end*(p===1?1:1-Math.pow(2,-10*p));
      let txt=isFmt?((isSign&&cur>0?'+':'')+fmt(Math.round(cur))):Math.round(cur).toString();
      el.textContent=txt;
      if(p<1)requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

// === PAGINATION ===
function pag(p,t,c,n,k){if(t<=1)return'';return`<div class="pager"><span>${p*n+1}–${Math.min((p+1)*n,c)} / ${c}</span><div class="pager-btns"><button class="pg" onclick="S.${k}=${p-1};render()"${p===0?' disabled':''}>←</button>${Array.from({length:Math.min(t,7)},(_,i)=>{let x=i;if(t>7){if(p<4)x=i;else if(p>t-5)x=t-7+i;else x=p-3+i}return`<button class="pg${x===p?' on':''}" onclick="S.${k}=${x};render()">${x+1}</button>`}).join('')}<button class="pg" onclick="S.${k}=${p+1};render()"${p>=t-1?' disabled':''}>→</button></div></div>`}

// === DEBOUNCED SEARCH HANDLERS ===
const _debouncedSearch=debounce(()=>{clearCache();render()},250);
function onSearch(field,val){S[field]=val;S.cP=0;S.clP=0;_debouncedSearch()}

// === NAV ===
function initNav(){
  document.querySelectorAll('.nav-item').forEach(el=>el.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    el.classList.add('active');S.sec=el.dataset.sec;clearCache();render();closeSidebar();
  }));
}
