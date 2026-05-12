import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'

export interface MatrixCell {
  legenduser_guid: string
  legenduser: string
  legenduserimage: string
  legendopp_guid: string
  legendopp: string
  legendoppimage: string
  totalgames: number
  wins: number
  losses: number
  draws: number
  winrate: number
}

interface MatrixState {
  data: MatrixCell[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: MatrixState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchMatrix = createAsyncThunk<
  MatrixCell[],
  string | null,
  { rejectValue: string }
>('matrix/fetch', async (formatGuid, { rejectWithValue }) => {
  const payload: Record<string, string> = {}
  if (formatGuid) payload['Format_GUID'] = formatGuid
  const data = await switchboard<MatrixCell[]>('Matrix_Out', payload)
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
