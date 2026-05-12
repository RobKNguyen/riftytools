import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SWITCHBOARD_URL } from '../../services/switchboard'

interface UserSyncResponse {
  Success: boolean
  Error?: string
  GUID: string
  Status: string
  Role: string
}

interface UserState {
  clerkID: string | null
  guid: string | null
  status: string | null
  role: string | null
  username: string | null
  synced: boolean
  syncStatus: 'idle' | 'loading' | 'success' | 'error'
  syncError: string | null
}

const initialState: UserState = {
  clerkID: null,
  guid: null,
  status: null,
  role: null,
  username: null,
  synced: false,
  syncStatus: 'idle',
  syncError: null,
}

export const syncUser = createAsyncThunk<
  UserSyncResponse,
  { clerkID: string; username: string; email: string },
  { rejectValue: string }
>('user/sync', async ({ clerkID, username, email }, { rejectWithValue }) => {
  const res = await fetch(SWITCHBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      TaskType: 'User_Sync',
      Payload: { ClerkID: clerkID, Username: username, Email: email },
      Roles: [],
    }),
  })
  const data = (await res.json()) as UserSyncResponse
  if (!data.Success) return rejectWithValue(data.Error ?? 'User sync failed')
  return data
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser(state) {
      state.clerkID = null
      state.guid = null
      state.status = null
      state.role = null
      state.username = null
      state.synced = false
      state.syncStatus = 'idle'
      state.syncError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUser.pending, (state) => {
        state.syncStatus = 'loading'
        state.syncError = null
      })
      .addCase(syncUser.fulfilled, (state, action) => {
        state.syncStatus = 'success'
        state.synced = true
        state.guid = action.payload.GUID
        state.status = action.payload.Status
        state.role = action.payload.Role
        state.clerkID = action.meta.arg.clerkID
        state.username = action.meta.arg.username
      })
      .addCase(syncUser.rejected, (state, action) => {
        state.syncStatus = 'error'
        state.syncError = action.payload ?? 'Unknown error'
      })
  },
})

export const { clearUser } = userSlice.actions
export default userSlice.reducer
