import { createSlice } from '@reduxjs/toolkit'

const readBool = (key, def) => {
  try {
    const v = localStorage.getItem(key)
    if (v === null || v === undefined) return def
    return v === 'true'
  } catch {
    return def
  }
}

const initialState = {
  sidebarShow: readBool('ui.sidebar.show', true),
  sidebarUnfoldable: readBool('ui.sidebar.unfoldable', true),
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    setSidebarShow(state, action) {
      state.sidebarShow = action.payload
  try { localStorage.setItem('ui.sidebar.show', String(state.sidebarShow)) } catch {}
    },
    setSidebarUnfoldable(state, action) {
      state.sidebarUnfoldable = action.payload
  try { localStorage.setItem('ui.sidebar.unfoldable', String(state.sidebarUnfoldable)) } catch {}
    },
  },
})

export const { setSidebarShow, setSidebarUnfoldable } = sidebarSlice.actions
export default sidebarSlice.reducer
