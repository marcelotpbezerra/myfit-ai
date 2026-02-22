const fs = require('fs');
const exercises = JSON.parse(fs.readFileSync('./data/exercises-complete.json'));

const musclePt = {
  'abdominals': 'Abdominais',
  'calves': 'Panturrilhas',
  'biceps': 'Bíceps',
  'back': 'Dorsal',
  'chest': 'Peitoral',
  'forearms': 'Antebraços',
  'glutes': 'Glúteos',
  'hamstrings': 'Posteriores coxa',
  'lats': 'Dorsais',
  'pectorals': 'Peitoral',
  'quadriceps': 'Quadríceps',
  'shoulders': 'Ombros',
  'traps': 'Trapézio',
  'triceps': 'Tríceps'
};

const translated = exercises
  .filter(ex => ex.images && ex.images.length > 0) // Com imagem
  .map((ex, i) => ({
    id: i + 1,
    name: ex.name,
    target_muscle: musclePt[ex.primaryMuscles[0]] || ex.primaryMuscles[0] || 'Geral',
    equipment: ex.equipment === 'body only' ? 'Peso corporal' : ex.equipment,
    instructions: ex.instructions ? ex.instructions.join(' ') : '',
    image_url: ex.images[0],
    category: ex.category
  }))
  .slice(0, 300); // 300 melhores

fs.writeFileSync('./data/exercises-seed.json', JSON.stringify(translated, null, 2));
console.log(`✅ SEED PRONTO! ${translated.length} exercícios com imagens!`);
