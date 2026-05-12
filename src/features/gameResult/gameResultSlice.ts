import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'

interface SubmitResponse {
  Success: boolean
  GUID?: string
  Error?: string
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
  SubmitResponse,
  GameResultPayload,
  { rejectValue: string }
>('gameResult/submit', async (payload, { rejectWithValue }) => {
  const data = await switchboard<never>('GameResult_In', {
    Format_GUID: payload.Format_GUID,
    User_GUID: payload.User_GUID,
    LegendUser_GUID: payload.LegendUser_GUID,
    LegendOpp_GUID: payload.LegendOpp_GUID,
    WentFirst: payload.WentFirst,
    ResultType_GUID: payload.ResultType_GUID,
    ResultFirst: payload.ResultFirst,
    ResultSecond: payload.ResultSecond,
    ResultThird: payload.ResultThird,
  })
  if (!data.Success) return rejectWithValue(data.Error ?? 'Submission failed')
  return { Success: data.Success, GUID: data.GUID }
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
