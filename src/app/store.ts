import { configureStore } from '@reduxjs/toolkit'
import gameResultReducer from '../features/gameResult/gameResultSlice'
import matrixReducer from '../features/matrix/matrixSlice'

export const store = configureStore({
  reducer: {
    gameResult: gameResultReducer,
    matrix: matrixReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
