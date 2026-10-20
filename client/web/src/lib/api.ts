// Thin fetch wrapper for the Rust API. In dev, Vite proxies /api to the server (see vite.config.ts).
const BASE = '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${detail}`)
  }
  return (await res.json()) as T
}