export function nextId(prefix: string, existingIds: string[]): string {
  const nums = existingIds
    .filter(id => id.startsWith(`${prefix}-`))
    .map(id => parseInt(id.split('-').at(-1) ?? '0', 10))
    .filter(n => !isNaN(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
