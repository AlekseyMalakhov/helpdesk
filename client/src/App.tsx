import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'

function App() {
  const [status, setStatus] = useState<string>('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <Routes>
      <Route path="/" element={<div>Server status: {status}</div>} />
    </Routes>
  )
}

export default App
