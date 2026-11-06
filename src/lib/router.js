import { useEffect, useState } from 'react'

// In-memory router. The visible web address never changes (always "/"), so browser
// history and the address bar never reveal the vault. Routes live in history.state so
// the Android back gesture and the in-app Back button still work.

const listeners = new Set()
let current = initial()

function parse(route) {
  const [path, qs = ''] = String(route || '/').split('?')
  return { path: path || '/', query: new URLSearchParams(qs) }
}

// On load: a deep link such as /capture?mode=audio&auto=1 (from a Back Tap shortcut or
// icon shortcut) opens that screen directly; "/" and reloads always start at the converter.
// Shared text (/share?text=...) is parked until the user unlocks the vault.
function initial() {
  const { pathname, search } = window.location
  let route = '/'
  if (pathname === '/share') {
    try {
      sessionStorage.setItem('haven.shared', JSON.stringify(Object.fromEntries(new URLSearchParams(search))))
    } catch {
      /* storage unavailable */
    }
  } else if (pathname && pathname !== '/') {
    route = pathname + search
  } else if (search) {
    route = '/' + search // e.g. an icon shortcut opening a converter category
  }
  window.history.replaceState({ haven: !route.startsWith('/'), route }, '', '/')
  return route
}

function emit() {
  const loc = parse(current)
  listeners.forEach((l) => l(loc))
}

export function navigate(to, { replace = false } = {}) {
  current = to
  const state = { haven: true, route: to }
  if (replace) window.history.replaceState(state, '', '/')
  else window.history.pushState(state, '', '/')
  emit()
}

// Quick exit: back to the converter, and forget this entry was ever inside the vault.
export function lock() {
  current = '/'
  window.history.replaceState({ haven: false, route: '/' }, '', '/')
  emit()
}

// Go back if the previous entry was created inside the app, else go to a fallback route.
export function back(fallback = '/home') {
  if (window.history.state && window.history.state.haven && window.history.length > 1) window.history.back()
  else navigate(fallback, { replace: true })
}

export function useRoute() {
  const [loc, setLoc] = useState(() => parse(current))
  useEffect(() => {
    const onPop = (e) => {
      current = e.state?.route || '/'
      setLoc(parse(current))
    }
    window.addEventListener('popstate', onPop)
    listeners.add(setLoc)
    return () => {
      window.removeEventListener('popstate', onPop)
      listeners.delete(setLoc)
    }
  }, [])
  return loc
}
