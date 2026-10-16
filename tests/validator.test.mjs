import test from 'node:test';
import assert from 'node:assert/strict';
import {RECIPES} from '../src/data.js';
import {validatePrescription,splitPrescription} from '../src/validator.js';
const find=id=>RECIPES.find(r=>r.id===id);
for(const r of RECIPES){
  test(`Эталон: ${r.id}`,()=>{
    const x=validatePrescription(r.answer,r);
    assert.equal(x.status,'correct',JSON.stringify(x.checks.filter(c=>!c.ok)));
    assert.equal(x.score,100);
  });
}
test('Отсутствующий Rp. даёт ошибку',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('Rp.:',''),r);assert.equal(x.checks.find(c=>c.key==='rp').ok,false)});
test('Ошибка концентрации 0,1% → 1% критическая',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('0,1%','1%'),r);assert.ok(x.critical.includes('dose'));assert.ok(x.score<=49);assert.notEqual(x.status,'correct');});
test('Неверный препарат не может быть засчитан',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('Atropini sulfatis','Scopolamini hydrobromidi'),r);assert.ok(x.critical.includes('drug'));assert.ok(x.score<=49)});
test('Неверный объём 1 ml → 2 ml критический',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('— 1 ml','— 2 ml'),r);assert.ok(x.critical.includes('package'));assert.ok(x.score<=49)});
test('Неверное количество ампул обнаруживается',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('N. 10','N. 20'),r);assert.equal(x.checks.find(c=>c.key==='quantity').ok,false)});
test('Отсутствие in amp. обнаруживается',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('in amp.',''),r);assert.equal(x.checks.find(c=>c.key==='form').ok,false)});
test('Отсутствие сигнатуры обнаруживается',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.split('\n').slice(0,2).join('\n'),r);assert.equal(x.checks.find(c=>c.key==='sig').ok,false)});
test('Неверный латинский падеж обнаруживается',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('Atropini sulfatis','Atropinum sulfas'),r);assert.ok(x.critical.includes('drug'))});
test('Десятичная точка вместо запятой допускается',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('0,1%','0.1%'),r);assert.equal(x.status,'correct')});
test('Вариант сигнатуры с сокращением подкожно допускается',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('подкожно','п/к'),r);assert.equal(x.status,'correct')});
test('Неверная доза порошка 0,05 вместо 0,5 распознаётся',()=>{const r=find('pancreatin-powder');const x=validatePrescription(r.answer.replace('0,5','0,05'),r);assert.ok(x.critical.includes('dose'))});
test('Признак стерильности обязателен для стерильного раствора',()=>{const r=find('glucose-solution');const x=validatePrescription(r.answer.replace('Sterilisetur!\n',''),r);assert.equal(x.checks.find(c=>c.key==='sterility').ok,false)});
test('Разделение частей рецепта в формате D.S. работает',()=>{const r=find('diazolin-dragee');const x=splitPrescription(r.answer);assert.ok(x.hasSignature);assert.ok(x.signature.includes('драже'));});
test('Неправильный объём нельзя компенсировать цифрой в сигнатуре',()=>{const r=find('atropine-amp');const x=validatePrescription(r.answer.replace('— 1 ml','— 2 ml'),r);assert.ok(x.critical.includes('package'))});
test('Ложное совпадение концентрации на второй строке не принимается',()=>{const r=find('atropine-amp');const bad=r.answer.replace('0,1%','1%\n0,1%');const x=validatePrescription(bad,r);assert.ok(x.critical.includes('dose'));});
test('Две конфликтующие концентрации на одной строке не принимаются',()=>{const r=find('atropine-amp');const bad=r.answer.replace('0,1%','1% 0,1%');const x=validatePrescription(bad,r);assert.ok(x.critical.includes('dose'));});
test('Две конфликтующие массы порошка не принимаются',()=>{const r=find('pancreatin-powder');const bad=r.answer.replace('0,5','0,05 0,5');const x=validatePrescription(bad,r);assert.ok(x.critical.includes('dose'));});
