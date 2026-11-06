import { useEffect, useRef } from 'react'

// Shake-to-record: fires onShake when the device is jolted twice within ~900ms. Works only while the app is open.
export function useShake(enabled, onShake) {
  const cb = useRef(onShake)
  useEffect(() => {
    cb.current = onShake
  })
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    let hits = []
    let last = 0
    const onMotion = (e) => {
      const a = e.acceleration && e.acceleration.x != null ? e.acceleration : null
      if (!a) return
      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
      const now = Date.now()
      if (mag > 18 && now - last > 120) {
        last = now
        hits = hits.filter((t) => now - t < 900)
        hits.push(now)
        if (hits.length >= 2) {
          hits = []
          cb.current?.()
        }
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [enabled])
}
