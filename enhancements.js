/* Learning support; all progress stays with the selected local profile. */
const originalCorrect=correct;
correct=function(q,a){if(q.type==='match'||q.type==='mc')return originalCorrect(q,a);const canonical=v=>{let s=norm(v);return /^[-+]?\d/.test(s)?s.replace(/,/g,'.').replace(/\s+/g,''):s};return q.answer.some(v=>canonical(v)===canonical(a||''))};
const baseDiagram=diagram;
diagram=function(q){if(q.diagram?.kind==='technical')return `<figure class="solid-diagram"><img src="${esc(q.diagram.image)}" alt="${esc(q.diagram.alt)}"></figure>`;if(q.diagram?.kind!=='photo')return baseDiagram(q);const d=q.diagram;return `<figure class="botanical-diagram"><a href="${esc(d.image)}" target="_blank"><img src="${esc(d.image)}" alt="${esc(d.alt)}"></a><figcaption>Skutočná fotografia · kliknutím zväčšíš.<details><summary>Autor a licencia</summary>${esc(d.author)} · <a href="${esc(d.licenseUrl)}" target="_blank">${esc(d.license)}</a> · <a href="${esc(d.source)}" target="_blank" rel="noopener">Zdroj fotografie</a></details></figcaption></figure>`};
const baseQuestion=question;
question=function(){baseQuestion();if(run?.checked&&run.qs[run.i].type==='match'){const q=run.qs[run.i],a=run.answers[q.id]||[];document.querySelector('.feedback').insertAdjacentHTML('beforeend','<ul>'+q.options.map((v,i)=>`<li>${a[i]===q.answer[i]?'✓':'○'} ${esc(v)} → ${esc(q.answer[i])}</li>`).join('')+'</ul>')}saveDraft()};
function draftKey(){return profile()?'tech-draft-v2-'+profile().id:null}
function saveDraft(){if(!run||!profile())return;try{localStorage.setItem(draftKey(),JSON.stringify({run,profileId:profile().id}))}catch{}}
function readDraft(){try{return JSON.parse(localStorage.getItem(draftKey()))}catch{return null}}
const baseFinish=finish;finish=function(){const k=draftKey();baseFinish();if(k)localStorage.removeItem(k)};
const baseStart=start;start=function(...args){clearInterval(ticker);baseStart(...args);saveDraft()};
function resumeDraft(){const saved=readDraft();if(!saved||saved.profileId!==profile()?.id)return;run=saved.run;page='train';clearInterval(ticker);ticker=setInterval(()=>{if(!run)return;const elapsed=Math.floor((Date.now()-run.started)/1000);if(run.mode==='exam'&&elapsed>=run.limit){finish();return}const clock=document.querySelector('#clock');if(clock)clock.textContent=time(run.mode==='exam'?Math.max(0,run.limit-elapsed):elapsed)},500);question()}
['input','change','click'].forEach(event=>document.addEventListener(event,()=>queueMicrotask(saveDraft)));
function learningStats(){const map=new Map();for(const h of history().filter(h=>h.mode==='exam'))for(const d of h.details||[]){if(questions.some(q=>q.id===d.id))map.set(d.id,{...d,date:h.date})};return map}
function smartPractice(kind){if(!profile()){openProfile();return}const latest=new Map();for(const h of history())for(const d of h.details||[])latest.set(d.id,{...d,date:h.date});let pool=questions.filter(q=>q.categories.includes(profile().category));if(kind==='errors')pool=pool.filter(q=>latest.get(q.id)?.correct===false);else pool.sort((a,b)=>(latest.has(a.id)?1:0)-(latest.has(b.id)?1:0));if(!pool.length){alert('Zatiaľ nemáš uložené chyby. Začni denným tréningom.');return}start(pool.slice(0,10),'practice',profile().category,10,kind==='errors'?'Moje chyby':'Denný tréning')}
function startDailyOlympiad(category){
 const rounds=testBank.filter(test=>test.source&&test.category===category);
 const selected=rounds[Math.floor(Math.random()*rounds.length)];
 if(selected)startPreset(selected,'practice');
}
const baseHome=home;
home=function(){
 baseHome();
 $('#main').insertAdjacentHTML('afterbegin',`
 <section class="card" aria-labelledby="daily-heading">
  <h2 id="daily-heading">Čo dnes precvičíš?</h2>
  <div class="actions">
   <button class="primary" id="daily">Denný tréning · 10 otázok</button>
   <button class="secondary" id="errors">Moje chyby</button>
   ${readDraft()?'<button class="secondary" id="resume">Pokračovať v rozpracovanom teste →</button>':''}
  </div>
  <p class="notice">Denný tréning uprednostní neprecvičené otázky. Výsledky skúšobných testov sledujeme oddelene od učenia s nápovedou.</p>
  <h3>Denná olympiáda</h3>
  <p class="notice">Vyber kategóriu a precvič si náhodné okresné kolo bez časového limitu.</p>
  <div class="actions">
   <button class="secondary" data-daily-olympiad="A">Kategória A</button>
   <button class="secondary" data-daily-olympiad="B">Kategória B</button>
  </div>
 </section>`);
 $('#daily').onclick=()=>smartPractice('daily');
 $('#errors').onclick=()=>smartPractice('errors');
 if($('#resume'))$('#resume').onclick=resumeDraft;
 document.querySelectorAll('[data-daily-olympiad]').forEach(button=>{
  button.onclick=()=>startDailyOlympiad(button.dataset.dailyOlympiad);
 });
};
const baseProgress=progress;
progress=function(){baseProgress();const st=learningStats();const rows=topics.map(t=>{const eligible=questions.filter(q=>q.topic===t&&q.categories.includes(profile()?.category||'B'));const seen=eligible.filter(q=>st.has(q.id));const good=seen.filter(q=>st.get(q.id).correct);return {t,total:eligible.length,seen:seen.length,good:good.length,percent:seen.length?Math.round(good.length/seen.length*100):null}});const weak=rows.filter(r=>r.seen&&r.percent<80).sort((a,b)=>a.percent-b.percent);document.querySelector('#main').insertAdjacentHTML('afterbegin',`<section class="card"><h2>Prehľad zo skúšobných testov</h2><p>${st.size} rôznych otázok v testoch. ${weak.length?'Najbližšie precvič: '+esc(weak.slice(0,3).map(r=>r.t).join(', '))+'.':'Dokonči skúšobný test, aby sa ukázali silné a slabšie témy.'}</p><div class="topic-progress">${rows.map(r=>`<div class="historyrow"><span>${r.t}<br><small>${r.seen}/${r.total} rôznych otázok v testoch</small></span><strong>${r.percent===null?'—':r.percent+' %'}</strong></div>`).join('')}</div><div class="actions"><button id="progressErrors" class="primary">Precvičiť moje chyby</button></div></section>`);document.querySelector('#progressErrors').onclick=()=>smartPractice('errors')};
const supportedQuestion=question;
question=function(){supportedQuestion();if(!run)return;const r=run;const answered=r.qs.filter(q=>{const a=r.answers[q.id];return Array.isArray(a)?a.length===q.answer.length&&a.every(Boolean):Boolean(String(a||'').trim())}).length;r.flags=r.flags||{};document.querySelector('#main').insertAdjacentHTML('beforeend',`<section class="card"><p>Zodpovedané ${answered} z ${r.qs.length}. Kliknutím na číslo sa vrátiš k otázke. Hviezdička označuje otázku na kontrolu.</p><button class="secondary" id="flagQuestion">${r.flags[r.i]?'★ Zrušiť označenie':'☆ Označiť na návrat'}</button><div class="actions question-map">${r.qs.map((q,i)=>`<button class="secondary" data-jump="${i}" aria-label="Otázka ${i+1}">${i+1}${r.flags[i]?' ★':''}${r.answers[q.id]?' ✓':''}</button>`).join('')}</div></section>`);document.querySelector('#flagQuestion').onclick=()=>{r.flags[r.i]=!r.flags[r.i];question()};document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{r.i=+b.dataset.jump;r.checked=false;question();scrollTo(0,0)});saveDraft()};
