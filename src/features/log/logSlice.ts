import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { SWITCHBOARD_URL } from '../../services/switchboard'

export interface GameResult {
  guid: string
  username: string
  user_guid: string
  oppusername: string | null
  oppuser_guid: string | null
  legenduser: string
  legenduserimage: string
  legendopp: string
  legendoppimage: string
  format: string
  wentfirst: boolean
  overallresult: string
  game1: string
  game2: string | null
  game3: string | null
  playedon: string
  createdon: string
  format_guid?: string
  legenduser_guid?: string
  legendopp_guid?: string
  resultfirst?: string
  resultsecond?: string | null
  resultthird?: string | null
}

interface LogState {
  items: GameResult[]
  offset: number
  hasMore: boolean
  status: 'idle' | 'loading' | 'loadingMore' | 'success' | 'error'
  error: string | null
  userGuidFilter: string | null
  myGames: boolean
}

const LIMIT = 50

const initialState: LogState = {
  items: [],
  offset: 0,
  hasMore: true,
  status: 'idle',
  error: null,
  userGuidFilter: null,
  myGames: false,
}

export const fetchGameResults = createAsyncThunk<
  { results: GameResult[]; offset: number },
  { offset: number; userGuidFilter?: string | null },
  { rejectValue: string; state: { user: { role: string | null } } }
>('log/fetch', async ({ offset, userGuidFilter }, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const payload: Record<string, string | number> = { Offset: offset, Limit: LIMIT }
  if (userGuidFilter) payload['User_GUID'] = userGuidFilter
  const res = await fetch(SWITCHBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TaskType: 'GameResults_Out', Payload: payload, Roles: roles }),
  })
  const data = (await res.json()) as { Success: boolean; Error?: string; Data?: GameResult[] }
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch results')
  return { results: data.Data ?? [], offset }
})

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    resetLog(state) {
      state.items = []
      state.offset = 0
      state.hasMore = true
      state.status = 'idle'
      state.error = null
      state.userGuidFilter = null
      state.myGames = false
    },
    removeResult(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.guid !== action.payload)
    },
    setFilter(
      state,
      action: PayloadAction<{ userGuidFilter: string | null; myGames: boolean }>,
    ) {
      state.userGuidFilter = action.payload.userGuidFilter
      state.myGames = action.payload.myGames
      state.items = []
      state.offset = 0
      state.hasMore = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGameResults.pending, (state, action) => {
        state.error = null
        state.status = action.meta.arg.offset === 0 ? 'loading' : 'loadingMore'
      })
      .addCase(fetchGameResults.fulfilled, (state, action) => {
        const { results, offset } = action.payload
        state.status = 'success'
        if (offset === 0) {
          state.items = results
        } else {
          state.items.push(...results)
        }
        state.offset = offset + results.length
        state.hasMore = results.length >= LIMIT
      })
      .addCase(fetchGameResults.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export const { resetLog, removeResult, setFilter } = logSlice.actions
export default logSlice.reducer
