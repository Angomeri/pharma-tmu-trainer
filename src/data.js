/**
 * PHARMA TMU — учебные задания, этап 1.
 * Данные заданий (препарат, форма, количество, способ применения) взяты из
 * «Методические указания для самоподготовки ... по фармакологии», ТюмГМУ, 2024,
 * стр. 9–11. Латинские рецептурные прописи составлены для тренажёра и подлежат
 * преподавательской верификации до официального применения.
 * НЕ используйте примеры как клинические назначения.
 */
export const DATA_VERSION = '2024-tmu-methodic-v0.1';
export const SOURCE_TITLE = 'Методические указания Тюменского ГМУ · Лечебное дело · 2024';
const source = (page, task) => ({ title: SOURCE_TITLE, page, task, reviewed: 'Учебное задание сверено; латинская пропись — демонстрационный эталон' });

/**
 * @typedef {Object} RecipeExercise
 * @property {string} id
 * @property {string} name
 * @property {string} group
 * @property {string} subgroup
 * @property {string} assignment
 * @property {string} difficulty
 * @property {string[]} drugAliases Latin genitive / valid Latin names in prescription body
 * @property {string} form solution|tablet|dragee|powder|ointment|paste|bulk
 * @property {{value:number,unit:'g'|'percent'}} dose
 * @property {{value:number,unit:'g'|'ml'}=} packageSize
 * @property {number=} numberOfDoses
 * @property {string=} dispensing amp|portions|tab|dragee
 * @property {string[][]} sigGroups Every group needs one acceptable phrase.
 * @property {string} answer
 * @property {{title:string,page:number,task:string,reviewed:string}} source
 */

