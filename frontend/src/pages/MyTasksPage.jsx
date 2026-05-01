import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare, Calendar, FolderOpen, ChevronRight } from 'lucide-react'
import { tasksApi } from '../api/client'
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge'
import { format, parseISO, isPast } from 'date-fns'

export default function MyTasksPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks', filter],
    queryFn: () => tasksApi.myTasks(filter !== 'all' ? { status: filter } : {}).then(r => r.data.results || r.data),
  })

  const counts = {
    all: tasks?.length || 0,
    todo: tasks?.filter(t => t.status === 'todo').length || 0,
    in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
    done: tasks?.filter(t => t.status === 'done').length || 0,
  }

  const filtered = tasks?.filter(t => filter === 'all' || t.status === filter) || []

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-100 mb-1">My Tasks</h1>
        <p className="text-ink-400 text-sm">All tasks assigned to you across projects</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-ink-900 border border-ink-800 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'todo', label: 'To Do' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'done', label: 'Done' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === f.key
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {f.label}
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${
              filter === f.key ? 'bg-amber-500/30 text-amber-300' : 'bg-ink-800 text-ink-500'
            }`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="card h-20 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckSquare size={24} className="text-ink-600 mx-auto mb-3" />
          <p className="text-ink-400 text-sm">
            {filter === 'all' ? "You have no tasks assigned yet" : `No ${filter.replace('_', ' ')} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <MyTaskRow
              key={task.id}
              task={task}
              onClick={() => navigate(`/projects/${task.project}/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MyTaskRow({ task, onClick }) {
  const overdue = task.deadline && task.status !== 'done' && isPast(parseISO(task.deadline))

  return (
    <button
      onClick={onClick}
      className="card w-full px-4 py-3.5 flex items-center gap-4 hover:border-ink-700 hover:bg-ink-800/50 transition-all duration-150 group text-left"
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium mb-1.5 ${task.status === 'done' ? 'line-through text-ink-500' : 'text-ink-200'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.deadline && (
            <span className={`badge ${overdue ? 'bg-rose-500/20 text-rose-400' : 'bg-ink-700 text-ink-400'}`}>
              <Calendar size={10} className="mr-1" />
              {format(parseISO(task.deadline), 'MMM d')}
              {overdue && ' — overdue'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 text-ink-500">
        <FolderOpen size={12} />
        <span className="text-xs">Project #{task.project}</span>
        <ChevronRight size={14} className="text-ink-600 group-hover:text-ink-400 transition-colors" />
      </div>
    </button>
  )
}
