import { configureStore } from '@reduxjs/toolkit'
import gameResultReducer from '../features/gameResult/gameResultSlice'
import matrixReducer from '../features/matrix/matrixSlice'
import legendsReducer from '../features/legends/legendsSlice'
import formatsReducer from '../features/formats/formatsSlice'
import userReducer from '../features/user/userSlice'
import adminReducer from '../features/admin/adminSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    gameResult: gameResultReducer,
    matrix: matrixReducer,
    legends: legendsReducer,
    formats: formatsReducer,
    admin: adminReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
