import test from 'node:test';
import assert from 'node:assert/strict';
import {BANK, BANK_TOPICS, BANK_QUESTION_BY_ID, BANK_TEMPLATE_BY_ID} from '../src/bank-data.js';
import {judgeDrugChoice,drugAliases} from '../src/bank-eval.js';
test('Импортировано 40 вопросов, 32 шаблона, четыре фармакологические группы',()=>{
  assert.equal(BANK.questions.length,40);assert.equal(BANK.templates.length,32);assert.equal(BANK_TOPICS.length,4);
  assert.equal(new Set(BANK.questions.map(x=>x.id)).size,40);
  assert.equal(new Set(BANK.templates.map(x=>x.id)).size,32);
});
test('Каждый вопрос связан с шаблоном, без потерянных источников и эталонов',()=>{
  for(const q of BANK.questions){
    const t=BANK_TEMPLATE_BY_ID.get(q.target_template_id);
    assert.ok(t,'missing '+q.id+': '+q.target_template_id);
    assert.ok(q.reference_prescription.includes('Rp.:'),q.id);
    assert.ok(q.sources.length>0,q.id);
    assert.equal(q.strict_full_recipe_autograding,false,q.id);
    for(const s of q.sources)assert.ok(BANK.sources[s.source_id],q.id);
    for(const alt of q.acceptable_alternative_template_ids) assert.ok(BANK_TEMPLATE_BY_ID.has(alt),q.id);
  }
});
test('Статусы исходного архива сохранены',()=>{
  assert.equal(BANK.questions.filter(x=>x.status==='verified').length,37);
  assert.equal(BANK.questions.filter(x=>x.status==='needs_review').length,3);
  assert.equal(BANK.templates.filter(x=>x.status==='needs_review').length,3);
});
test('Основной препарат проходит строгое совпадение',()=>{
  const q=BANK_QUESTION_BY_ID.get('RX-001');
  assert.equal(judgeDrugChoice('Прозерин',q,BANK_TEMPLATE_BY_ID).status,'accepted');
  assert.equal(judgeDrugChoice('неостигмина метилсульфат',q,BANK_TEMPLATE_BY_ID).status,'accepted');
});
test('Альтернатива допустима только для общей формулировки',()=>{
  const q=BANK_QUESTION_BY_ID.get('RX-001');
  assert.equal(judgeDrugChoice('Ацеклидин',q,BANK_TEMPLATE_BY_ID,{strict:true}).status,'unconfirmed');
  assert.equal(judgeDrugChoice('Ацеклидин',q,BANK_TEMPLATE_BY_ID,{strict:false}).status,'alternative');
});
test('Неуточнённое название не принимается подстрокой',()=>{
  const q=BANK_QUESTION_BY_ID.get('RX-001');
  assert.equal(judgeDrugChoice('Прозе',q,BANK_TEMPLATE_BY_ID).status,'unconfirmed');
});
test('Непроверенное задание не получает автоматическую оценку',()=>{
  const q=BANK_QUESTION_BY_ID.get('RX-008');
  assert.equal(judgeDrugChoice(q.expected_drug,q,BANK_TEMPLATE_BY_ID).status,'review');
});
test('Другие ответы не объявляются категорически неправильными',()=>{
  const q=BANK_QUESTION_BY_ID.get('RX-001');
  assert.equal(judgeDrugChoice('Совершенно другой препарат',q,BANK_TEMPLATE_BY_ID).status,'unconfirmed');
});
test('32 шаблона имеют рецепты и источники',()=>{
  for(const t of BANK.templates){assert.ok(t.reference_prescription.length>10);assert.ok(t.sources.length>0);assert.ok(t.drug.length>2);}
});
