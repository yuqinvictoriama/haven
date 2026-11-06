import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setHealth)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <section id="center">
      <h1>Haven</h1>
      <p>
        Front-end lives in <code>src/</code>, back-end in <code>api/</code>.
      </p>
      <p>
        API status:{' '}
        {health ? (
          <code>
            ok · {health.env}
            {health.commit ? ` · ${health.commit}` : ''}
          </code>
        ) : error ? (
          <code>unreachable ({error})</code>
        ) : (
          'checking…'
        )}
      </p>
    </section>
  )
}

export default App
