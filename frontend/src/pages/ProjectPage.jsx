import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, UserPlus, UserMinus, Settings, ChevronRight,
  Calendar, MessageSquare, Crown, Trash2, LogOut
} from 'lucide-react'
import { projectsApi, tasksApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge'
import toast from 'react-hot-toast'
import { format, isPast, parseISO } from 'date-fns'

export default function ProjectPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showInvite, setShowInvite] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [taskFilter, setTaskFilter] = useState('all')

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId).then(r => r.data),
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.list(projectId).then(r => r.data.results || r.data),
  })

  const isOwner = project?.my_role === 'owner'
  const members = project?.members || []

  const inviteMutation = useMutation({
    mutationFn: (email) => projectsApi.invite(projectId, email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      setInviteEmail('')
      setShowInvite(false)
      toast.success('Member invited!')
    },
    onError: (err) => toast.error(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to invite'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Member removed')
    },
    onError: () => toast.error('Failed to remove member'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      navigate('/')
      toast.success('Project deleted')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => projectsApi.leave(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      navigate('/')
      toast.success('Left project')
    },
  })

  const filteredTasks = tasks?.filter(t => {
    if (taskFilter === 'all') return true
    if (taskFilter === 'mine') return t.assigned_to?.id === user?.id
    return t.status === taskFilter
  }) || []

  if (projLoading) return <LoadingSkeleton />

  if (!project) return (
    <div className="flex items-center justify-center h-64 text-ink-500">
      Project not found
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
            <button onClick={() => navigate('/')} className="hover:text-ink-300 transition-colors">Dashboard</button>
            <ChevronRight size={12} />
            <span className="text-ink-300">{project.name}</span>
          </div>
          <h1 className="font-display text-3xl text-ink-100 mb-1">{project.name}</h1>
          {project.description && (
            <p className="text-ink-400 text-sm">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button onClick={() => setShowInvite(true)} className="btn-secondary">
              <UserPlus size={14} />
              Invite
            </button>
          )}
          {isOwner ? (
            <button
              onClick={() => { if (confirm('Delete this project?')) deleteMutation.mutate() }}
              className="btn-ghost text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => { if (confirm('Leave this project?')) leaveMutation.mutate() }}
              className="btn-ghost"
            >
              <LogOut size={14} />
              Leave
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tasks - main column */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 bg-ink-900 border border-ink-800 rounded-lg p-1">
              {['all', 'mine', 'todo', 'in_progress', 'done'].map(f => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    taskFilter === f
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'mine' ? 'Mine' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {isOwner && (
              <button onClick={() => setShowCreateTask(true)} className="btn-primary">
                <Plus size={14} />
                Task
              </button>
            )}
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="card h-20 skeleton" />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-ink-500 text-sm">No tasks found</p>
              {isOwner && taskFilter === 'all' && (
                <button onClick={() => setShowCreateTask(true)} className="btn-primary mt-4 mx-auto">
                  <Plus size={14} /> Create first task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Members sidebar */}
        <div>
          <h3 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-3">
            Members ({members.length})
          </h3>
          <div className="card divide-y divide-ink-800">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 group">
                <Avatar user={m.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-200 truncate">{m.user.full_name || m.user.username}</p>
                  {m.role === 'owner' && (
                    <span className="text-xs text-amber-500/70 flex items-center gap-1">
                      <Crown size={9} />Owner
                    </span>
                  )}
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => removeMutation.mutate(m.user.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1 text-rose-400"
                  >
                    <UserMinus size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite member">
        <form onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate(inviteEmail) }} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={inviteMutation.isPending} className="btn-primary flex-1 justify-center">
              {inviteMutation.isPending ? 'Inviting…' : 'Send invite'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create task modal */}
      {isOwner && (
        <CreateTaskModal
          isOpen={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          projectId={projectId}
          members={members}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['tasks', projectId] })}
        />
      )}
    </div>
  )
}

function TaskRow({ task, onClick }) {
  const overdue = task.deadline && task.status !== 'done' && isPast(parseISO(task.deadline))

  return (
    <button
      onClick={onClick}
      className="card w-full px-4 py-3 flex items-center gap-4 hover:border-ink-700 hover:bg-ink-800/50 transition-all duration-150 group text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-ink-500' : 'text-ink-200'}`}>
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.deadline && (
            <span className={`badge ${overdue ? 'bg-rose-500/20 text-rose-400' : 'bg-ink-700 text-ink-400'}`}>
              <Calendar size={10} className="mr-1" />
              {format(parseISO(task.deadline), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {task.message_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-ink-500">
            <MessageSquare size={12} />
            {task.message_count}
          </span>
        )}
        {task.assigned_to && <Avatar user={task.assigned_to} size="xs" />}
        <ChevronRight size={14} className="text-ink-600 group-hover:text-ink-400 transition-colors" />
      </div>
    </button>
  )
}

function CreateTaskModal({ isOpen, onClose, projectId, members, onSuccess }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', description: '', assigned_to_id: '', priority: 'medium', deadline: ''
  })

  const mutation = useMutation({
    mutationFn: (data) => tasksApi.create(projectId, data),
    onSuccess: () => {
      onSuccess()
      onClose()
      setForm({ title: '', description: '', assigned_to_id: '', priority: 'medium', deadline: '' })
      toast.success('Task created!')
    },
    onError: () => toast.error('Failed to create task'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      assigned_to_id: form.assigned_to_id || null,
      deadline: form.deadline || null,
    }
    mutation.mutate(payload)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink-400 mb-1.5">Title *</label>
          <input
            className="input"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm text-ink-400 mb-1.5">Description</label>
          <textarea
            className="input resize-none h-20"
            placeholder="Add more context…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Assign to</label>
            <select
              className="input"
              value={form.assigned_to_id}
              onChange={(e) => setForm({ ...form, assigned_to_id: e.target.value })}
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.full_name || m.user.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-ink-400 mb-1.5">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-ink-400 mb-1.5">Deadline</label>
          <input
            type="date"
            className="input"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
            {mutation.isPending ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="skeleton h-8 w-64 mb-4 rounded-lg" />
      <div className="skeleton h-4 w-96 mb-8 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="card h-16 skeleton" />)}
        </div>
        <div className="card h-48 skeleton" />
      </div>
    </div>
  )
}
