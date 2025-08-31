export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers: any = { 'Content-Type': 'application/json', ...(options.headers||{}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
