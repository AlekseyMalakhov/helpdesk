import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authClient } from '../lib/auth-client'
import './LoginPage.css'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    await authClient.signIn.email(data, {
      onSuccess: () => navigate('/'),
      onError: (ctx) =>
        setError('root', { message: ctx.error.message }),
    })
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 360, padding: 32, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24 }}>Sign in</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="text"
              {...register('email')}
              className={errors.email ? 'input-error' : undefined}
              style={{ display: 'block', width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: `1px solid ${errors.email ? 'red' : '#ccc'}` }}
            />
            {errors.email && <p style={{ color: 'red', margin: '4px 0 0' }}>{errors.email.message}</p>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
            <input
              type="password"
              {...register('password')}
              className={errors.password ? 'input-error' : undefined}
              style={{ display: 'block', width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 4, border: `1px solid ${errors.password ? 'red' : '#ccc'}` }}
            />
            {errors.password && <p style={{ color: 'red', margin: '4px 0 0' }}>{errors.password.message}</p>}
          </div>
          {errors.root && <p style={{ color: 'red', marginBottom: 16, marginTop: 0 }}>{errors.root.message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: 'none', background: '#0070f3', color: '#fff', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
