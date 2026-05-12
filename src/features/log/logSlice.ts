import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SWITCHBOARD_URL } from '../../services/switchboard'

export interface GameResult {
  guid: string
  username: string
  user_guid: string
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
}

interface LogState {
  items: GameResult[]
  offset: number
  hasMore: boolean
  status: 'idle' | 'loading' | 'loadingMore' | 'success' | 'error'
  error: string | null
}

const LIMIT = 50

const initialState: LogState = {
  items: [],
  offset: 0,
  hasMore: true,
  status: 'idle',
  error: null,
}

export const fetchGameResults = createAsyncThunk<
  { results: GameResult[]; offset: number },
  { offset: number },
  { rejectValue: string; state: { user: { role: string | null } } }
>('log/fetch', async ({ offset }, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const res = await fetch(SWITCHBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      TaskType: 'GameResults_Out',
      Payload: { Offset: offset, Limit: LIMIT },
      Roles: roles,
    }),
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

export const { resetLog } = logSlice.actions
export default logSlice.reducer
