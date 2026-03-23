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
    });
    const {all,qAll}=buildContracts();const totals=[],cpmArr=[];
    const newPerPt=[],churnPerPt=[],newMrrArr=[],churnMrrArr=[],expMrrArr=[],conMrrArr=[];
    
    function getBinMax(start, end) {
        const cMap = {};
        const process = cts => { cts.forEach(ct => { if(ct.musd<=0) return; if(ct.st<=end && ct.endD>=start){if(!cMap[ct.client])cMap[ct.client]=[];cMap[ct.client].push(ct)} }) };
        process(all); process(qAll);
        
        let total = 0; const active = new Set(); const maxVals = {};
        Object.entries(cMap).forEach(([client, cts]) => {
            let maxM = 0;
            const days = Math.round((end-start)/864e5)+1;
            for(let i=0; i<Math.min(31, days); i++) {
                const checkDt = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i, 23, 59, 59);
                let dayM = 0;
                cts.forEach(ct => { if(ct.st<=checkDt && ct.endD>=checkDt) dayM += ct.musd; });
                if(dayM > maxM) maxM = dayM;
            }
            if(maxM > 0) { active.add(client); maxVals[client] = maxM; total += maxM; }
        });
        return { total, active, maxVals };
    }
    
    const beforeStart = gran==='day' ? new Date(from.getFullYear(), from.getMonth(), from.getDate()-1) : new Date(from.getFullYear(), from.getMonth()-1, 1);
    const beforeEnd = gran==='day' ? new Date(from.getFullYear(), from.getMonth(), from.getDate()-1, 23, 59, 59) : new Date(from.getFullYear(), from.getMonth(), 0, 23, 59, 59);
    const beforeSnap = getBinMax(beforeStart, beforeEnd);
    
    const snaps = points.map(pt => {
        let bS, bE;
        if(gran==='day') { bS=new Date(pt.getFullYear(), pt.getMonth(), pt.getDate()); bE=new Date(pt.getFullYear(), pt.getMonth(), pt.getDate(), 23, 59, 59); }
        else { bS=new Date(pt.getFullYear(), pt.getMonth(), 1); bE=new Date(pt.getFullYear(), pt.getMonth()+1, 0, 23, 59, 59); }
        if(bE>to) bE=new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
        return getBinMax(bS, bE);
    });
    
    snaps.forEach(s => { totals.push(Math.round(s.total)); cpmArr.push(s.active.size); });
    
    for(let i=0; i<snaps.length; i++) {
      const prev=i===0?beforeSnap:snaps[i-1];
      const cur=snaps[i];
      
      const newOnes=[...cur.active].filter(n=>!prev.active.has(n));
      const gone=[...prev.active].filter(n=>!cur.active.has(n));
      const retained=[...cur.active].filter(n=>prev.active.has(n));
      
      newPerPt.push(newOnes.length);
      churnPerPt.push(gone.length);
      
      let newM=0, churnM=0, expM=0, conM=0;
      
      newOnes.forEach(n=> { newM += cur.maxVals[n] });
      gone.forEach(n=> { churnM += prev.maxVals[n] });
      retained.forEach(n=>{
         const curM = cur.maxVals[n]||0;
         const prevM = prev.maxVals[n]||0;
         const diff = curM - prevM;
         if(diff > 0) expM += diff;
         else if(diff < 0) conM += Math.abs(diff);
      });
      
      newMrrArr.push(newM);
      churnMrrArr.push(churnM);
      expMrrArr.push(expM);
      conMrrArr.push(conM);
    }

    // === EVENT-BASED DELTA METRICS ===
    const byClient={};
    all.forEach(ct=>{if(!byClient[ct.client])byClient[ct.client]=[];byClient[ct.client].push(ct)});
    qAll.forEach(ct=>{if(!byClient[ct.client])byClient[ct.client]=[];byClient[ct.client].push({...ct,isQ:true})});

    const newClients=[],churnClients=[],expClients=[];
    let startMRRsum = 0;
    let exactBaseClients = 0;

    // Chegara nuqtalarini tayyorlaymiz
    const dayBefore = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
    const firstDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const lastDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const dayAfter = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);

    Object.keys(byClient).forEach(name=>{
      const cts = byClient[name].filter(c=>c.musd>0);
      if(!cts.length)return;
      
      const isActive = (date) => cts.some(c => c.st <= date && c.endD >= date);
      
      // bsl: Mijoz davr boshida biz bilan ulanib kiryapti. (uzilishsiz)
      const bsl = isActive(dayBefore) && isActive(firstDay);
      
      // out: Mijoz davr oxiridan kegin ham uzilishsiz davom etyapti.
      const out = isActive(lastDay) && isActive(dayAfter);
      
      // dur: Mijoz shu davrning o'zida qachondir aktiv bo'lgan.
      const dur = cts.some(c => c.st <= to && c.endD >= from);
      
      if(!dur && !bsl && !out) return; 
      
      const activeIn = cts.filter(c => c.st <= firstDay && c.endD >= firstDay);
      const activeOut = cts.filter(c => c.st <= lastDay && c.endD >= lastDay);
      const activeDur = cts.filter(c => c.st <= to && c.endD >= from);
      
      const mrrS = bsl ? activeIn.reduce((s,c)=>s+c.musd,0) : 0;
      const mrrE = out ? activeOut.reduce((s,c)=>s+c.musd,0) : 0;
      
      if(bsl){
         startMRRsum += mrrS;
         exactBaseClients++;
      }
      
      // MUKAMMAL SIMMETRIYA:
      const isNew = dur && !bsl;   // Davrda bor, lekin uzilishsiz kirmagan
      const isChurn = dur && !out; // Davrda bor, lekin uzilishsiz chiqmadi
      const isRetained = bsl && out; // Davr boshida ham, oxirida ham bor

      
      const mgr = (cts[cts.length-1]||{}).mgr||'';
      
      if(isNew){
        const startedInPeriod=activeDur.filter(c=>c.st>=from&&c.st<=to).sort((a,b)=>b.st-a.st);
        const ct = startedInPeriod[0] || activeDur[0];
        const firstEver = cts.reduce((a,c)=>c.st<a.st?c:a,cts[0]);
        const hadBefore = firstEver.st < from;
        const wasActiveJustBefore = cts.some(c=>c.endD>=new Date(from.getTime()-2*864e5)&&c.st<from);
        const isRechurn = hadBefore && !wasActiveJustBefore;
        
        newClients.push({name,date:ct.st,mgr:ct.mgr||mgr,mrr:out?Math.round(mrrE):Math.round(ct.musd),isRechurn,hudud:ct.hudud||'',dur:ct.dur||0,tUSD:ct.tUSD||0,sUSD:ct.sUSD||0,izoh:ct.izoh||'',raqami:ct.raqami||''});
      }
      
      if(isChurn){
        const endedInPeriod=activeDur.filter(c=>c.endD<=to).sort((a,b)=>b.endD-a.endD);
        const ct = endedInPeriod[0] || activeDur[0];
        churnClients.push({name,date:ct.endD,mgr:ct.mgr||mgr,mrr:Math.round(bsl?mrrS:ct.musd),izoh:ct.izoh||''});
      }
      
      if(isRetained && Math.abs(mrrE-mrrS)>1){
        expClients.push({name,mrrStart:Math.round(mrrS),mrrEnd:Math.round(mrrE),delta:Math.round(mrrE-mrrS),mgr});
      }
    });

    newClients.sort((a,b)=>b.date-a.date);churnClients.sort((a,b)=>b.date-a.date);
    expClients.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    const baseTotal=Math.round(startMRRsum);
    return{labels,totals,cpmArr,newPerPt,churnPerPt,addedMRR:newMrrArr,lostMRR:churnMrrArr,expMRR:expMrrArr,conMRR:conMrrArr,newClients,churnClients,expClients,gran,points,baseMRR:baseTotal,baseClients:exactBaseClients};
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
function _render(){
  if(!S.rows.length){showWelcome();return}
  const ae=document.activeElement;const isInput=ae&&ae.tagName==='INPUT'&&ae.type==='text';
  const sel=isInput?{s:ae.selectionStart,e:ae.selectionEnd,sec:S.sec,ph:ae.placeholder}:null;
  const f={dashboard:rD,contracts:rC,mrrtable:rMRR,managers:rM,clients:rCl,topmrr:rT,debts:rDebt};
  const root=document.getElementById('root');
  root.innerHTML='<div class="page-enter">'+(f[S.sec]||rD)()+'</div>';
  iC();
  if(sel&&sel.sec===S.sec){const inp=document.querySelector('input[placeholder="'+sel.ph+'"]');if(inp){inp.focus();inp.setSelectionRange(sel.s,sel.e)}}
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
