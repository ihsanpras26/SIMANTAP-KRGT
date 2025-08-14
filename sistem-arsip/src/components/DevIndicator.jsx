import { useState, useEffect } from 'react'

export default function DevIndicator() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    if (import.meta.hot) {
      // Listen for HMR updates
      import.meta.hot.on('vite:beforeUpdate', () => {
        setIsUpdating(true)
        setUpdateCount(prev => prev + 1)
      })

      import.meta.hot.on('vite:afterUpdate', () => {
        setTimeout(() => setIsUpdating(false), 1000)
      })

      // CSS-specific updates
      import.meta.hot.on('vite:invalidate', () => {
        setIsUpdating(true)
        setTimeout(() => setIsUpdating(false), 800)
      })
    }
  }, [])

  if (!isUpdating && updateCount === 0) return null

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isUpdating ? 'scale-100 opacity-100' : 'scale-95 opacity-70'
    }`}>
      <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
        isUpdating 
          ? 'bg-primary-500 text-white' 
          : 'bg-green-500 text-white'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isUpdating ? 'bg-white animate-pulse' : 'bg-white'
        }`} />
        {isUpdating ? 'Memperbarui...' : 'Diperbarui!'}
      </div>
    </div>
  )
}