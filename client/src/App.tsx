import { Routes, Route, Navigate } from 'react-router'
import { authClient } from './lib/auth-client'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import UsersPage from './pages/UsersPage'
import TicketsPage from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import NavBar from './components/NavBar'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  )
}

function App() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null

  const isAdmin = session?.user.role === 'admin'

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          session
            ? <ProtectedLayout><HomePage /></ProtectedLayout>
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/users"
        element={
          !session ? <Navigate to="/login" replace /> :
          !isAdmin ? <Navigate to="/" replace /> :
          <ProtectedLayout><UsersPage /></ProtectedLayout>
        }
      />
      <Route
        path="/tickets"
        element={
          session
            ? <ProtectedLayout><TicketsPage /></ProtectedLayout>
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/tickets/:id"
        element={
          session
            ? <ProtectedLayout><TicketDetailPage /></ProtectedLayout>
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default App
