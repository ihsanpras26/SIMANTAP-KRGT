// Dev-only HMR enhancements to make updates feel smoother without manual refresh
if (import.meta.hot) {
  const hot = import.meta.hot

  // If Vite invalidates a module that cannot be hot-updated, force reload
  hot.on('vite:invalidate', () => {
    // Force a quick full reload if a module cannot be hot replaced
    location.reload()
  })

  // If the websocket disconnects and later reconnects, do a full reload
  let disconnectedAt = 0
  hot.on('vite:ws:disconnect', () => {
    disconnectedAt = Date.now()
  })
  hot.on('vite:ws:connect', () => {
    if (disconnectedAt) {
      location.reload()
    }
  })

  // Optional: when a CSS update happens, show a tiny console note
  hot.on('vite:beforeUpdate', (payload) => {
    const hasCss = payload?.updates?.some(u => u.type === 'css-update')
    if (hasCss) console.debug('[HMR] Applying CSS update...')
  })
  hot.on('vite:afterUpdate', () => {
    // No-op, but keeps a hook if we want to add UI feedback
  })
}