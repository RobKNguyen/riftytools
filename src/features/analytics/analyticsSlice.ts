import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SWITCHBOARD_URL } from '../../services/switchboard'

export interface PlayerStat {
  user_guid: string
  username: string
  level: string
  totalgames: number
  wins: number
  losses: number
  draws: number
  winrate: number
  wentfirst_games: number
  wentfirst_wins: number
  wentfirst_winrate: number
  wentsecond_games: number
  wentsecond_wins: number
  wentsecond_winrate: number
}

export interface LegendStat {
  user_guid: string
  username: string
  legend_guid: string
  legend: string
  imageurl: string
  totalgames: number
  wins: number
  losses: number
  draws: number
  winrate: number
  wentfirst_games: number
  wentfirst_wins: number
  wentfirst_winrate: number
  wentsecond_games: number
  wentsecond_wins: number
  wentsecond_winrate: number
}

export interface AnalyticsFilters {
  formatGuid: string | null
  proOnly?: boolean
}

interface AnalyticsState {
  players: PlayerStat[]
  legends: LegendStat[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: AnalyticsState = {
  players: [],
  legends: [],
  status: 'idle',
  error: null,
}

export const fetchAnalytics = createAsyncThunk<
  { players: PlayerStat[]; legends: LegendStat[] },
  AnalyticsFilters,
  { rejectValue: string; state: { user: { role: string | null } } }
>('analytics/fetch', async ({ formatGuid, proOnly }, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const payload: Record<string, string | boolean> = {}
  if (formatGuid) payload['Format_GUID'] = formatGuid
  if (proOnly) payload['ProOnly'] = true
  const res = await fetch(SWITCHBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TaskType: 'Analytics_Out', Payload: payload, Roles: roles }),
  })
  const raw = (await res.json()) as {
    Success: boolean
    Error?: string
    Players?: PlayerStat[]
    Legends?: LegendStat[]
  }
  if (!raw.Success) return rejectWithValue(raw.Error ?? 'Failed to fetch analytics')
  return {
    players: raw.Players ?? [],
    legends: raw.Legends ?? [],
  }
})

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = 'success'
        state.players = action.payload.players
        state.legends = action.payload.legends
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export default analyticsSlice.reducer
