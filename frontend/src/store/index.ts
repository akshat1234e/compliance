// Simple store without Redux for now
export const store = {
  getState: () => ({}),
  dispatch: () => {},
  subscribe: () => () => {}
}

export type RootState = {}
export type AppDispatch = typeof store.dispatch