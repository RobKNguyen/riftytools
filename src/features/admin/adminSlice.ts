import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'

export interface AdminUser {
  guid: string
  username: string
  email: string
  status: string
  role: string
  createdon: string
}

interface AdminState {
  users: AdminUser[]
  fetchStatus: 'idle' | 'loading' | 'success' | 'error'
  fetchError: string | null
  updating: Record<string, boolean>
}

const initialState: AdminState = {
  users: [],
  fetchStatus: 'idle',
  fetchError: null,
  updating: {},
}

export const fetchUsers = createAsyncThunk<
  AdminUser[],
  void,
  { rejectValue: string }
>('admin/fetchUsers', async (_, { rejectWithValue }) => {
  const data = await switchboard<AdminUser[]>('Users_Out', {}, ['Admin'])
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch users')
  return data.Data ?? []
})

export const updateUserStatus = createAsyncThunk<
  { guid: string; status: string },
  { guid: string; status: 'Approved' | 'Rejected' },
  { rejectValue: string }
>('admin/updateUserStatus', async ({ guid, status }, { rejectWithValue }) => {
  const data = await switchboard('User_Status_In', { GUID: guid, Status: status }, ['Admin'])
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to update user')
  return { guid, status }
})

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.fetchStatus = 'loading'
        state.fetchError = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.fetchStatus = 'success'
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.fetchStatus = 'error'
        state.fetchError = action.payload ?? 'Unknown error'
      })
      .addCase(updateUserStatus.pending, (state, action) => {
        state.updating[action.meta.arg.guid] = true
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        delete state.updating[action.payload.guid]
        const user = state.users.find((u) => u.guid === action.payload.guid)
        if (user) user.status = action.payload.status
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        delete state.updating[action.meta.arg.guid]
      })
  },
})

export default adminSlice.reducer
