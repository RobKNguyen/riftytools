import { configureStore } from '@reduxjs/toolkit'
import gameResultReducer from '../features/gameResult/gameResultSlice'
import matrixReducer from '../features/matrix/matrixSlice'
import legendsReducer from '../features/legends/legendsSlice'
import formatsReducer from '../features/formats/formatsSlice'
import legendVariantsReducer from '../features/legendVariants/legendVariantSlice'
import userReducer from '../features/user/userSlice'
import adminReducer from '../features/admin/adminSlice'
import logReducer from '../features/log/logSlice'
import profileReducer from '../features/profile/profileSlice'
import usersReducer from '../features/users/usersSlice'
import analyticsReducer from '../features/analytics/analyticsSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    gameResult: gameResultReducer,
    matrix: matrixReducer,
    legends: legendsReducer,
    formats: formatsReducer,
    legendVariants: legendVariantsReducer,
    admin: adminReducer,
    log: logReducer,
    profile: profileReducer,
    users: usersReducer,
    analytics: analyticsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
