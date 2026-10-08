export function getTravelMinutes(cityA: string, cityB: string): number {
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
}
