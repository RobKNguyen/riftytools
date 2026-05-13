import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { switchboard } from '../../services/switchboard'
import { syncUser } from '../user/userSlice'

export interface AppUser {
  guid: string
  username: string
  email: string
  status: string
  role: string
}

interface UsersState {
  data: AppUser[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: UsersState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchUsers = createAsyncThunk<
  AppUser[],
  void,
  { rejectValue: string; state: { user: { role: string | null } } }
>('users/fetch', async (_, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const data = await switchboard<AppUser[]>('Users_Out', {}, roles)
  if (!data.Success) return rejectWithValue(data.Error ?? 'Failed to fetch users')
  return data.Data ?? []
})

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
      .addCase(syncUser.fulfilled, (state) => {
        // Role is now known — invalidate so the next mount re-fetches with correct permissions
        state.status = 'idle'
        state.data = []
      })
  },
})

export default usersSlice.reducer
