export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })
}
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })
}
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}
