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

// Function to get initial sidebar state based on screen size
const getInitialSidebarShow = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return true

  const isMobile = window.innerWidth <= 768
  const storedValue = readBool('ui.sidebar.show', true)

  // On mobile, always start with sidebar hidden regardless of stored value
  // On desktop, use stored value or default to true
  return isMobile ? false : storedValue
}

const readPin = () => {
  try {
    const v = localStorage.getItem('ui.sidebar.pinned')
    if (v === null) return false // default NOT pinned
    return v === 'true'
  } catch {
    return false
  }
}

const initialState = {
  sidebarShow: getInitialSidebarShow(),
  // Treat "unfoldable" as the legacy narrow toggle (true => narrow/collapsed)
  sidebarUnfoldable: readBool('ui.sidebar.unfoldable', true),
  // New: explicit pinned state (desktop only). When pinned, hover will NOT auto-collapse.
  sidebarPinned: readPin(),
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    setSidebarShow(state, action) {
      state.sidebarShow = action.payload
      // Only store sidebar state for desktop to avoid mobile/desktop conflicts
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        try {
          localStorage.setItem('ui.sidebar.show', String(state.sidebarShow))
        } catch {}
      }
    },
    setSidebarUnfoldable(state, action) {
      state.sidebarUnfoldable = action.payload
      try {
        localStorage.setItem('ui.sidebar.unfoldable', String(state.sidebarUnfoldable))
      } catch {}
    },
    setSidebarPinned(state, action) {
      state.sidebarPinned = action.payload
      try {
        localStorage.setItem('ui.sidebar.pinned', String(state.sidebarPinned))
      } catch {}
    },
    // New action to sync sidebar state with screen size
    syncSidebarWithScreenSize(state) {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth <= 768
        if (isMobile) {
          // Always hide on mobile; pinned state irrelevant on mobile
          state.sidebarShow = false
        } else {
          // Desktop: show sidebar; narrow vs expanded decided by pinned state
          state.sidebarShow = true
          if (state.sidebarPinned) {
            // Expanded (not narrow)
            state.sidebarUnfoldable = false
          } else {
            // Keep in narrow/collapsed mode by default
            state.sidebarUnfoldable = true
          }
        }
      }
    },
  },
})

export const { setSidebarShow, setSidebarUnfoldable, setSidebarPinned, syncSidebarWithScreenSize } =
  sidebarSlice.actions
export default sidebarSlice.reducer
