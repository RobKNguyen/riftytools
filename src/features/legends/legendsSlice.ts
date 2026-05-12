import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'

export interface Legend {
  guid: string
  name: string
  imageurl: string
  colordomainfirst: string
  colordomainfirstcolor: string
  colordomainsecond: string
  colordomainsecondcolor: string
}

interface LegendsState {
  data: Legend[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: LegendsState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchLegends = createAsyncThunk<
  Legend[],
  void,
  { rejectValue: string }
>('legends/fetch', async (_, { rejectWithValue }) => {
  const data = await switchboard<Legend[]>('Legends_Out')
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch legends')
  return data.Data ?? []
})

const legendsSlice = createSlice({
  name: 'legends',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLegends.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchLegends.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload
      })
      .addCase(fetchLegends.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export default legendsSlice.reducer
