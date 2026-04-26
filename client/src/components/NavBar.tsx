import { Link, useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'

export default function NavBar() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const isAdmin = session?.user.role === 'admin'

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <span className="font-semibold text-gray-900">Helpdesk</span>
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Tickets
        </Link>
        {isAdmin && (
          <Link to="/users" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Users
          </Link>
        )}
        <span className="text-sm text-gray-600">{session?.user.name}</span>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
