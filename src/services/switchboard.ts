const BASE = (import.meta.env.VITE_API_URL as string) + '/switchboard'

interface SwitchboardResponse<T = unknown> {
  Success: boolean
  Error?: string
  GUID?: string
  Data?: T
}

export async function switchboard<T = unknown>(
  taskType: string,
  payload: Record<string, string | boolean | number | null> = {}
): Promise<SwitchboardResponse<T>> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TaskType: taskType, Payload: payload, Roles: ['Player'] }),
  })
  return res.json() as Promise<SwitchboardResponse<T>>
}
