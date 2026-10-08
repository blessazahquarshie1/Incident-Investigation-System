const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Helper to write files
const writeFile = (filename, content) => fs.writeFileSync(path.join(dir, filename), content);

const travelTimes = `export function getTravelMinutes(cityA: string, cityB: string): number {
  if (cityA === cityB) return 0;
  const pair = [cityA, cityB].sort().join('-');
  const times: Record<string, number> = {
    'Accra-Tema': 45,
    'Accra-Kasoa': 50,
    'Accra-Takoradi': 270,
    'Accra-Kumasi': 300,
    'Accra-Cape Coast': 150,
    'Kasoa-Tema': 60,
    'Takoradi-Tema': 300,
    'Kumasi-Tema': 310,
    'Cape Coast-Kumasi': 170,
    'Cape Coast-Takoradi': 120,
  };
  return times[pair] || 90;
}`;

writeFile('travelTimes.ts', travelTimes);

const _generateArrayCode = (name, type, items) => {
  return `import type { ${type} } from '../types';\n\nexport const ${name}: ${type}[] = ${JSON.stringify(items, null, 2)};`;
};

// ... Let's populate the data directly.

