import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight, Send, Calendar, User, Flag,
  Trash2, Edit2, Check, X, MessageSquare
} from 'lucide-react'
import { tasksApi, chatApi, projectsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, PriorityBadge, StatusSelect } from '../components/ui/StatusBadge'
import Avatar from '../components/ui/Avatar'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

export default function TaskPage() {
  const { projectId, taskId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [message, setMessage] = useState('')
  const [editingMsg, setEditingMsg] = useState(null)
  const [editText, setEditText] = useState('')
  const messagesEndRef = useRef(null)

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId).then(r => r.data),
  })

  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', taskId],
    queryFn: () => chatApi.list(taskId).then(r => r.data.results || r.data),
    refetchInterval: 5000,
  })

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId).then(r => r.data),
  })

  const isOwner = project?.my_role === 'owner'
  const isAssignee = task?.assigned_to?.id === user?.id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const statusMutation = useMutation({
    mutationFn: (status) => tasksApi.update(taskId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const sendMutation = useMutation({
    mutationFn: (text) => chatApi.send(taskId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', taskId] })
      setMessage('')
    },
    onError: () => toast.error('Failed to send message'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, text }) => chatApi.edit(id, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', taskId] })
      setEditingMsg(null)
    },
    onError: () => toast.error('Failed to edit message'),
  })

  const deleteMsgMutation = useMutation({
    mutationFn: (id) => chatApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', taskId] }),
    onError: () => toast.error('Failed to delete message'),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      navigate(`/projects/${projectId}`)
      toast.success('Task deleted')
    },
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    sendMutation.mutate(message.trim())
  }

  if (taskLoading) {
    return <div className="max-w-4xl mx-auto px-6 py-8"><div className="card h-64 skeleton" /></div>
  }

  if (!task) {
    return <div className="flex items-center justify-center h-64 text-ink-500">Task not found</div>
  }

  const canUpdateStatus = isOwner || isAssignee

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-ink-300 transition-colors">Dashboard</button>
        <ChevronRight size={12} />
        <button onClick={() => navigate(`/projects/${projectId}`)} className="hover:text-ink-300 transition-colors">
          {project?.name || 'Project'}
        </button>
        <ChevronRight size={12} />
        <span className="text-ink-300 truncate max-w-xs">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task info */}
        <div className="lg:col-span-1">
          <div className="card p-5 space-y-5 sticky top-6">
            <div>
              <h1 className="font-display text-xl text-ink-100 leading-snug mb-2">{task.title}</h1>
              {task.description && (
                <p className="text-sm text-ink-400 leading-relaxed">{task.description}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-ink-500 mb-2 uppercase tracking-wider">Status</label>
              {canUpdateStatus ? (
                <StatusSelect
                  value={task.status}
                  onChange={(val) => statusMutation.mutate(val)}
                  disabled={statusMutation.isPending}
                />
              ) : (
                <StatusBadge status={task.status} />
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs text-ink-500 mb-2 uppercase tracking-wider">Priority</label>
              <PriorityBadge priority={task.priority} />
            </div>

            {/* Assigned to */}
            <div>
              <label className="block text-xs text-ink-500 mb-2 uppercase tracking-wider">Assigned to</label>
              {task.assigned_to ? (
                <div className="flex items-center gap-2">
                  <Avatar user={task.assigned_to} size="sm" />
                  <span className="text-sm text-ink-300">
                    {task.assigned_to.full_name || task.assigned_to.username}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-ink-500">Unassigned</span>
              )}
            </div>

            {/* Deadline */}
            {task.deadline && (
              <div>
                <label className="block text-xs text-ink-500 mb-2 uppercase tracking-wider">Deadline</label>
                <div className={`flex items-center gap-2 text-sm ${task.is_overdue ? 'text-rose-400' : 'text-ink-300'}`}>
                  <Calendar size={13} />
                  {format(parseISO(task.deadline), 'MMM d, yyyy')}
                  {task.is_overdue && <span className="badge bg-rose-500/20 text-rose-400 text-[10px]">Overdue</span>}
                </div>
              </div>
            )}

            {/* Created by */}
            <div>
              <label className="block text-xs text-ink-500 mb-2 uppercase tracking-wider">Created by</label>
              <div className="flex items-center gap-2">
                <Avatar user={task.created_by} size="xs" />
                <span className="text-sm text-ink-400">
                  {task.created_by?.full_name || task.created_by?.username}
                </span>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => { if (confirm('Delete this task?')) deleteTaskMutation.mutate() }}
                className="btn-danger w-full justify-center mt-2"
              >
                <Trash2 size={13} />
                Delete task
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-ink-500" />
            <h2 className="text-sm font-medium text-ink-300">Discussion</h2>
            <span className="text-xs text-ink-600">({messages?.length || 0} messages)</span>
          </div>

          <div className="card flex flex-col" style={{ minHeight: '400px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
              {msgsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton w-7 h-7 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-10 w-full rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={20} className="text-ink-600 mx-auto mb-2" />
                  <p className="text-ink-500 text-sm">No messages yet. Start the discussion!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender.id === user?.id}
                    isEditing={editingMsg === msg.id}
                    editText={editText}
                    onEditStart={() => { setEditingMsg(msg.id); setEditText(msg.text) }}
                    onEditChange={setEditText}
                    onEditSave={() => editMutation.mutate({ id: msg.id, text: editText })}
                    onEditCancel={() => setEditingMsg(null)}
                    onDelete={() => deleteMsgMutation.mutate(msg.id)}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t border-ink-800 p-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <Avatar user={user} size="sm" className="shrink-0 mt-0.5" />
                <div className="flex-1 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Write a message…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sendMutation.isPending}
                    className="btn-primary px-3"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isOwn, isEditing, editText, onEditStart, onEditChange, onEditSave, onEditCancel, onDelete }) {
  return (
    <div className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar user={message.sender} size="xs" className="shrink-0 mt-1" />
      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          {!isOwn && <span className="font-medium text-ink-400">{message.sender.full_name || message.sender.username}</span>}
          <span>{format(new Date(message.created_at), 'h:mm a')}</span>
          {message.is_edited && <span className="italic">(edited)</span>}
        </div>

        {isEditing ? (
          <div className="flex gap-2 w-full">
            <input
              className="input flex-1 text-sm"
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              autoFocus
            />
            <button onClick={onEditSave} className="btn-primary px-2 py-1"><Check size={12} /></button>
            <button onClick={onEditCancel} className="btn-secondary px-2 py-1"><X size={12} /></button>
          </div>
        ) : (
          <div className={`
            px-3 py-2 rounded-xl text-sm leading-relaxed
            ${isOwn
              ? 'bg-amber-500/20 text-amber-100 rounded-tr-sm'
              : 'bg-ink-800 text-ink-200 rounded-tl-sm'
            }
          `}>
            {message.text}
          </div>
        )}

        {isOwn && !isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEditStart} className="btn-ghost p-1 text-xs">
              <Edit2 size={11} />
            </button>
            <button onClick={onDelete} className="btn-ghost p-1 text-xs text-rose-400">
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
