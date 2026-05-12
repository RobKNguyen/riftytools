import { configureStore } from '@reduxjs/toolkit'
import gameResultReducer from '../features/gameResult/gameResultSlice'
import matrixReducer from '../features/matrix/matrixSlice'
import legendsReducer from '../features/legends/legendsSlice'
import formatsReducer from '../features/formats/formatsSlice'

export const store = configureStore({
  reducer: {
    gameResult: gameResultReducer,
    matrix: matrixReducer,
    legends: legendsReducer,
    formats: formatsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
