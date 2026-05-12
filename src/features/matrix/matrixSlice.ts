import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface SwitchboardResponse {
  Success: boolean
  Error?: string
  Data?: MatrixEntry[]
}

export interface MatrixEntry {
  LegendUser_GUID: string
  LegendOpp_GUID: string
  Wins: number
  Losses: number
  Draws: number
}

interface MatrixState {
  data: MatrixEntry[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: MatrixState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchMatrix = createAsyncThunk<
  MatrixEntry[],
  void,
  { rejectValue: string }
>('matrix/fetch', async (_, { rejectWithValue }) => {
  const res = await fetch('/switchboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ TaskType: 'Matrix_Get', Payload: {}, Roles: [] }),
  })
  const data: SwitchboardResponse = await res.json()
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch matrix')
  return data.Data ?? []
})

const matrixSlice = createSlice({
  name: 'matrix',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatrix.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMatrix.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload
      })
      .addCase(fetchMatrix.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export default matrixSlice.reducer
