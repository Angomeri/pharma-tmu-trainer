import {RECIPES,GROUPS,getRecipe,DATA_VERSION} from './data.js';
import {validatePrescription} from './validator.js';
import {BANK,BANK_TOPICS,BANK_QUESTION_BY_ID,BANK_TEMPLATE_BY_ID} from './bank-data.js';
import {judgeDrugChoice} from './bank-eval.js';
const KEY='pharma-tmu-v1-progress';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel=d=>new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'});
const timeLabel=d=>new Date(d).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
const safeRead=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');return Array.isArray(s.history)?s.history:[]}catch{return []}};
const state={view:'dashboard',currentId:RECIPES[0].id,labFilter:'Все группы',catalogFilter:'Все группы',query:'',history:safeRead(), bankMode:'questions',bankTopic:'Все темы',bankQuery:'',bankStrict:true,bankCurrent:BANK.questions[0].id,bankTemplate:BANK.templates[0].id,bankFeedbackShown:false,bankAnswerShown:false,bankComparisonShown:false, bankHistory:(()=>{try{return JSON.parse(localStorage.getItem('pharma-tmu-bank-progress')||'[]')}catch{return []}})()};
const lastAttempt=id=>[...state.history].reverse().find(x=>x.id===id);
const solvedIds=()=>new Set(state.history.filter(x=>x.status==='correct').map(x=>x.id));
const percentage=(a,b)=>b?Math.round(100*a/b):0;
function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:DATA_VERSION,history:state.history.slice(-1000)}));}catch{ /* storage may be unavailable */ }}
function addOptions(sel,items){sel.innerHTML=items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');}
function setView(name){const pages=['dashboard','lab','bank','catalog','stats'];const view=pages.includes(name)?name:'dashboard';state.view=view;for(const page of pages)$('view'+page[0].toUpperCase()+page.slice(1)).classList.toggle('hidden',page!==view);document.querySelectorAll('[data-link]').forEach(a=>a.classList.toggle('active',a.dataset.link===view));const labels={dashboard:'Обзор',lab:'Рецептурная лаборатория',bank:'Банк вопросов',catalog:'Каталог препаратов',stats:'Мой прогресс'};$('crumbCurrent').textContent=labels[view];if(view==='dashboard')renderDashboard();if(view==='lab')renderLab();if(view==='bank')renderBank();if(view==='catalog')renderCatalog();if(view==='stats')renderStats();window.scrollTo({top:0,behavior:'instant'});}
function statCards(){const hist=state.history;const good=hist.filter(x=>x.status==='correct').length;const errors=hist.reduce((n,h)=>n+(h.failed?.length||0),0);return [
  {label:'Вопросов в банке',value:String(BANK.questions.length).padStart(2,'0'),note:'Четыре фармакологические темы',icon:'? '},
  {label:'Освоено рецептов',value:`${solvedIds().size}/${RECIPES.length}`,note:'Полностью верные прописи',icon:'✓'},
  {label:'Успешных проверок',value:`${percentage(good,hist.length)}%`,note:`${hist.length} попыток выполнено`,icon:'↗'},
  {label:'Обнаружено ошибок',value:String(errors).padStart(2,'0'),note:'Пункты проверок за всё время',icon:'!'}];}
function statCard(d){return `<div class="stat-card"><div class="stat-card-head"><span>${esc(d.label)}</span><span class="stat-icon">${esc(d.icon)}</span></div><div class="stat-value">${esc(d.value)}</div><div class="stat-card-note">${esc(d.note)}</div></div>`;}
function renderDashboard(){const cards=statCards();$('dashboardStats').innerHTML=cards.map(statCard).join('');const recent=state.history.slice(-4).reverse();$('activityList').innerHTML=recent.length?recent.map(h=>`<div class="activity-item"><span class="activity-bubble">${h.status==='correct'?'✓':'↻'}</span><div><strong>${esc(getRecipe(h.id)?.name||'Задание')}</strong><small>${esc(dateLabel(h.when))} · ${esc(timeLabel(h.when))}</small></div><span class="activity-score">${h.score}%</span></div>`).join(''):`<div class="empty-state"><span class="empty-icon">◌</span><strong>Пока нет попыток</strong><span>Открой рецептурную лабораторию и проверь свой первый рецепт.</span></div>`;}
function renderLab(){const exercise=getRecipe(state.currentId);if(!exercise)return;const index=RECIPES.findIndex(x=>x.id===exercise.id)+1;$('taskIndex').textContent=`${String(index).padStart(2,'0')} / ${RECIPES.length}`;$('taskDifficulty').textContent=exercise.difficulty.toUpperCase();$('taskDrug').textContent=exercise.name;$('taskGroup').textContent=exercise.group+' · '+exercise.subgroup;$('taskDescription').textContent=exercise.assignment;$('taskSource').textContent=`Источник: МУ ТМУ, 2024 · с. ${exercise.source.page} · ${exercise.source.task}`;$('taskCountLabel').textContent=`${RECIPES.length} вариантов`;$('labFilter').value=state.labFilter;renderTaskList();}
function renderTaskList(){const tasks=RECIPES.filter(r=>state.labFilter==='Все группы'||r.group===state.labFilter);$('taskList').innerHTML=tasks.map((r,i)=>{const last=lastAttempt(r.id);return `<button class="task-tile ${r.id===state.currentId?'active':''}" data-task="${esc(r.id)}"><span class="tile-index">${String(RECIPES.indexOf(r)+1).padStart(2,'0')}</span><span><strong>${esc(r.name)}</strong><small>${esc(r.subgroup)}</small></span>${last?`<span class="tile-result">${last.score}%</span>`:''}</button>`;}).join('')||'<p class="empty-state">В этой группе нет заданий.</p>';}
function selectTask(id){if(!getRecipe(id))return;state.currentId=id;clearPractice();renderLab();location.hash='#lab';}
function clearPractice(){$('recipeInput').value='';$('charCount').textContent='0 символов';$('feedback').classList.add('hidden');$('answerPanel').classList.add('hidden');$('hintPanel').classList.add('hidden');}
function feedbackView(result){const good=result.status==='correct';$('feedback').innerHTML=`<div class="feedback-summary"><div><span class="eyebrow">РЕЗУЛЬТАТ ПРОВЕРКИ</span><h3>${good?'Рецепт составлен правильно':result.critical.length?'Есть критические ошибки':'Есть замечания к оформлению'}</h3><p>${good?'Все обязательные элементы совпали с эталоном.':result.critical.length?'Ошибка в препарате, концентрации, массе или объёме ограничивает оценку.':'Проверь отмеченные элементы и попробуй ещё раз.'}</p></div><span class="score-bubble ${good?'':'bad'}">${result.score}%</span></div><div class="feedback-list">${result.checks.map(c=>`<div class="feedback-check ${c.ok?'':'failed'}"><span class="check-ic">${c.ok?'✓':'✕'}</span><span><strong>${esc(c.label)}</strong>${c.ok?'':`<small>${esc(c.help)}</small>`}</span></div>`).join('')}</div>`;$('feedback').classList.remove('hidden');}
function check(){const raw=$('recipeInput').value;if(!raw.trim()){$('hintPanel').textContent='Сначала введи собственную рецептурную пропись в редактор.';$('hintPanel').classList.remove('hidden');$('recipeInput').focus();return;}const r=getRecipe(state.currentId);const result=validatePrescription(raw,r);state.history.push({id:r.id,when:new Date().toISOString(),score:result.score,status:result.status,failed:result.checks.filter(c=>!c.ok).map(c=>c.key)});persist();feedbackView(result);renderTaskList();}
function hint(){const item=getRecipe(state.currentId);const details=[`Препарат: ${item.name}.`,`Лекарственная форма: ${formLabel(item.form)}.`,`Назначение: внимательно перенеси количество, дозировку и способ применения из условия.`];$('hintPanel').textContent=details.join(' ');$('hintPanel').classList.toggle('hidden');}
const formLabel=f=>({solution:'раствор',ointment:'мазь',paste:'паста',tablet:'таблетки',dragee:'драже',powder:'дозированные порошки',bulk:'присыпка'})[f]||f;
function showAnswer(){const ex=getRecipe(state.currentId);$('answerText').textContent=ex.answer;$('answerPanel').classList.toggle('hidden');}
function next(){const current=RECIPES.findIndex(r=>r.id===state.currentId);const list=RECIPES.filter(r=>state.labFilter==='Все группы'||r.group===state.labFilter);const i=list.findIndex(r=>r.id===state.currentId);const replacement=list[(i+1)%list.length]||RECIPES[(current+1)%RECIPES.length];selectTask(replacement.id);}
function renderCatalog(){$('catalogTotal').textContent=String(RECIPES.length);const q=state.query.trim().toLocaleLowerCase('ru-RU');const filtered=RECIPES.filter(r=>(state.catalogFilter==='Все группы'||r.group===state.catalogFilter)&&(!q||[r.name,r.group,r.subgroup,...r.drugAliases].join(' ').toLocaleLowerCase('ru-RU').includes(q)));$('catalogGrid').innerHTML=filtered.length?filtered.map((r,i)=>`<article class="catalog-card"><div class="catalog-card-head"><span class="catalog-number">DRUG / ${String(RECIPES.indexOf(r)+1).padStart(3,'0')}</span><span class="catalog-tag">Проверка рецепта</span></div><h3>${esc(r.name)}</h3><p class="latin">${esc(r.drugAliases[0])}</p><p class="category">${esc(r.group)}<br>${esc(r.subgroup)}</p><button data-open="${esc(r.id)}">Выписать рецепт ↗</button></article>`).join(''):'<p class="empty-state">По запросу ничего не найдено. Измени фильтр.</p>';}
function renderStats(){$('extendedStats').innerHTML=statCards().map(statCard).join('');const hist=state.history.slice().reverse();$('statsHistory').innerHTML=hist.length?hist.slice(0,30).map(h=>`<div class="history-item"><div><strong>${esc(getRecipe(h.id)?.name||'Задание')}</strong><small>${esc(dateLabel(h.when))} · ${esc(timeLabel(h.when))} · ${h.failed.length} замечаний</small></div><div class="history-score ${h.score<70?'low':''}">${h.score}%</div></div>`).join(''):`<div class="empty-state"><span class="empty-icon">◌</span><strong>История пуста</strong><span>Результаты появятся после первого проверенного рецепта.</span></div>`;const names={rp:'Rp.',drug:'Латинское название',form:'Форма выписки',dose:'Дозировка / концентрация',package:'Объём / масса',quantity:'Количество доз',sterility:'Стерильность',sig:'Сигнатура'};const cnt={};hist.forEach(h=>h.failed.forEach(k=>cnt[k]=(cnt[k]||0)+1));const entries=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);const maximum=Math.max(1,...entries.map(x=>x[1]));$('mistakeList').innerHTML=entries.length?entries.map(([key,num])=>`<div class="mistake-item"><div><strong>${esc(names[key]||key)}</strong><small>${num} ошибок</small></div><div class="mistake-meter"><span style="width:${100*num/maximum}%"></span></div></div>`).join(''):`<div class="empty-state"><span class="empty-icon">◎</span><strong>Пока нет статистики ошибок</strong><span>После проверки рецептов здесь появятся проблемные элементы.</span></div>`;}
function downloadJson(){const content={app:'PHARMA TMU',exportedAt:new Date().toISOString(),dataVersion:DATA_VERSION,history:state.history};const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='pharma-tmu-progress.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function reset(){if(confirm('Сбросить историю всех попыток на этом устройстве? Это действие нельзя отменить.')){state.history=[];persist();renderStats();}}
function wire(){addOptions($('labFilter'),GROUPS);addOptions($('catalogFilter'),GROUPS);$('navRecipeCount').textContent=RECIPES.length;$('navBankCount').textContent=BANK.questions.length;$('todayText').textContent=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});document.body.addEventListener('click',ev=>{const go=ev.target.closest('[data-goto]');if(go){location.hash='#'+go.dataset.goto;return;}const item=ev.target.closest('[data-task]');if(item){selectTask(item.dataset.task);return;}const op=ev.target.closest('[data-open]');if(op){selectTask(op.dataset.open);return;}});window.addEventListener('hashchange',()=>setView(location.hash.slice(1)));$('labFilter').addEventListener('change',e=>{state.labFilter=e.target.value;const visible=RECIPES.filter(r=>state.labFilter==='Все группы'||r.group===state.labFilter);if(!visible.some(r=>r.id===state.currentId)){selectTask(visible[0].id);}else renderTaskList();});$('catalogFilter').addEventListener('change',e=>{state.catalogFilter=e.target.value;renderCatalog();});$('catalogSearch').addEventListener('input',e=>{state.query=e.target.value;renderCatalog();});$('recipeInput').addEventListener('input',e=>{$('charCount').textContent=`${e.target.value.length} символов`;$('feedback').classList.add('hidden');});$('recipeInput').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();check();}});$('checkBtn').addEventListener('click',check);$('hintBtn').addEventListener('click',hint);$('answerBtn').addEventListener('click',showAnswer);$('nextBtn').addEventListener('click',next);$('exportProgress').addEventListener('click',downloadJson);$('resetProgress').addEventListener('click',reset);wireBank();}
wire();setView(location.hash.slice(1));

