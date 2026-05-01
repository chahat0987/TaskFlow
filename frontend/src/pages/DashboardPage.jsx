import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderOpen, Users, CheckSquare, Crown, ArrowRight } from 'lucide-react'
import { projectsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => projectsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setShowCreate(false)
      setForm({ name: '', description: '' })
      toast.success('Project created!')
      navigate(`/projects/${res.data.id}`)
    },
    onError: () => toast.error('Failed to create project'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    createMutation.mutate(form)
  }

  const owned = projects?.filter(p => p.my_role === 'owner') || []
  const member = projects?.filter(p => p.my_role !== 'owner') || []

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-100 mb-1">
            Good day, {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-ink-400 text-sm">
            {projects?.length || 0} project{projects?.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={15} />
          New project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 h-36 skeleton" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-ink-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={24} className="text-ink-500" />
          </div>
          <h2 className="font-display text-xl text-ink-300 mb-2">No projects yet</h2>
          <p className="text-ink-500 text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={15} /> Create project
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {owned.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Crown size={12} className="text-amber-500" />
                Your projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {owned.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
              </div>
            </section>
          )}
          {member.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users size={12} />
                Member of
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {member.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Project name *</label>
            <input
              className="input"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Description</label>
            <textarea
              className="input resize-none h-20"
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left hover:border-ink-700 hover:bg-ink-800/50 transition-all duration-150 group w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
          <FolderOpen size={16} className="text-amber-400" />
        </div>
        <ArrowRight size={14} className="text-ink-600 group-hover:text-ink-400 transition-colors" />
      </div>
      <h3 className="font-medium text-ink-200 mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-xs text-ink-500 mb-3 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-ink-500">
        <span className="flex items-center gap-1">
          <Users size={11} />
          {project.member_count}
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare size={11} />
          {project.task_count}
        </span>
        {project.my_role === 'owner' && (
          <span className="ml-auto flex items-center gap-1 text-amber-500/70">
            <Crown size={10} />
            Owner
          </span>
        )}
      </div>
    </button>
  )
}
