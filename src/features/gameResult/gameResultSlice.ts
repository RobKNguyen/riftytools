import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface SwitchboardResponse {
  Success: boolean
  GUID?: string
  Error?: string
  Message?: string
}

export interface GameResultPayload {
  Format_GUID: string
  User_GUID: string
  LegendUser_GUID: string
  LegendOpp_GUID: string
  WentFirst: boolean
  ResultType_GUID: string
  ResultFirst: string
  ResultSecond: string | null
  ResultThird: string | null
}

export interface GameResultFormState {
  Format_GUID: string
  LegendUser_GUID: string
  LegendOpp_GUID: string
  WentFirst: boolean
  ResultType_GUID: string
  ResultFirst: string
  ResultSecond: string
  ResultThird: string
}

interface GameResultState {
  form: GameResultFormState
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  lastGUID: string | null
}

const blankForm: GameResultFormState = {
  Format_GUID: '',
  LegendUser_GUID: '',
  LegendOpp_GUID: '',
  WentFirst: true,
  ResultType_GUID: '',
  ResultFirst: '',
  ResultSecond: '',
  ResultThird: '',
}

const initialState: GameResultState = {
  form: blankForm,
  status: 'idle',
  error: null,
  lastGUID: null,
}

export const submitGameResult = createAsyncThunk<
  SwitchboardResponse,
  GameResultPayload,
  { rejectValue: string }
>('gameResult/submit', async (payload, { rejectWithValue }) => {
  const res = await fetch('/switchboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      TaskType: 'GameResult_In',
      Payload: payload,
      Roles: [],
    }),
  })
  const data: SwitchboardResponse = await res.json()
  if (!data.Success) return rejectWithValue(data.Error ?? 'Submission failed')
  return data
})

const gameResultSlice = createSlice({
  name: 'gameResult',
  initialState,
  reducers: {
    updateField(state, action: PayloadAction<Partial<GameResultFormState>>) {
      state.form = { ...state.form, ...action.payload }
    },
    resetForm(state) {
      state.form = blankForm
      state.status = 'idle'
      state.error = null
      state.lastGUID = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitGameResult.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(submitGameResult.fulfilled, (state, action) => {
        state.status = 'success'
        state.lastGUID = action.payload.GUID ?? null
      })
      .addCase(submitGameResult.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export const { updateField, resetForm } = gameResultSlice.actions
export default gameResultSlice.reducer
