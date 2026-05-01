import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Lock, Save } from 'lucide-react'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('profile')

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  })

  const profileMutation = useMutation({
    mutationFn: (data) => authApi.updateMe(data),
    onSuccess: (res) => {
      updateUser(res.data)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      setPasswordForm({ old_password: '', new_password: '', new_password_confirm: '' })
      toast.success('Password changed!')
    },
    onError: (err) => {
      const msg = err.response?.data?.old_password || err.response?.data?.new_password || 'Failed to change password'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  const setProfile = (field) => (e) => setProfileForm({ ...profileForm, [field]: e.target.value })
  const setPassword = (field) => (e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-100 mb-1">Profile</h1>
        <p className="text-ink-400 text-sm">Manage your account settings</p>
      </div>

      {/* User card */}
      <div className="card p-5 flex items-center gap-4 mb-6">
        <Avatar user={user} size="xl" />
        <div>
          <p className="font-medium text-ink-100 text-lg">{user?.full_name || user?.username}</p>
          <p className="text-ink-400 text-sm">{user?.email}</p>
          {user?.bio && <p className="text-ink-500 text-xs mt-1">{user.bio}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-900 border border-ink-800 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: 'profile', label: 'Profile', icon: <User size={13} /> },
          { key: 'password', label: 'Password', icon: <Lock size={13} /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t.key
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <form
          onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profileForm) }}
          className="card p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ink-400 mb-1.5">First name</label>
              <input className="input" value={profileForm.first_name} onChange={setProfile('first_name')} placeholder="Jane" />
            </div>
            <div>
              <label className="block text-sm text-ink-400 mb-1.5">Last name</label>
              <input className="input" value={profileForm.last_name} onChange={setProfile('last_name')} placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Username</label>
            <input className="input" value={profileForm.username} onChange={setProfile('username')} required />
          </div>
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Bio</label>
            <textarea
              className="input resize-none h-20"
              value={profileForm.bio}
              onChange={setProfile('bio')}
              placeholder="Tell your team something about you…"
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
              <Save size={14} />
              {profileMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate(passwordForm) }}
          className="card p-5 space-y-4"
        >
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Current password</label>
            <input
              type="password"
              className="input"
              value={passwordForm.old_password}
              onChange={setPassword('old_password')}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">New password</label>
            <input
              type="password"
              className="input"
              value={passwordForm.new_password}
              onChange={setPassword('new_password')}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Confirm new password</label>
            <input
              type="password"
              className="input"
              value={passwordForm.new_password_confirm}
              onChange={setPassword('new_password_confirm')}
              required
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
              <Lock size={14} />
              {passwordMutation.isPending ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
