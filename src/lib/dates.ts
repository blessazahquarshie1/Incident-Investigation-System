const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Always display in UTC (Ghana uses GMT = UTC year-round)
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${day} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const timeStr = d.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return timeStr.toLowerCase().replace(' ', '')
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${formatDate(iso)} at ${formatTime(iso)}`
}
