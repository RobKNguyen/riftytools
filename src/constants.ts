export const WIN_GUID  = '3801fd47-14ee-4817-b673-d2c4e35e6f48'
export const LOSS_GUID = '0c92acd6-4e3f-413a-9518-84b806c0d629'
export const DRAW_GUID = '480a9d4e-e6a9-4c76-a422-c30f94bb942c'

export const RESULT_TYPES = [
  { label: 'Win',  guid: WIN_GUID  },
  { label: 'Loss', guid: LOSS_GUID },
  { label: 'Draw', guid: DRAW_GUID },
] as const

export const TEST_USER_GUID = 'ade470a6-bcb5-4b05-b862-28185b172cc0'

export function computeMatchResult(
  first: string,
  second: string,
  third: string,
  maxGames: number,
): string {
  if (!first) return ''
  if (maxGames <= 1) return first

  const games = [first, second, third].filter(Boolean)
  const wins   = games.filter(g => g === WIN_GUID).length
  const losses = games.filter(g => g === LOSS_GUID).length

  if (wins > losses) return WIN_GUID
  if (losses > wins) return LOSS_GUID
  return DRAW_GUID
}
