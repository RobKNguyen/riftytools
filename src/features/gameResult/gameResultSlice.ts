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
  OppUser_GUID?: string
  LegendUserVariant_GUID?: string
  LegendOppVariant_GUID?: string
  Notes?: string
}

export interface GameResultFormState {
  Format_GUID: string
  LegendUser_GUID: string
  LegendOpp_GUID: string
  OppUser_GUID: string
  WentFirst: boolean
  ResultFirst: string
  ResultSecond: string
  ResultThird: string
  LegendUserVariant_GUID: string
  LegendOppVariant_GUID: string
  Notes: string
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
  OppUser_GUID: '',
  WentFirst: true,
  ResultFirst: '',
  ResultSecond: '',
  ResultThird: '',
  LegendUserVariant_GUID: '',
  LegendOppVariant_GUID: '',
  Notes: '',
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
  { rejectValue: string; state: { user: { role: string | null } } }
>('gameResult/submit', async (payload, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const body: Record<string, string | boolean | number | null> = {
    Format_GUID: payload.Format_GUID,
    User_GUID: payload.User_GUID,
    LegendUser_GUID: payload.LegendUser_GUID,
    LegendOpp_GUID: payload.LegendOpp_GUID,
    WentFirst: payload.WentFirst,
    ResultType_GUID: payload.ResultType_GUID,
    ResultFirst: payload.ResultFirst,
    ResultSecond: payload.ResultSecond,
    ResultThird: payload.ResultThird,
  }
  if (payload.OppUser_GUID) body['OppUser_GUID'] = payload.OppUser_GUID
  if (payload.LegendUserVariant_GUID) body['LegendUserVariant_GUID'] = payload.LegendUserVariant_GUID
  if (payload.LegendOppVariant_GUID) body['LegendOppVariant_GUID'] = payload.LegendOppVariant_GUID
  if (payload.Notes) body['Notes'] = payload.Notes
  const data = await switchboard<never>('GameResult_In', body, roles)
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