// BANK OF SOURCE-LINKED QUESTIONS (imported unchanged; no recipe autograding).
function bankList(){
  const all=state.bankMode==='questions'?BANK.questions:BANK.templates;
  const topic=state.bankTopic, query=state.bankQuery.trim().toLocaleLowerCase('ru-RU');
  return all.filter(x=>(topic==='Все темы'||x.topic===topic)&&(!query||[x.id,x.topic,x.prompt||'',x.strict_prompt||'',x.drug||'',x.expected_drug||''].join(' ').toLocaleLowerCase('ru-RU').includes(query)));
}
function currentBankEntry(){return state.bankMode==='questions'?BANK_QUESTION_BY_ID.get(state.bankCurrent):BANK_TEMPLATE_BY_ID.get(state.bankTemplate);}
function bankSourceHtml(sources){
  return (sources||[]).map(s=>{
    const lib=BANK.sources[s.source_id];
    return `<div class="bank-source-row"><span class="source-code">${esc(s.source_id)}</span><div><strong>${esc(lib?.title||s.source_id)}</strong><small>Страницы: ${esc(s.pages||'не указаны')} · ${esc(s.role||'')}</small></div></div>`;
  }).join('');
}
function saveBankAttempt(entry,status){
  state.bankHistory.push({id:entry.id,status,at:new Date().toISOString()});
  state.bankHistory=state.bankHistory.slice(-700);
  try{localStorage.setItem('pharma-tmu-bank-progress',JSON.stringify(state.bankHistory));}catch{}
}
function renderBank(){
  const list=bankList();let id=state.bankMode==='questions'?state.bankCurrent:state.bankTemplate;
  if(list.length&&!list.some(x=>x.id===id)){
    id=list[0].id;
    if(state.bankMode==='questions')state.bankCurrent=id;else state.bankTemplate=id;
    state.bankFeedbackShown=false;state.bankAnswerShown=false;state.bankComparisonShown=false;
  }
  document.querySelectorAll('[data-bank-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.bankMode===state.bankMode));
  $('bankTopic').value=state.bankTopic; $('bankStrict').checked=state.bankStrict;
  $('bankStrict').closest('label').classList.toggle('hidden',state.bankMode!=='questions');
  $('bankSideTitle').textContent=state.bankMode==='questions'?'ВЫБОР ВОПРОСА':'СПРАВОЧНИК РЕЦЕПТОВ';
  $('bankSideCount').textContent=list.length+' из '+(state.bankMode==='questions'?BANK.questions.length:BANK.templates.length);
  $('bankItems').innerHTML=list.length?list.map((x,i)=>{
    const active=x.id===id;
    const mark=x.status==='verified'?'':' <span class="review-marker" title="Требует сверки">!</span>';
    const done=state.bankHistory.some(h=>h.id===x.id&&(h.status==='accepted'||h.status==='alternative'||h.status==='studied'));
    return `<button type="button" class="bank-list-item ${active?'active':''}" data-bank-select="${esc(x.id)}"><span>${esc(x.id)}</span><strong>${esc(x.prompt||x.drug)}</strong>${mark}${done?'<span class="done-marker">✓</span>':''}</button>`;
  }).join(''):'<div class="empty-state">Поиск не дал результатов.</div>';
  const entry=currentBankEntry();
  if(!entry||!list.length){$('bankPrompt').textContent='Нет заданий';$('bankInstruction').textContent='Измени поиск или фильтр.';$('bankQuestionForm').classList.add('hidden');$('bankAnswer').classList.add('hidden');$('bankPosition').textContent='0 / 0';return;}
  const idx=list.findIndex(x=>x.id===entry.id);
  $('bankId').textContent=entry.id+' · '+entry.topic;
  $('bankStatus').textContent=entry.status==='verified'?'В БАЗЕ: ПРОВЕРЕНО':'ТРЕБУЕТ СВЕРКИ';
  $('bankStatus').className='bank-status '+(entry.status==='verified'?'':'needs-review');
  $('bankPosition').textContent=(idx+1)+' / '+list.length;
  $('bankPrev').disabled=idx<=0; $('bankNext').disabled=idx>=list.length-1;
  if(state.bankMode==='questions'){
    $('bankQuestionForm').classList.remove('hidden');
    $('bankPrompt').textContent=state.bankStrict?entry.strict_prompt:entry.prompt;
    $('bankInstruction').textContent=state.bankStrict?'Назови препарат для уточнённого показания.': 'Общее показание: в базе могут быть дополнительные допустимые препараты.';
    $('bankFeedback').classList.toggle('hidden',!state.bankFeedbackShown);
    $('bankAnswer').classList.toggle('hidden',!state.bankAnswerShown);
  }else{
    $('bankQuestionForm').classList.add('hidden');$('bankAnswer').classList.remove('hidden');
    $('bankPrompt').textContent=entry.drug;
    $('bankInstruction').textContent='Форма: '+entry.form+' · Концентрация/доза: '+entry.strength+' · Путь: '+entry.route;
  }
  const templ=state.bankMode==='questions'?BANK_TEMPLATE_BY_ID.get(entry.target_template_id):entry;
  const sources=entry.sources||templ?.sources||[];
  $('bankAnswerStatus').textContent=entry.status==='verified'?'УЧЕБНАЯ БАЗА':'НУЖНА СВЕРКА';
  $('bankExpected').textContent=state.bankMode==='questions'?entry.expected_drug:entry.drug;
  $('bankRationale').textContent=entry.rationale||templ?.rationale||'';
  $('bankAlternatives').textContent=state.bankMode==='questions'&&(entry.acceptable_alternative_template_ids||[]).length?'Дополнительные варианты для общего показания: '+entry.acceptable_alternative_template_ids.map(id=>BANK_TEMPLATE_BY_ID.get(id)?.drug||id).join('; ')+'. '+entry.alternative_policy:'';
  $('bankNotes').textContent=state.bankMode==='questions'?entry.grading_note:(entry.notes||'');
  $('bankSources').innerHTML=bankSourceHtml(sources);
  $('bankReference').classList.toggle('hidden',!state.bankComparisonShown);
  $('bankRxText').textContent=entry.reference_prescription || templ?.reference_prescription || '';
  $('bankRxPolicy').textContent='Это один из учебных образцов, а не единственный допустимый рецепт. В загруженной базе строгая автоматическая проверка полной прописи запрещена.'+(templ?.manual_signature_review?' Пример сигнатуры требует отдельной проверки при задании конкретного режима.':'');
}
function chooseBank(id){
  if(state.bankMode==='questions'){if(!BANK_QUESTION_BY_ID.has(id))return;state.bankCurrent=id;}
  else{if(!BANK_TEMPLATE_BY_ID.has(id))return;state.bankTemplate=id;}
  $('bankDrugAnswer').value='';$('bankPrescriptionInput').value='';$('bankFeedback').innerHTML='';
  state.bankFeedbackShown=false;state.bankAnswerShown=false;state.bankComparisonShown=false;
  renderBank();
}
function checkBankDrug(){
  const q=BANK_QUESTION_BY_ID.get(state.bankCurrent);
  if(!q)return;
  const result=judgeDrugChoice($('bankDrugAnswer').value,q,BANK_TEMPLATE_BY_ID,{strict:state.bankStrict});
  const feedback=$('bankFeedback');
  feedback.innerHTML=`<strong>${esc(result.label)}</strong>${q.status==='verified'?'<small>Автоматически оценивается только совпадение с перечисленными вариантами.</small>':'<small>Сведения сохранены как в исходном архиве.</small>'}`;
  feedback.className='bank-feedback '+(result.status==='accepted'||result.status==='alternative'?'bank-feedback-good':result.status==='review'?'bank-feedback-review':'bank-feedback-neutral');
  if(result.status!=='empty'){
    state.bankFeedbackShown=true;
    state.bankAnswerShown=true;
    if(result.status==='accepted'||result.status==='alternative')saveBankAttempt(q,result.status);
  }
  renderBank();
}
function revealBank(){state.bankAnswerShown=true;renderBank();}
function compareBank(){state.bankAnswerShown=true;state.bankComparisonShown=true;renderBank();}
function markBankStudied(){const entry=currentBankEntry();if(!entry)return;saveBankAttempt(entry,'studied');renderBank();$('bankSelfStudy').textContent='Отмечено ✓';}
function bankNextStep(direction){
  const list=bankList(),id=currentBankEntry()?.id,idx=list.findIndex(x=>x.id===id); const next=list[idx+direction];
  if(next)chooseBank(next.id);
}
function wireBank(){
  addOptions($('bankTopic'),['Все темы',...BANK_TOPICS]);
  $('bankTopic').addEventListener('change',e=>{state.bankTopic=e.target.value;chooseBank(bankList()[0]?.id||currentBankEntry()?.id);});
  $('bankSearch').addEventListener('input',e=>{state.bankQuery=e.target.value;state.bankFeedbackShown=false;state.bankAnswerShown=false;state.bankComparisonShown=false;renderBank();});
  $('bankStrict').addEventListener('change',e=>{state.bankStrict=e.target.checked;state.bankFeedbackShown=false;state.bankAnswerShown=false;state.bankComparisonShown=false;$('bankDrugAnswer').value='';renderBank();});
  document.body.addEventListener('click',event=>{
    const btn=event.target.closest('[data-bank-select]');if(btn)chooseBank(btn.dataset.bankSelect);
    const mode=event.target.closest('[data-bank-mode]');if(mode){state.bankMode=mode.dataset.bankMode;state.bankFeedbackShown=false;state.bankAnswerShown=false;state.bankComparisonShown=false;renderBank();}
  });
  $('bankCheck').addEventListener('click',checkBankDrug);
  $('bankDrugAnswer').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();checkBankDrug();}});
  $('bankReveal').addEventListener('click',revealBank);
  $('bankCompare').addEventListener('click',compareBank);
  $('bankSelfStudy').addEventListener('click',markBankStudied);
  $('bankPrev').addEventListener('click',()=>bankNextStep(-1));
  $('bankNext').addEventListener('click',()=>bankNextStep(+1));
}
