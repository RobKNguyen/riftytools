import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { SWITCHBOARD_URL } from '../../services/switchboard'

export interface ProfileUserInfo {
  guid: string
  username: string
  email: string
  role: string
  status: string
  createdon: string
}

export interface ProfileStats {
  totalgames: number
  wins: number
  losses: number
  draws: number
  winrate: number
}

export interface TopLegend {
  legend: string
  imageurl: string
  totalgames: number
  wins: number
  losses: number
  winrate: number
}

export interface RecentResult {
  legenduser: string
  legenduserimage: string
  legendopp: string
  legendoppimage: string
  overallresult: string
  format: string
  playedon: string
}

export interface ProfileData {
  userinfo: ProfileUserInfo
  stats: ProfileStats
  toplegends: TopLegend[]
  recentresults: RecentResult[]
}

interface ProfileState {
  data: ProfileData | null
  currentGuid: string | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
}

const initialState: ProfileState = {
  data: null,
  currentGuid: null,
  status: 'idle',
  error: null,
}

export const fetchProfile = createAsyncThunk<
  { data: ProfileData; guid: string },
  string,
  { rejectValue: string; state: { user: { role: string | null } } }
>('profile/fetch', async (guid, { rejectWithValue, getState }) => {
  const role = getState().user.role
  const roles = role ? [role] : ['Player']
  const res = await fetch(SWITCHBOARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      TaskType: 'Profile_Out',
      Payload: { User_GUID: guid },
      Roles: roles,
    }),
  })
  const raw = (await res.json()) as {
    Success: boolean
    Error?: string
    UserInfo: ProfileUserInfo
    Stats: ProfileStats
    TopLegends: TopLegend[]
    RecentResults: RecentResult[]
  }
  if (!raw.Success) return rejectWithValue(raw.Error ?? 'Failed to fetch profile')
  return {
    guid,
    data: {
      userinfo: raw.UserInfo,
      stats: raw.Stats,
      toplegends: raw.TopLegends ?? [],
      recentresults: raw.RecentResults ?? [],
    },
  }
})

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.currentGuid = action.meta.arg
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload.data
        state.currentGuid = action.payload.guid
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unknown error'
      })
  },
})

export default profileSlice.reducer
