const fs = require('fs');
const exercises = JSON.parse(fs.readFileSync('./data/exercises-complete.json'));

const ptNames = {
  'Dumbbell Shoulder Press': 'Desenvolvimento com Halteres',
  'Incline Dumbbell Press': 'Supino Inclinado com Halteres',
  'Machine Chest Press': 'Supino Reto na Máquina',
  'Dumbbell Front Raise': 'Elevação Frontal',
  'Cable Rope Overhead Pulldown': 'Pullover com Corda',
  'EZ Bar Curl': 'Rosca Direta Barra W'
};

const translated = exercises
  .map(ex => ({
    id: ex.id || Date.now().toString(),
    name: ptNames[ex.name] || ex.name,
    target_muscle: ex.target || 'Geral',
    equipment: ex.equipment || 'Livre',
    gif_url: ex.gifUrl || ex.image || '',
    body_part: ex.bodyPart || 'Full body'
  }))
  .filter(ex => ex.gif_url && ex.name)
  .slice(0, 200); // Primeiros 200 com GIF

fs.writeFileSync('./data/exercises-ready.json', JSON.stringify(translated, null, 2));
console.log(`✅ PRONTO! ${translated.length} exercícios para seed salvos em data/exercises-ready.json`);