/** @type {RecipeExercise[]} */
export const RECIPES = [
  {
    id:'atropine-amp', name:'Атропина сульфат', group:'Вегетативная нервная система', subgroup:'М-холиноблокаторы', difficulty:'Средняя',
    assignment:'Выписать 10 ампул по 1 мл 0,1% раствора атропина сульфата. Назначить по 1 мл подкожно.',
    drugAliases:['Atropini sulfatis'], form:'solution', dose:{value:0.1,unit:'percent'}, packageSize:{value:1,unit:'ml'}, numberOfDoses:10, dispensing:'amp',
    sigGroups:[['1 мл','1 ml','1мл'],['подкожно','п/к']],
    answer:'Rp.: Sol. Atropini sulfatis 0,1% — 1 ml\nD.t.d. N. 10 in amp.\nS. По 1 мл подкожно.',
    source:source(10,'Занятие № 2, жидкие формы, задача 5')
  },
  {
    id:'pancreatin-powder', name:'Панкреатин', group:'Средства для ЖКТ', subgroup:'Ферментные препараты', difficulty:'Средняя',
    assignment:'Выписать 20 порошков панкреатина по 0,5 г. Назначить по 1 порошку 3 раза в день перед едой.',
    drugAliases:['Pancreatini'], form:'powder', dose:{value:0.5,unit:'g'}, numberOfDoses:20, dispensing:'portions',
    sigGroups:[['1 порошку','1 порошок','по одному порошку'],['3 раза','три раза','3 р/д'],['перед едой','до еды']],
    answer:'Rp.: Pancreatini 0,5\nD.t.d. N. 20\nS. По 1 порошку 3 раза в день перед едой.',
    source:source(9,'Занятие № 1, твёрдые формы, задача 3')
  },
  {
    id:'phenobarbital-powder', name:'Фенобарбитал', group:'Средства, влияющие на ЦНС', subgroup:'Снотворные средства', difficulty:'Средняя',
    assignment:'Выписать 10 порошков фенобарбитала по 0,05 г. Назначить по 1 порошку за 30 минут до сна.',
    drugAliases:['Phenobarbitali'], form:'powder', dose:{value:0.05,unit:'g'}, numberOfDoses:10, dispensing:'portions',
    sigGroups:[['1 порошку','1 порошок'],['30 минут','полчаса','30 мин'],['до сна','перед сном']],
    answer:'Rp.: Phenobarbitali 0,05\nD.t.d. N. 10\nS. По 1 порошку за 30 минут до сна.',
    source:source(9,'Занятие № 1, твёрдые формы, задача 4')
  },
  {
    id:'diazolin-dragee', name:'Диазолин', group:'Антигистаминные средства', subgroup:'Блокаторы H₁-рецепторов', difficulty:'Лёгкая',
    assignment:'Выписать 10 драже диазолина по 0,1 г. Назначить по 1 драже 2 раза в день.',
    drugAliases:['Diazolini'], form:'dragee', dose:{value:0.1,unit:'g'}, numberOfDoses:10, dispensing:'dragee',
    sigGroups:[['1 драже','одному драже'],['2 раза','два раза','2 р/д']],
    answer:'Rp.: Dragee Diazolini 0,1 N. 10\nD.S. По 1 драже 2 раза в день.',
    source:source(9,'Занятие № 1, твёрдые формы, задача 9')
  },
  {
    id:'lasolvan-tablet', name:'Лазолван', group:'Средства для дыхательной системы', subgroup:'Муколитики', difficulty:'Лёгкая',
    assignment:'Выписать 20 таблеток лазолвана по 0,03 г. Назначить по 1 таблетке 3 раза в день.',
    drugAliases:['Lasolvani'], form:'tablet', dose:{value:0.03,unit:'g'}, numberOfDoses:20, dispensing:'tab',
    sigGroups:[['1 таблетке','1 таблетку','1 таб'],['3 раза','три раза','3 р/д']],
    answer:'Rp.: Tab. Lasolvani 0,03 N. 20\nD.S. По 1 таблетке 3 раза в день.',
    source:source(9,'Занятие № 1, твёрдые формы, задача 7')
  },
  {
    id:'streptocide-ointment', name:'Стрептоцид', group:'Наружные лекарственные формы', subgroup:'Мази', difficulty:'Средняя',
    assignment:'Выписать 50,0 г мази стрептоцида 10%. Назначить для нанесения на поражённые участки кожи.',
    drugAliases:['Streptocidi'], form:'ointment', dose:{value:10,unit:'percent'}, packageSize:{value:50,unit:'g'},
    sigGroups:[['наносить','смазывать'],['кожи','участки','поражённые','пораженные']],
    answer:'Rp.: Ung. Streptocidi 10% — 50,0\nD.S. Наносить на поражённые участки кожи.',
    source:source(10,'Занятие № 1, мягкие формы, задача 1')
  },
  {
    id:'salicylic-paste', name:'Кислота салициловая', group:'Наружные лекарственные формы', subgroup:'Пасты', difficulty:'Средняя',
    assignment:'Выписать 50,0 г пасты салициловой кислоты 10%. Назначить для нанесения на поражённый участок кожи.',
    drugAliases:['Acidi salicylici'], form:'paste', dose:{value:10,unit:'percent'}, packageSize:{value:50,unit:'g'},
    sigGroups:[['наносить','смазывать'],['кожу','кожи','участок','поражённый','пораженный']],
    answer:'Rp.: Pastae Acidi salicylici 10% — 50,0\nD.S. Наносить на поражённый участок кожи.',
    source:source(10,'Занятие № 1, мягкие формы, задача 2')
  },
  {
    id:'ethacridine-solution', name:'Этакридина лактат', group:'Растворы', subgroup:'Наружные растворы', difficulty:'Средняя',
    assignment:'Выписать 500 мл 0,1% раствора этакридина лактата для обработки ран.',
    drugAliases:['Aethacridini lactatis'], form:'solution', dose:{value:0.1,unit:'percent'}, packageSize:{value:500,unit:'ml'},
    sigGroups:[['ран','раны'],['обработки','обрабатывать','промывания','промывать']],
    answer:'Rp.: Sol. Aethacridini lactatis 0,1% — 500 ml\nD.S. Для обработки ран.',
    source:source(10,'Занятие № 2, жидкие формы, задача 1')
  },
  {
    id:'glucose-solution', name:'Глюкоза', group:'Растворы', subgroup:'Инфузионные растворы', difficulty:'Сложная',
    assignment:'Выписать 500 мл стерильного 5% раствора глюкозы. Назначить внутривенно капельно.',
    drugAliases:['Glucosi','Glucosae'], form:'solution', dose:{value:5,unit:'percent'}, packageSize:{value:500,unit:'ml'}, requireSterile:true,
    sigGroups:[['внутривенно','в/в'],['капельно','инфузионно']],
    answer:'Rp.: Sol. Glucosi 5% — 500 ml\nSterilisetur!\nD.S. Внутривенно капельно.',
    source:source(11,'Занятие № 2, формы для инъекций, задача 6')
  },
  {
    id:'streptocide-powder', name:'Стрептоцид (присыпка)', group:'Наружные лекарственные формы', subgroup:'Присыпки', difficulty:'Лёгкая',
    assignment:'Выписать 30,0 г присыпки из стрептоцида. Назначить для нанесения на рану.',
    drugAliases:['Streptocidi'], form:'bulk', dose:{value:30,unit:'g'},
    sigGroups:[['рану','раны'],['наносить','нанесения','присыпать']],
    answer:'Rp.: Streptocidi 30,0\nD.S. Для нанесения на рану.',
    source:source(9,'Занятие № 1, твёрдые формы, задача 1')
  }
];
export const GROUPS = ['Все группы',...new Set(RECIPES.map(item=>item.group))];
export function getRecipe(id){return RECIPES.find(r=>r.id===id);}
