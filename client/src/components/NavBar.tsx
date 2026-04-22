import { useNavigate } from 'react-router'
import { authClient } from '../lib/auth-client'

export default function NavBar() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #ddd', background: '#fff' }}>
      <span style={{ fontWeight: 600 }}>Helpdesk</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>{session?.user.name}</span>
        <button
          onClick={handleSignOut}
          style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
