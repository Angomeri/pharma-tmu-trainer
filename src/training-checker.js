import {drugAliases,normalizeDrug} from './bank-eval.js';
import {PROFILES} from './training-data.js';
export function identify(answer,t){
 const p=PROFILES[t.id];
 const names=[...drugAliases(t.drug),...p.names,p.active,...p.brands].map(normalizeDrug);
 return names.includes(normalizeDrug(answer));
}
const fold=s=>String(s).toLowerCase().replace(/ё/g,'е').replace(/(\d),(\d)/g,'$1.$2').replace(/\s+/g,' ').trim();
function parts(text){const s=fold(text);const m=/\b(?:d\s*\.\s*)?s\s*[.:]/.exec(s);return {body:m?s.slice(0,m.index):s,sig:m?s.slice(m.index+m[0].length):'',hasSig:!!m};}
function canonical(s){return fold(s).replace(/\b(mcg|мкг)\b/g,'ug').replace(/\bмг\b/gu,'mg').replace(/(\d+(?:\.\d+)?)\s*(mg|мг|ug|мкг)(?=\s|$|[.;])/gu,(_,n,u)=>String(Number(n)/(u==='mg'||u==='мг'?1000:1000000))).replace(/(\d+(?:\.\d+)?)\s*(?:г|g)(?=\s|$)/gu,'$1').replace(/tabulett(?:as|ae|is)|tab\./g,'tab').replace(/solutionis|sol\./g,'sol').replace(/aerosoli|aer\./g,'aer').replace(/[—–-]/g,' ').replace(/\bnumero\b/g,'n').replace(/№/g,'n').replace(/\brecipe\s*:/g,'rp:');}
const num=s=>[...s.matchAll(/\d+(?:\.\d+)?/g)].map(x=>Number(x[0]));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const words=s=>canonical(s).replace(/[^\p{L}\p{N}%/]+/gu,' ').trim();
export function checkTrainingRx(input,t){
 if(t.status!=='verified')return {status:'review',checks:[],message:'Количественный эталон требует сверки. Автоматическая оценка отключена.'};
 const actual=parts(input),ref=parts(t.reference_prescription),a=canonical(actual.body),r=canonical(ref.body);
 const line=r.split(/\bd\s*\./)[0];
 const latin=line.replace(/^rp\s*[.:]*\s*/,'').replace(/^(sol|tab|aer)\s*/,'').split(/\d/)[0].trim();
 const primary=a.split(/\bd\s*\./)[0];
 const dose=x=>num(x.replace(/\bn\s*\.?\s*\d+/g,''));
 const count=x=>Number(x.match(/\bn\s*\.?\s*(\d+)/)?.[1]||0);
 const form=x=>['sol','tab','aer','ampullis','flaconibus','dosis'].filter(w=>new RegExp('\\b'+w+'\\b').test(x));
 const checks=[
 {key:'rp',label:'Начало рецепта',ok:/^\s*(rp\s*[.:]|recipe\s*:)/i.test(input),help:'Начните с Rp.: или Recipe:.'},
 {key:'drug',label:'Латинское название и соль',ok:words(primary.replace(/^rp\s*[.:]*\s*/,'').replace(/^(sol|tab|aer)\s*/, '').split(/\d/)[0])===words(latin),help:'В этом образце требуется '+latin+'. Другую латинскую форму названия необходимо сверить с преподавателем.'},
 {key:'dose',label:'Доза, концентрация и объём',ok:equal(dose(a),dose(r))&&a.includes('%')===r.includes('%')&&/\bml\b/.test(a)===/\bml\b/.test(r),help:'В образце: '+t.strength+'. Масса указана в граммах, если единица не написана; мг и мкг пересчитываются.'},
 {key:'quantity',label:'Количество единиц',ok:count(a)===count(r),help:'В образце количество: '+t.reference_package_count+'.'},
 {key:'form',label:'Форма и упаковка',ok:equal(form(a),form(r))&&(/d\s*\.\s*t\s*\.\s*d\s*\./.test(a)===/d\s*\.\s*t\s*\.\s*d\s*\./.test(r)),help:'Проверьте форму «'+t.form+'», обозначение D.t.d. и упаковку.'},
 {key:'signature',label:'Сигнатура',ok:actual.hasSig&&!!actual.sig.trim(),help:'После S. укажите способ применения по условию.'}
 ];
 // Free clinical language is never judged by substring matching.
 const sigMatch=words(actual.sig)===words(ref.sig);
 const failed=checks.some(x=>!x.ok);
 return {checks,status:failed?'incorrect':sigMatch&&!t.manual_signature_review?'matched':'review',message:failed?'Есть отличия от сохранённого учебного образца. Они не всегда являются ошибками: другую допустимую форму, количество или схему нужно сверить с преподавателем.':sigMatch&&!t.manual_signature_review?'Все элементы совпали с заданным учебным образцом.':'Формальные элементы совпали. Сигнатуру необходимо сверить: автоматическая проверка не подтверждает клиническую схему.',signature:ref.sig};
}
export function rxCondition(t){return `Выпишите: ${t.form}; ${t.strength}; количество ${t.reference_package_count}. Сигнатура учебного образца: ${parts(t.reference_prescription).sig}.`;}
