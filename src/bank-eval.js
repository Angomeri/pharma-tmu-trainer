/**
 * Bounded matching of choices against source-authorized drug aliases.
 * NO automatic grading of the full prescription, by explicit bank policy.
 */
export function normalizeDrug(value){
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
export function drugAliases(name){
  const variants = new Set();
  const original = String(name??'').trim();
  variants.add(normalizeDrug(original));
  const front = original.replace(/\s*\([^)]*\)/g, '').trim();
  if(front)variants.add(normalizeDrug(front));
  for(const match of original.matchAll(/\(([^)]+)\)/g)){
    for(const s of match[1].split(/[;,/]/)){
      const val=normalizeDrug(s); if(val.length>=5)variants.add(val);
    }
  }
  if(front.includes(',')){
    const first=normalizeDrug(front.split(',')[0]); if(first.length>=5)variants.add(first);
  }
  return [...variants].filter(x=>x.length>=5);
}
export function judgeDrugChoice(answer, question, templateMap, {strict=true}={}){
  const normalized=normalizeDrug(answer);
  if(!normalized)return {status:'empty',label:'Введите название препарата перед проверкой.'};
  if(question.status!=='verified'||!question.choice_autograding_ready)
    return {status:'review',label:'Автоматическая оценка этого задания отключена: запись требует сверки.'};
  const primary=templateMap.get(question.target_template_id);
  if(!primary)return {status:'review',label:'Для вопроса не найден эталонный шаблон.'};
  if(drugAliases(primary.drug).includes(normalized)||drugAliases(question.expected_drug).includes(normalized))
    return {status:'accepted',label:'Совпадает с основным препаратом из учебной базы.'};
  if(!strict){
    for(const altId of question.acceptable_alternative_template_ids||[]){
      const alt=templateMap.get(altId);
      if(alt?.status==='verified'&&drugAliases(alt.drug).includes(normalized))
        return {status:'alternative',label:'Совпадает с альтернативным препаратом, отмеченным в базе для общего показания.'};
    }
  }
  return {status:'unconfirmed',label:'Не совпало с перечисленными эталонами. Это не означает, что препарат обязательно неверен: иной обоснованный ответ требует отдельной сверки.'};
}
