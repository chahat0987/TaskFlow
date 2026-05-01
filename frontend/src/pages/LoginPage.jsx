import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-ink-900 border-r border-ink-800 p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-ink-950 font-display font-bold text-sm">T</span>
          </div>
          <span className="font-display text-xl text-ink-100">TaskFlow</span>
        </div>

        <div>
          <blockquote className="font-display text-3xl text-ink-200 italic leading-relaxed mb-6">
            "Projects don't fail because of bad ideas — they fail because of lost threads."
          </blockquote>
          <p className="text-ink-500 text-sm">TaskFlow keeps every thread visible.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Projects', value: '∞' },
            { label: 'Members', value: '∞' },
            { label: 'Tasks', value: '∞' },
          ].map(s => (
            <div key={s.label} className="bg-ink-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-display text-amber-400 mb-1">{s.value}</div>
              <div className="text-xs text-ink-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-ink-100 mb-2">Welcome back</h1>
            <p className="text-ink-400 text-sm">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-ink-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            No account?{' '}
            <Link to="/signup" className="text-amber-400 hover:text-amber-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
