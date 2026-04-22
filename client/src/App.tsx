import { Routes, Route, Navigate } from 'react-router'
import { authClient } from './lib/auth-client'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import NavBar from './components/NavBar'

function ProtectedLayout() {
  return (
    <>
      <NavBar />
      <HomePage />
    </>
  )
}

function App() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={session ? <ProtectedLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
