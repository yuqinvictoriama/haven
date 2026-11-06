import { useEffect, useState } from 'react'

// Tiny history router. Routes are plain paths; query is a URLSearchParams.
function read() {
  return { path: window.location.pathname, query: new URLSearchParams(window.location.search) }
}

const listeners = new Set()

export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState({ haven: true }, '', to)
  else window.history.pushState({ haven: true }, '', to)
  const loc = read()
  listeners.forEach((l) => l(loc))
}

// Go back if the previous entry was created inside the app, else go to a fallback route.
export function back(fallback = '/') {
  if (window.history.state && window.history.state.haven && window.history.length > 1) window.history.back()
  else navigate(fallback, { replace: true })
}

export function useRoute() {
  const [loc, setLoc] = useState(read)
  useEffect(() => {
    const onPop = () => setLoc(read())
    window.addEventListener('popstate', onPop)
    listeners.add(setLoc)
    return () => {
      window.removeEventListener('popstate', onPop)
      listeners.delete(setLoc)
    }
  }, [])
  return loc
}
