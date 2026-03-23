/* ============================================================
   UYSOT — Pages: Dashboard, Contracts, MRR, Managers, Clients, TopMRR, Debts
   ============================================================ */

// === DASHBOARD ===
function rD(){
const dr=dashRange();
const {labels,totals,cpmArr,newPerPt,churnPerPt,addedMRR,lostMRR,newClients,churnClients,expClients,baseMRR,baseClients}=dr;
const tot=S.rows.length,clients=[...new Set(S.rows.map(r=>r.Client).filter(Boolean))];
const curMRR=totals[totals.length-1]||0,startMRR=baseMRR||0;
const mrrDelta=curMRR-startMRR,mrrPct=startMRR?Math.round(mrrDelta/startMRR*100):0;
const totalNew=newClients.length,totalRechurn=newClients.filter(c=>c.isRechurn).length,totalChurn=churnClients.length;
const curClients=cpmArr[cpmArr.length-1]||0,startClients=baseClients||0,clientDelta=curClients-startClients;
const mrrFromNew=newClients.reduce((s,c)=>s+c.mrr,0),mrrFromChurn=churnClients.reduce((s,c)=>s+c.mrr,0);
const mrrExpansion=expClients.reduce((s,c)=>s+c.delta,0);
const mrrFromRechurn=newClients.filter(c=>c.isRechurn).reduce((s,c)=>s+c.mrr,0);
const expColor=mrrExpansion>=0?'#0e7c7b':'#a36207';
const periodLabel=labels.length>1?labels[0]+'–'+labels[labels.length-1]:labels[0]||'';
const pre=S.dashPre||'y';const isCust=pre==='c';
const presets=[{k:'w',l:'Hafta'},{k:'m',l:'Oy'},{k:'q',l:'Chorak'},{k:'y',l:'Yil'},{k:'30',l:'30k'},{k:'90',l:'90k'},{k:'25',l:'2025'},{k:'24',l:'2024'},{k:'c',l:'Oraliq'}];
return`<div class="page-header"><div><div class="page-title">Dashboard</div><div class="page-sub">${tot} ta shartnoma, ${clients.length} ta mijoz</div></div>
<div style="display:flex;align-items:center;gap:6px"><button class="btn" onclick="showReportModal()" title="PDF hisobot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button><button class="btn" onclick="if(S.config)loadFromConfig(S.config);else showConfig()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg></button></div></div>
<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
${presets.map(p=>`<button class="btn${pre===p.k?' btn-primary':''}" style="padding:5px 12px;font-size:11.5px" onclick="${p.k==='c'?"S.dashPre='c';render()":"applyPreset('"+p.k+"')"}">${p.l}</button>`).join('')}
${isCust?`<div style="display:flex;gap:4px;align-items:center;margin-left:4px">
<input type="date" class="flt" style="font-size:11px;padding:5px" value="${S.dashFrom.toISOString().slice(0,10)}" onchange="S.dashFrom=new Date(this.value);clearCache();render()">
<span style="color:var(--text3)">→</span>
<input type="date" class="flt" style="font-size:11px;padding:5px" value="${S.dashTo.toISOString().slice(0,10)}" onchange="S.dashTo=new Date(this.value);clearCache();render()">
</div>`:''}
<span style="font-size:10.5px;color:var(--text3);margin-left:4px">${dr.gran==='day'?'kunlik':'oylik'}</span>
</div>
<div class="metrics"><div class="metric c1"><div class="metric-lbl">Aktiv mijozlar</div><div class="metric-val">${curClients}</div><div class="metric-foot"><span class="${clientDelta>=0?'up':'dn'}">${clientDelta>0?'+':''}${clientDelta}</span> ${periodLabel}</div></div>
<div class="metric c2"><div class="metric-lbl">Yangi qo'shilgan</div><div class="metric-val">${totalNew}</div><div class="metric-foot"><span class="up">+${totalNew}</span> ${periodLabel}${totalRechurn?' · <span style="color:var(--amber)">qayta: '+totalRechurn+'</span>':''}</div></div>
<div class="metric c4"><div class="metric-lbl">Chiqib ketgan</div><div class="metric-val">${totalChurn}</div><div class="metric-foot"><span class="dn">${totalChurn>0?'-':''}${totalChurn}</span> ${periodLabel}</div></div>
<div class="metric c3"><div class="metric-lbl">MRR</div><div class="metric-val">${fmt(curMRR)}</div><div class="metric-foot"><span class="${mrrDelta>=0?'up':'dn'}">${mrrDelta>0?'+':''}${fmt(mrrDelta)} (${mrrPct>0?'+':''}${mrrPct}%)</span></div></div>
<div class="metric c5"><div class="metric-lbl">MRR o'zgarish</div><div class="metric-val">${mrrDelta>0?'+':''}${fmt(mrrDelta)}</div><div class="metric-foot" style="display:flex;flex-direction:column;gap:1px;line-height:1.4"><span class="up">yangi: +${fmt(mrrFromNew)}${totalRechurn?' (Q:'+fmt(mrrFromRechurn)+')':''}</span><span class="dn">churn: -${fmt(mrrFromChurn)}</span><span style="color:${expColor}">keng: ${mrrExpansion>0?'+':''}${fmt(mrrExpansion)}</span></div></div></div>

<div class="grid-2" style="margin-top:20px;margin-bottom:20px">
<div class="card"><div class="card-head" style="margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;font-size:11px;color:var(--text3);font-weight:600">TOTAL MRR TREND</div><div class="card-body"><div class="chart-wrap" style="height:320px"><canvas id="chTrend"></canvas></div></div></div>
<div class="card"><div class="card-head" style="margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;font-size:11px;color:var(--text3);font-weight:600">MRR COMPONENTS</div><div class="card-body"><div class="chart-wrap" style="height:320px"><canvas id="chComponents"></canvas></div></div></div>
</div>

<div class="card" style="margin-top:14px"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--green)"></span>Yangi mijozlar (${totalNew}) <span style="color:var(--green);font-weight:600">+${fmt(mrrFromNew)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:340px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="col-hide">Menejer</th><th class="col-hide">Hudud</th><th class="col-hide">Muddat</th><th class="col-hide text-r">Tadbiq</th><th class="text-r">MRR</th><th class="col-hide text-r">Jami</th><th class="col-hide">Izoh</th></tr></thead><tbody>${newClients.length?newClients.map(c=>{const dur=c.dur?c.dur+' oy':'—';return'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:600;font-size:12px">'+c.name+(c.isRechurn?' <span class="badge b-amber" style="font-size:8px;padding:1px 4px">Q</span>':'')+'</td><td class="col-hide" style="font-size:11px;color:var(--text2)">'+(c.mgr||'—')+'</td><td class="col-hide" style="font-size:11px;color:var(--text2)">'+(c.hudud||'—')+'</td><td class="col-hide mono" style="font-size:11px">'+dur+'</td><td class="col-hide text-r mono" style="font-size:11px">'+(c.tUSD?fmt(c.tUSD):'—')+'</td><td class="text-r mono" style="color:var(--green);font-weight:600">+'+fmt(c.mrr)+'</td><td class="col-hide text-r mono" style="font-size:11px">'+(c.sUSD?fmt(c.sUSD):'—')+'</td><td class="col-hide" style="font-size:10.5px;color:var(--text3);max-width:140px;overflow:hidden;text-overflow:ellipsis">'+(c.izoh||'—')+'</td></tr>'}).join(''):'<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>

<div class="dash-churn-exp" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--red)"></span>Churn (${totalChurn}) <span style="color:var(--red);font-weight:600">-${fmt(mrrFromChurn)}</span></span></div><div class="card-body dash-new-full" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Sana</th><th>Mijoz</th><th class="col-hide">Menejer</th><th class="col-hide">Izoh</th><th class="text-r">MRR</th></tr></thead><tbody>${churnClients.length?churnClients.map(c=>'<tr><td class="mono" style="font-size:10.5px;color:var(--text3);white-space:nowrap">'+fmtD(c.date)+'</td><td style="font-weight:500;font-size:12px">'+c.name+'</td><td class="col-hide" style="font-size:11px;color:var(--text2)">'+(c.mgr||'—')+'</td><td class="col-hide" style="font-size:10.5px;color:var(--text3);max-width:120px;overflow:hidden;text-overflow:ellipsis">'+(c.izoh||'—')+'</td><td class="text-r mono" style="color:var(--red);font-weight:600">-'+fmt(c.mrr)+'</td></tr>').join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>
<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--teal)"></span>Kengayish (${expClients.length}) <span style="color:${expColor};font-weight:600">${mrrExpansion>0?'+':''}${fmt(mrrExpansion)}</span></span></div><div class="card-body" style="padding:0;max-height:300px;overflow-y:auto"><table><thead><tr><th>Mijoz</th><th class="text-r">Oldin</th><th class="text-r">Hozir</th><th class="text-r">Farq</th></tr></thead><tbody>${expClients.length?expClients.map(c=>'<tr><td style="font-weight:500;font-size:12px">'+c.name+'</td><td class="text-r mono" style="font-size:11px;color:var(--text3)">'+fmt(c.mrrStart)+'</td><td class="text-r mono" style="font-size:11px">'+fmt(c.mrrEnd)+'</td><td class="text-r mono" style="font-size:11px;font-weight:600;color:'+(c.delta>0?'var(--green)':'var(--red)')+'">'+( c.delta>0?'+':'')+fmt(c.delta)+'</td></tr>').join(''):'<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>
</div>`}

