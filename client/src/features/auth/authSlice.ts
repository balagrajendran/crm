import { createSlice } from '@reduxjs/toolkit'

type User = { id:number; name:string; email:string; role:string } | null

const initialState: { user: User; token: string | null } = {
  user: JSON.parse(localStorage.getItem('user')||'null'),
  token: localStorage.getItem('token'),
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state){
      state.user = null
      state.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }
})

export const selectUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}

export const { logout } = slice.actions
export default slice.reducer
