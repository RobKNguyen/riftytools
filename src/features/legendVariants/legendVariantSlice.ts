import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'

export interface LegendVariant {
  guid: string
  name: string
  legend_guid: string | null
  legendname: string | null
}

interface LegendVariantState {
  data: LegendVariant[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: LegendVariantState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchLegendVariants = createAsyncThunk<
  LegendVariant[],
  void,
  { rejectValue: string; state: { user: { role: string | null } } }
>('legendVariants/fetch', async (_, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const data = await switchboard<LegendVariant[]>('LegendVariants_Out', {}, roles)
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch legend variants')
  return data.Data ?? []
})

const legendVariantSlice = createSlice({
  name: 'legendVariants',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLegendVariants.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchLegendVariants.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload
      })
      .addCase(fetchLegendVariants.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export default legendVariantSlice.reducer