// === CONTRACTS ===
function rC(){
const pm=calcPayments();const qm={};
S.qRows.forEach(r=>{const c=r.Client?.trim(),sh=r.raqami?.trim();if(!c||!sh)return;const k=c+'|'+sh;qm[k]=(qm[k]||0)+pn(r['sum USD'])});
let d=[...S.rows];
if(S.cQ){const q=S.cQ.toLowerCase();d=d.filter(r=>(r.Client||'').toLowerCase().includes(q)||(r['Firma nomi']||'').toLowerCase().includes(q)||(r.INN||'').includes(q))}
if(S.cS)d=d.filter(r=>sc(r.status)===S.cS);if(S.cM)d=d.filter(r=>r.Manager===S.cM);if(S.cR)d=d.filter(r=>r.Hudud===S.cR);
const t=d.length,pg=Math.ceil(t/S.cN),sl=d.slice(S.cP*S.cN,(S.cP+1)*S.cN);
const so=[{v:'',l:'Barcha'},{v:'A',l:'Aktiv'},{v:'D',l:'Bajarildi'},{v:'Q',l:'Eski qarz'},{v:'P',l:'Muammo'},{v:'O',l:'Ortiqcha'},{v:'X',l:'Bekor'}];
const hasPay=S.payRows.length||S.y2024Rows.length||S.perevodRows.length;
return`<div class="page-header"><div><div class="page-title">Shartnomalar</div><div class="page-sub">${t} ta</div></div></div>
<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, firma, INN..." value="${S.cQ}" oninput="onSearch('cQ',this.value)"></div>
<select class="flt" onchange="S.cS=this.value;S.cP=0;clearCache();render()">${so.map(o=>`<option value="${o.v}"${S.cS===o.v?' selected':''}>${o.l}</option>`).join('')}</select>
<select class="flt" onchange="S.cM=this.value;S.cP=0;clearCache();render()"><option value="">Barcha menejerlar</option>${uq('Manager').map(m=>`<option value="${m}"${S.cM===m?' selected':''}>${m}</option>`).join('')}</select>
<select class="flt" onchange="S.cR=this.value;S.cP=0;clearCache();render()"><option value="">Barcha hududlar</option>${uq('Hudud').map(r=>`<option value="${r}"${S.cR===r?' selected':''}>${r}</option>`).join('')}</select></div>
<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>№</th><th>Mijoz</th><th>Firma</th><th>Hudud</th><th>Menejer</th><th>Sana</th><th>Tugash</th><th class="text-r">Oylik $</th><th class="text-r">Jami $</th>${hasPay?'<th class="text-r">To\'langan</th><th class="text-r">Qarz</th>':''}<th>Status</th></tr></thead><tbody>${sl.map(r=>{
const k=r.Client+'|'+r.raqami;const qExtra=qm[k]||0;const totalSum=r._sUSD+qExtra;
const p=pm[k]||{total:0};const qarz=Math.round(totalSum-p.total)||0;const qarzD=Math.abs(qarz)<=1?0:qarz;
const qC=qarzD>0?'var(--red)':qarzD<0?'var(--amber)':'var(--green)';const qW=qarzD>0?'600':'400';
return`<tr><td class="mono" style="font-size:10px;color:var(--text3)">${r.raqami||'—'}</td><td style="font-weight:600">${r.Client||'—'}</td><td style="color:var(--text2);font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${r['Firma nomi']||'—'}</td><td style="font-size:11px">${r.Hudud||'—'}</td><td style="font-size:12px">${r.Manager||'—'}</td><td class="mono" style="font-size:10.5px">${r.sanasi||'—'}</td><td class="mono" style="font-size:10.5px">${r['amal qilishi']||'—'}</td><td class="text-r mono">${fmt(r._mUSD)}</td><td class="text-r mono">${fmt(totalSum)}${qExtra?'<span style="font-size:9px;color:var(--teal)"> +'+fmt(qExtra)+'</span>':''}</td>${hasPay?'<td class="text-r mono" style="color:var(--green)">'+(p.total?fmt(p.total):'—')+'</td><td class="text-r mono" style="color:'+qC+';font-weight:'+qW+'">'+(totalSum?fmt(qarzD):'—')+'</td>':''}<td>${sb(r.status)}</td></tr>`}).join('')}</tbody></table></div></div>${pag(S.cP,pg,t,S.cN,'cP')}`}

// === MRR TABLE ===
function rMRR(){
const yr=S.mrrYear||2026;const d=mrrData(yr);const cumExp=calcCumExpected(yr);const clPay=calcClientPayments();
const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const cc=S.mrrCols;let filtered=[...d.clients];
if(S.mrrQ){const q=S.mrrQ.toLowerCase();filtered=filtered.filter(c=>c.name.toLowerCase().includes(q)||c.mgr.toLowerCase().includes(q)||(c.hudud||'').toLowerCase().includes(q))}
const colDefs=[{k:'mgr',l:'Manager'},{k:'hudud',l:'Hudud'},{k:'mrr',l:'MRR'},{k:'deal',l:'Deal boshi'},{k:'end',l:'Deal tugashi'}];
const setPanel=S.mrrSet?`<div class="mrr-set">${colDefs.map(c=>`<label><input type="checkbox" ${cc[c.k]?'checked':''} onchange="S.mrrCols.${c.k}=this.checked;render()">${c.l}</label>`).join('')}</div>`:'';
const exCols=(cc.mgr?1:0)+(cc.hudud?1:0)+(cc.mrr?1:0)+(cc.deal?1:0)+(cc.end?1:0);
return`<div class="page-header"><div><div class="page-title">MRR jadval</div><div class="page-sub">${yr} — ${d.clients.length} ta mijoz${S.qRows.length?' · '+S.qRows.length+' qo\'shimcha':''}</div></div>
<div style="display:flex;gap:6px;align-items:center">
<select class="flt" onchange="S.mrrYear=+this.value;clearCache();render()" style="font-weight:600;font-size:13px">
${[2024,2025,2026,2027].map(y=>`<option value="${y}"${yr===y?' selected':''}>${y}</option>`).join('')}
</select>
<div style="position:relative"><button class="btn" onclick="S.mrrSet=!S.mrrSet;render()" title="Ustunlar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="3"/></svg></button>${setPanel}</div>
</div></div>
<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz, menejer, hudud..." value="${S.mrrQ||''}" oninput="onSearch('mrrQ',this.value)"></div>
<div style="display:flex;gap:12px;font-size:11px;color:var(--text3);align-items:center"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgba(17,122,82,0.15);vertical-align:middle"></span> to'langan <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgba(220,170,40,0.2);vertical-align:middle;margin-left:8px"></span> qisman</div></div>
<div class="tbl-wrap"><div class="tbl-scroll" style="max-height:calc(100vh - 210px)">
<table class="mrr-tbl"><thead><tr>
<th class="sticky-col col-name">Client</th>
${cc.mgr?`<th style="text-align:left;min-width:80px${!cc.hudud&&!cc.mrr&&!cc.deal&&!cc.end?';border-right:2px solid var(--border)':''}">Manager</th>`:''}
${cc.hudud?`<th style="text-align:left;min-width:70px${!cc.mrr&&!cc.deal&&!cc.end?';border-right:2px solid var(--border)':''}">Hudud</th>`:''}
${cc.mrr?`<th style="text-align:right;min-width:60px${!cc.deal&&!cc.end?';border-right:2px solid var(--border)':''}">MRR</th>`:''}
${cc.deal?`<th style="text-align:center;min-width:74px${!cc.end?';border-right:2px solid var(--border)':''}">Boshi</th>`:''}
${cc.end?'<th style="text-align:center;min-width:74px;border-right:2px solid var(--border)">Tugash</th>':''}
${mos.map(m=>`<th class="mcell">${m}</th>`).join('')}
</tr></thead><tbody>
<tr class="summary-row row-mom"><td class="sticky-col col-name" style="font-style:italic;color:var(--text3);font-size:10px">MoM %</td>${Array(exCols).fill('<td style="border-bottom:2px solid var(--border)"></td>').join('')}${d.mom.map(v=>{const c=v>0?'var(--green)':v<0?'var(--red)':'var(--text3)';return`<td class="mcell" style="color:${c};font-style:italic;font-size:10px">${v?(v>0?'+':'')+v.toFixed(1)+'%':'—'}</td>`}).join('')}</tr>
<tr class="summary-row row-total"><td class="sticky-col col-name" style="font-weight:700;background:var(--bg3)">JAMI</td>${Array(exCols).fill('<td style="background:var(--bg3);border-bottom:2px solid var(--border)"></td>').join('')}${d.totals.map(v=>`<td class="mcell" style="background:var(--bg3);font-weight:700">${v?fmt(v):'—'}</td>`).join('')}</tr>
${filtered.map(c=>{
const ce=cumExp[c.name];const paid=clPay[c.name]||0;
return`<tr>
<td class="sticky-col col-name">${c.name}</td>
${cc.mgr?`<td style="font-size:10.5px;color:var(--text2)${!cc.hudud&&!cc.mrr&&!cc.deal&&!cc.end?';border-right:2px solid var(--border)':''}">${c.mgr||'—'}</td>`:''}
${cc.hudud?`<td style="font-size:10.5px;color:var(--text2)${!cc.mrr&&!cc.deal&&!cc.end?';border-right:2px solid var(--border)':''}">${c.hudud||'—'}</td>`:''}
${cc.mrr?`<td class="mono" style="text-align:right;font-weight:600;font-size:11px${!cc.deal&&!cc.end?';border-right:2px solid var(--border)':''}">${c.mrr?fmt(c.mrr):'—'}</td>`:''}
${cc.deal?`<td class="mono" style="text-align:center;font-size:10px;color:var(--text3)${!cc.end?';border-right:2px solid var(--border)':''}">${c.dealStart||'—'}</td>`:''}
${cc.end?`<td class="mono" style="text-align:center;font-size:10px;color:var(--text3);border-right:2px solid var(--border)">${c.dealEnd||'—'}</td>`:''}
${c.monthly.map((v,m)=>{
if(!v)return'<td class="mcell mcell-0">—</td>';
let cls='mcell',tip='';
if(ce){const cur=ce.cum[m]||0;const prev=m>0?(ce.cum[m-1]||0):ce.preYear;
if(cur>0){const remaining=Math.round(cur-paid);const paidThisMonth=Math.round(paid-prev);
if(remaining<=1){cls='mcell mcell-g'}else if(paidThisMonth>0){cls='mcell mcell-y';tip=` data-tip="to'landi: ${fmt(paidThisMonth)} · qoldi: ${fmt(remaining)}"`}}}
return`<td class="${cls}"${tip}>${fmt(v)}</td>`}).join('')}
</tr>`}).join('')}
</tbody></table></div></div>`}

// === MANAGERS ===
function rM(){
const m={};S.rows.forEach(r=>{const n=r.Manager||'Tayinlanmagan';if(!m[n])m[n]={c:0,mrr:0,s:0,a:0,q:0,cl:new Set()};m[n].c++;m[n].mrr+=r._mUSD;m[n].s+=r._sUSD;if(r.Client)m[n].cl.add(r.Client);if(sc(r.status)==='A')m[n].a++;if(sc(r.status)==='Q')m[n].q++});
const mg=Object.entries(m).map(([n,d])=>({n,...d,cl:d.cl.size})).sort((a,b)=>b.mrr-a.mrr);
const tM=mg.reduce((s,x)=>s+x.mrr,0);
const co=['#1746a2','#117a52','#c42b1c','#6941b8','#a36207','#0e7c7b','#d4537e','#5a5955','#854f0b','#993556'];
return`<div class="page-header"><div><div class="page-title">Menejerlar</div><div class="page-sub">${mg.length} ta menejer</div></div></div>
<div class="grid-2"><div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent)"></span>MRR ($)</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chMM"></canvas></div></div></div>
<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--green)"></span>Shartnomalar soni</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chMC"></canvas></div></div></div></div>
<div class="tbl-wrap"><table><thead><tr><th>Menejer</th><th class="text-r">Shartnomalar</th><th class="text-r">Mijozlar</th><th class="text-r">Aktiv</th><th class="text-r">Qarz</th><th class="text-r">MRR ($)</th><th class="text-r">O'rtacha</th><th>Ulush</th></tr></thead><tbody>${mg.map((x,i)=>{const p=tM?Math.round(x.mrr/tM*100):0;const av=x.cl?Math.round(x.mrr/x.cl):0;return`<tr><td style="font-weight:600"><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${co[i%co.length]};margin-right:7px;vertical-align:middle"></span>${x.n}</td><td class="text-r mono">${x.c}</td><td class="text-r mono">${x.cl}</td><td class="text-r"><span class="badge b-green">${x.a}</span></td><td class="text-r">${x.q?`<span class="badge b-red">${x.q}</span>`:'—'}</td><td class="text-r mono" style="font-weight:600">${fmt(x.mrr)}</td><td class="text-r mono">${fmt(av)}</td><td><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${p}%;background:${co[i%co.length]};border-radius:3px;transition:width .5s ease"></div></div><span class="mono" style="font-size:10px;color:var(--text3);min-width:28px;text-align:right">${p}%</span></div></td></tr>`}).join('')}</tbody></table></div>`}

// === CLIENTS ===
function rCl(){
const m={};S.rows.forEach(r=>{const c=r.Client||'?';if(!m[c])m[c]={n:c,ct:0,a:0,mrr:0,s:0,mg:new Set(),reg:new Set(),lastDate:null};m[c].ct++;m[c].mrr+=r._mUSD;m[c].s+=r._sUSD;if(r.Manager)m[c].mg.add(r.Manager);if(r.Hudud)m[c].reg.add(r.Hudud);if(sc(r.status)==='A')m[c].a++;const d=pd(r.sanasi);if(d&&(!m[c].lastDate||d>m[c].lastDate)){m[c].lastDate=d;m[c].lastMgr=r.Manager||''}});
let d=Object.values(m).sort((a,b)=>(b.lastDate||0)-(a.lastDate||0));
if(S.clQ){const q=S.clQ.toLowerCase();d=d.filter(r=>r.n.toLowerCase().includes(q)||[...r.mg].join(' ').toLowerCase().includes(q))}
const t=d.length,pg=Math.ceil(t/S.clN),sl=d.slice(S.clP*S.clN,(S.clP+1)*S.clN);
return`<div class="page-header"><div><div class="page-title">Mijozlar</div><div class="page-sub">${t} ta noyob mijoz</div></div></div>
<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Mijoz yoki menejer..." value="${S.clQ}" oninput="onSearch('clQ',this.value)"></div></div>
<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>Mijoz</th><th>Menejer</th><th class="text-r">Shartnomalar</th><th class="text-r">Aktiv</th><th>Hudud</th><th class="text-r">MRR ($)</th><th class="text-r">Jami ($)</th><th>Oxirgi sana</th></tr></thead><tbody>${sl.map(r=>`<tr><td style="font-weight:600">${r.n}</td><td style="font-size:12px">${r.lastMgr||[...r.mg].join(', ')||'—'}</td><td class="text-r mono">${r.ct}</td><td class="text-r">${r.a?`<span class="badge b-green">${r.a}</span>`:'<span class="badge b-gray">0</span>'}</td><td style="font-size:11px">${[...r.reg].join(', ')||'—'}</td><td class="text-r mono" style="font-weight:600">${fmt(r.mrr)}</td><td class="text-r mono">${fmt(r.s)}</td><td class="mono" style="font-size:10.5px;color:var(--text2)">${r.lastDate?r.lastDate.toLocaleDateString('ru-RU'):'—'}</td></tr>`).join('')}</tbody></table></div></div>${pag(S.clP,pg,t,S.clN,'clP')}`}

// === TOP MRR ===
function rT(){
const act=activeR().sort((a,b)=>b._mUSD-a._mUSD),tM=act.reduce((s,r)=>s+r._mUSD,0);
const t5=act.slice(0,5).reduce((s,r)=>s+r._mUSD,0),t10=act.slice(0,10).reduce((s,r)=>s+r._mUSD,0),t20=act.slice(0,20).reduce((s,r)=>s+r._mUSD,0);
return`<div class="page-header"><div><div class="page-title">Top MRR</div><div class="page-sub">Eng yirik aktiv shartnomalar</div></div></div>
<div class="metrics" style="grid-template-columns:repeat(4,minmax(0,1fr))">
<div class="metric c5"><div class="metric-lbl">Top 5</div><div class="metric-val">${tM?Math.round(t5/tM*100):0}%</div><div class="metric-foot">${fmt(t5)} $</div></div>
<div class="metric c1"><div class="metric-lbl">Top 10</div><div class="metric-val">${tM?Math.round(t10/tM*100):0}%</div><div class="metric-foot">${fmt(t10)} $</div></div>
<div class="metric c2"><div class="metric-lbl">Top 20</div><div class="metric-val">${tM?Math.round(t20/tM*100):0}%</div><div class="metric-foot">${fmt(t20)} $</div></div>
<div class="metric c3"><div class="metric-lbl">O'rtacha</div><div class="metric-val">${fmt(act.length?Math.round(tM/act.length):0)}</div><div class="metric-foot">per shartnoma</div></div></div>
<div class="grid-2"><div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--accent)"></span>Top 10</span></div><div class="card-body"><div class="chart-wrap"><canvas id="chT"></canvas></div></div></div>
<div class="card"><div class="card-head"><span class="card-label"><span class="dot" style="background:var(--purple)"></span>Konsentratsiya</span></div><div class="card-body"><div class="chart-wrap" style="height:220px"><canvas id="chK"></canvas></div></div></div></div>
<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th style="width:40px">#</th><th>Mijoz</th><th>Firma</th><th>Menejer</th><th>Hudud</th><th class="text-r">Oylik $</th><th class="text-r">Ulush</th><th style="width:160px">Nisbat</th></tr></thead><tbody>${act.slice(0,40).map((r,i)=>{const p=tM?(r._mUSD/tM*100):0;const rc=i===0?'rk1':i===1?'rk2':i===2?'rk3':'rkn';const bc=i<3?'var(--accent)':i<10?'var(--green)':'var(--amber)';return`<tr><td><span class="rank ${rc}">${i+1}</span></td><td style="font-weight:600">${r.Client||'—'}</td><td style="color:var(--text2);font-size:11px">${r['Firma nomi']||'—'}</td><td style="font-size:12px">${r.Manager||'—'}</td><td style="font-size:11px">${r.Hudud||'—'}</td><td class="text-r mono" style="font-weight:700;font-size:13px">${fmt(r._mUSD)}</td><td class="text-r mono" style="font-size:11px;color:var(--text2)">${p.toFixed(1)}%</td><td><div style="height:7px;background:var(--bg3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${act[0]?Math.min(r._mUSD/act[0]._mUSD*100,100):0}%;background:${bc};border-radius:4px;transition:width .5s ease"></div></div></td></tr>`}).join('')}</tbody></table></div></div>`}

// === DEBTS ===
function rDebt(){
const now=new Date();const repDate=S.debtDate||now;const dt=calcDebtTable(repDate);
const totalKel=dt.reduce((s,r)=>s+(r.kelQarz>0?r.kelQarz:0),0);
const totalOy=dt.reduce((s,r)=>s+(r.oyQarz>0?r.oyQarz:0),0);
const mos=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const repLabel=mos[repDate.getMonth()]+' '+repDate.getFullYear();
return`<div class="page-header"><div><div class="page-title">Qarzdorlik</div><div class="page-sub">${repLabel} oy oxiriga · ${dt.length} ta mijoz</div></div>
<div style="display:flex;gap:6px;align-items:center">
<input type="date" class="flt" style="font-size:12px;padding:6px 10px" value="${repDate.toISOString().slice(0,10)}" onchange="S.debtDate=new Date(this.value);clearCache();render()">
</div></div>
<div class="metrics" style="grid-template-columns:repeat(2,1fr);margin-bottom:14px">
<div class="metric c4"><div class="metric-lbl">Oy oxiri qarzi (jami)</div><div class="metric-val">${fmt(totalOy)}</div><div class="metric-foot">USD</div></div>
<div class="metric c4"><div class="metric-lbl">Kelishuv qarzi (jami)</div><div class="metric-val">${fmt(totalKel)}</div><div class="metric-foot">USD</div></div>
</div>
<div class="tbl-wrap"><div class="tbl-scroll"><table><thead><tr><th>Mijoz</th><th class="text-r">Sh. qoldiq</th><th class="text-r">Oy oxiri</th><th class="text-r">Kelishuv</th></tr></thead><tbody>${dt.length?dt.map(r=>{
const oyC=r.oyQarz>0?'var(--amber)':'var(--green)';const kelC=r.kelQarz>0?'var(--red)':'var(--green)';
return'<tr><td style="font-weight:500">'+r.name+'</td><td class="text-r mono" style="font-size:11px;color:var(--text3)">'+(r.qoldiq>0?fmt(r.qoldiq):'—')+'</td><td class="text-r mono" style="font-size:11px;color:'+oyC+';font-weight:'+(r.oyQarz>0?'600':'400')+'">'+(r.oyQarz>0?fmt(r.oyQarz):'—')+'</td><td class="text-r mono" style="font-size:11px;color:'+kelC+';font-weight:'+(r.kelQarz>0?'700':'400')+'">'+(r.kelQarz>0?fmt(r.kelQarz):'—')+'</td></tr>'}).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">—</td></tr>'}</tbody></table></div></div>`}
