import { configureStore } from '@reduxjs/toolkit'
import { api } from '../services/api'
import authReducer from '../features/auth/authSlice'

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer, auth: authReducer },
  middleware: (g)=> g().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
