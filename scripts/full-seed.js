const fs = require('fs');
const exercises = JSON.parse(fs.readFileSync('./data/exercises-complete.json'));

const translated = exercises.map((ex, i) => ({
  id: i + 1,
  name: ex.name,
  target_muscle: ex.primaryMuscles[0] || 'Geral',
  equipment: ex.equipment === 'body only' ? 'Peso corporal' : ex.equipment,
  instructions: ex.instructions ? ex.instructions.join(' ') : '',
  image_url: ex.images && ex.images[0] ? ex.images[0] : '',
  category: ex.category
}));

fs.writeFileSync('./data/exercises-full.json', JSON.stringify(translated, null, 2));
console.log(`✅ ${translated.length} TODOS exercícios salvos em data/exercises-full.json`);
