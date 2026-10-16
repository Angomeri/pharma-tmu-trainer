/** Deterministic pharmacy training parser. NO fuzzy dose checking. */
const compact = x => String(x || '').normalize('NFKC').replace(/[\u00a0\u2007\u202f]/g,' ').replace(/\r/g,'').replace(/[—–−]/g,'-');
const fold = x => compact(x).toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/,/g,'.');
const approx = (a,b) => Math.abs(a-b)<1e-7;
const number = '(\\d+(?:[.,]\\d+)?)';

export function splitPrescription(text){
  const v = fold(text);
  const m = v.match(/(?:^|\n)\s*(?:d\s*\.\s*)?s\s*[.:]\s*|\bsigna\s*:\s*/);
  const before = m ? v.slice(0,m.index) : v;
  const sig = m ? v.slice(m.index + m[0].length) : '';
  const rp = before.replace(/\b(?:rp|recipe)\s*\.?\s*:?/g,'').trim();
  return {full:v, before, body:rp, signature:sig, hasRp:/\b(?:rp|recipe)\s*\.?\s*:?/.test(v),hasSignature: Boolean(m)};
}
function containsLatin(body,aliases){
  return aliases.some(alias => { const pattern=fold(alias).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');return new RegExp('(?:^|[^a-z])'+pattern+'(?:$|[^a-z])','i').test(body); });
}
function getConcentration(body){
  const found=[...body.matchAll(new RegExp(number+'\\s*%','g'))].map(m=>Number(m[1].replace(',','.')));
  return found;
}
function getPrimaryLine(body){
  const lines=body.split('\n').map(x=>x.trim()).filter(Boolean);
  return lines[0] || '';
}
function doseMatches(rx,exercise){
  const expected=exercise.dose;
  if(expected.unit==='percent'){ const concentrations=getConcentration(getPrimaryLine(rx.body)); return concentrations.length===1 && approx(concentrations[0],expected.value); }
  const primary=getPrimaryLine(rx.body);
  // Dosage gram is in primary prescription clause, prior to N. quantity.
  const withoutQuantity=primary.replace(/\bn\s*\.?\s*\d+(?:\.\d+)?/g,'');
  const parsed=[...withoutQuantity.matchAll(new RegExp(number+'\\s*(?:g|гр|г)?(?=$|\\s|[,;.!-])','g'))].map(m=>Number(m[1].replace(',','.')));
  return parsed.length===1 && approx(parsed[0],expected.value);
}
function packageMatches(rx,exercise){
  if(!exercise.packageSize)return true;
  const pack=exercise.packageSize;
  const primary=getPrimaryLine(rx.body);
  if(pack.unit==='ml'){
    const found=[...primary.matchAll(new RegExp(number+'\\s*(?:ml|мл)\\b','g'))].map(m=>Number(m[1].replace(',','.')));
    return found.length===1 && approx(found[0],pack.value);
  }
  // For topical mass the percentage is *not* part of the package size.
  const withoutPercent=primary.replace(/\d+(?:\.\d+)?\s*%/g,'');
  const found=[...withoutPercent.matchAll(new RegExp(number+'(?=$|\\s|[,;.!-])','g'))].map(m=>Number(m[1].replace(',','.')));
  return found.length===1 && approx(found[0],pack.value);
}
function getN(body){
  const vals=[...body.matchAll(/\bn\s*\.?\s*(\d+)(?!\d)/g)].map(m=>Number(m[1]));
  return vals;
}
function checkForm(rx,exercise){
  const body=getPrimaryLine(rx.body);
  const tests={
    solution: /\b(?:sol|solutionis|solutionem|solutio)\b/.test(body),
    ointment: /\b(?:ung|unguenti|unguentum)\b/.test(body),
    paste: /\b(?:pastae|pasta)\b/.test(body),
    tablet: /\b(?:tab|tabulettas|tabulettae|tabuletta)\b/.test(body),
    dragee: /\bdragee\b/.test(body),
    powder: true, // powder drug + separate D.t.d. units is a valid shortened prescription
    bulk: true // undivided bulk powder, no mandatory generic word
  };
  if(!tests[exercise.form])return false;
  if(exercise.dispensing==='amp')return /\bd\s*\.\s*t\s*\.\s*d\s*\.?|\bdtd\b/.test(rx.body)&&/\b(?:amp|ampullis|ampullas)\b/.test(rx.body);
  if(exercise.dispensing==='portions')return /\bd\s*\.\s*t\s*\.\s*d\s*\.?|\bdtd\b/.test(rx.body);
  return true;
}
function checkSig(rx,exercise){
  if(!rx.hasSignature)return false;
  const sig=rx.signature.replace(/\s+/g,' ');
  return exercise.sigGroups.every(group=>group.some(option=>sig.includes(fold(option))));
}
function checkSterile(rx,exercise){
  if(!exercise.requireSterile)return true;
  return /\bsterilisetur\b|\bsterilisatae\b|\bsterilisata\b|\bsterile\b/.test(rx.body);
}
export function validatePrescription(input, exercise){
  if(!exercise)throw new Error('Неизвестное задание');
  const rx=splitPrescription(input);
  const checks=[
    {key:'rp',label:'Начало прописи Rp.',weight:7,critical:false,ok:rx.hasRp,help:'Начни рецепт с «Rp.:».'},
    {key:'drug',label:'Правильное название препарата на латыни',weight:24,critical:true,ok:containsLatin(getPrimaryLine(rx.body),exercise.drugAliases),help:'Проверь латинское наименование и падеж.'},
    {key:'form',label:'Лекарственная форма и способ выписки',weight:12,critical:false,ok:checkForm(rx,exercise),help:'Проверь обозначение лекарственной формы, D.t.d. и упаковку при необходимости.'},
    {key:'dose',label:exercise.dose.unit==='percent'?'Концентрация раствора или мягкой формы':'Разовая доза / масса препарата',weight:24,critical:true,ok:doseMatches(rx,exercise),help:'Указанное числовое значение не совпадает с заданием. Это критическая ошибка.'},
  ];
  if(exercise.packageSize)checks.push({key:'package',label:exercise.packageSize.unit==='ml'?'Объём лекарственной формы':'Общая масса лекарственной формы',weight:10,critical:true,ok:packageMatches(rx,exercise),help:'Проверь объём / массу готового препарата.'});
  if(exercise.numberOfDoses!==undefined)checks.push({key:'quantity',label:'Количество доз или единиц отпуска',weight:10,critical:false,ok:getN(rx.body).includes(exercise.numberOfDoses),help:'Проверь количество после «N.».'});
  if(exercise.requireSterile)checks.push({key:'sterility',label:'Требование стерильности',weight:8,critical:false,ok:checkSterile(rx,exercise),help:'Для указанного задания обозначь стерильность.'});
  checks.push({key:'sig',label:'Сигнатура и способ применения',weight:13,critical:false,ok:checkSig(rx,exercise),help:'После «S.» укажи назначенную схему применения.'});
  const max=checks.reduce((sum,c)=>sum+c.weight,0);
  const earned=checks.filter(c=>c.ok).reduce((sum,c)=>sum+c.weight,0);
  const critical=checks.filter(c=>c.critical && !c.ok);
  const raw=Math.round(100*earned/max);
  const score=critical.length?Math.min(raw,49):raw;
  const status=checks.every(c=>c.ok)?'correct':critical.length?'incorrect':score>=70?'partial':'incorrect';
  return {status,score,passed:checks.filter(c=>c.ok).length,total:checks.length,checks,critical:critical.map(x=>x.key)};
}
