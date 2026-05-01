import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password_confirm: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.signup(form)
      await login(form.email, form.password)
      toast.success('Account created! Welcome.')
      navigate('/')
    } catch (err) {
      const errors = err.response?.data
      if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([k, v]) => {
          toast.error(`${k}: ${Array.isArray(v) ? v[0] : v}`)
        })
      } else {
        toast.error('Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-ink-950 font-display font-bold text-sm">T</span>
          </div>
          <span className="font-display text-xl text-ink-100">TaskFlow</span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink-100 mb-2">Create your account</h1>
          <p className="text-ink-400 text-sm">Start managing projects in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ink-400 mb-1.5">First name</label>
              <input className="input" placeholder="Jane" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <label className="block text-sm text-ink-400 mb-1.5">Last name</label>
              <input className="input" placeholder="Smith" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Username</label>
            <input className="input" placeholder="janesmith" value={form.username} onChange={set('username')} required />
          </div>

          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>

          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Password</label>
            <input type="password" className="input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
          </div>

          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Confirm password</label>
            <input type="password" className="input" placeholder="Same as above" value={form.password_confirm} onChange={set('password_confirm')} required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
