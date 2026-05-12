import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'

export interface Format {
  guid: string
  name: string
  maxgames: number
}

interface FormatsState {
  data: Format[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: FormatsState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchFormats = createAsyncThunk<
  Format[],
  void,
  { rejectValue: string; state: { user: { role: string | null } } }
>('formats/fetch', async (_, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const data = await switchboard<Format[]>('Formats_Out', {}, roles)
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch formats')
  return data.Data ?? []
})

const formatsSlice = createSlice({
  name: 'formats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormats.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFormats.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload
      })
      .addCase(fetchFormats.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export default formatsSlice.reducer
