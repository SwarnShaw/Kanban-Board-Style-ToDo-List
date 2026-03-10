import React, { useMemo } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { FIXED_COLUMNS } from '../constants/columns'
import { isOverdue, isDueToday, getRelativeTime } from '../utils/formatDate'
import { X } from 'lucide-react'

export default function Analytics({ onClose }) {
    const { activeTasks, activeBoard } = useBoardContext()

    const stats = useMemo(() => {
        const total = activeTasks.length
        const overdue = activeTasks.filter(t => isOverdue(t.dueDate)).length
        const dueToday = activeTasks.filter(t => isDueToday(t.dueDate)).length
        const noDate = activeTasks.filter(t => !t.dueDate).length
        return { total, overdue, dueToday, noDate }
    }, [activeTasks])

    const columnCounts = useMemo(() => {
        const counts = FIXED_COLUMNS.map(col => ({
            ...col,
            count: activeTasks.filter(t => t.columnId === col.id).length
        }))
        const max = Math.max(...counts.map(c => c.count), 1)
        return counts.map(c => ({ ...c, pct: (c.count / max) * 100 }))
    }, [activeTasks])

    const priorityCounts = useMemo(() => {
        const high = activeTasks.filter(t => t.priority === 'high').length
        const medium = activeTasks.filter(t => t.priority === 'medium').length
        const low = activeTasks.filter(t => t.priority === 'low').length
        const max = Math.max(high, medium, low, 1)
        return [
            { label: '🔴 High', count: high, pct: (high / max) * 100, color: 'var(--priority-high)' },
            { label: '🔵 Medium', count: medium, pct: (medium / max) * 100, color: 'var(--priority-medium)' },
            { label: '🟢 Low', count: low, pct: (low / max) * 100, color: 'var(--priority-low)' }
        ]
    }, [activeTasks])

    const wipStatus = useMemo(() => {
        return FIXED_COLUMNS
            .map(col => {
                const limit = activeBoard?.wipLimits?.[col.id] ?? col.wipLimit
                if (limit === null || limit === undefined) return null
                const count = activeTasks.filter(t => t.columnId === col.id).length
                const status = count > limit ? 'red' : count === limit ? 'yellow' : 'green'
                return { title: col.title, count, limit, status }
            })
            .filter(Boolean)
    }, [activeTasks, activeBoard])

    const activity = (activeBoard?.activity || []).slice(0, 10)

    const formatActivity = (entry) => {
        if (entry.type === 'created') return `Task "${entry.taskTitle}" added to ${entry.toColumn}`
        if (entry.type === 'moved') return `Task "${entry.taskTitle}" moved to ${entry.toColumn}`
        if (entry.type === 'deleted') return `Task "${entry.taskTitle}" deleted`
        return ''
    }

    return (
        <>
            <div className="analytics-overlay" onClick={onClose} />
            <div className="analytics-panel">
                <div className="analytics-header">
                    <h2>Analytics</h2>
                    <button className="analytics-close" onClick={onClose} aria-label="Close analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                    </button>
                </div>
                <div className="analytics-body">
                    <div className="stat-grid">
                        {[
                            { n: stats.total, l: 'Total Tasks' },
                            { n: stats.overdue, l: 'Overdue' },
                            { n: stats.dueToday, l: 'Due Today' },
                            { n: stats.noDate, l: 'No Due Date' }
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-number">{s.n}</div>
                                <div className="stat-label">{s.l}</div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <div className="analytics-section-title">Tasks by Column</div>
                        {columnCounts.map(col => (
                            <div key={col.id} className="bar-chart-row">
                                <span className="bar-chart-label">{col.title}</span>
                                <div className="bar-chart-track">
                                    <div className="bar-chart-fill" style={{ width: `${col.pct}%` }} />
                                </div>
                                <span className="bar-chart-count">{col.count}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <div className="analytics-section-title">Tasks by Priority</div>
                        {priorityCounts.map((p, i) => (
                            <div key={i} className="bar-chart-row">
                                <span className="bar-chart-label">{p.label}</span>
                                <div className="bar-chart-track">
                                    <div className="bar-chart-fill" style={{ width: `${p.pct}%`, background: p.color }} />
                                </div>
                                <span className="bar-chart-count">{p.count}</span>
                            </div>
                        ))}
                    </div>

                    {wipStatus.length > 0 && (
                        <div>
                            <div className="analytics-section-title">WIP Status</div>
                            {wipStatus.map((w, i) => (
                                <div key={i} className="wip-status-row">
                                    <span className="wip-status-label">{w.title}</span>
                                    <span className={`wip-status-value ${w.status}`}>
                                        {w.count}/{w.limit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div>
                        <div className="analytics-section-title">Activity Log</div>
                        {activity.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.6 }}>No activity yet</div>
                        ) : (
                            <div className="activity-log">
                                {activity.map(entry => (
                                    <div key={entry.id} className="activity-entry">
                                        <span className="activity-time">{getRelativeTime(entry.timestamp)}</span>
                                        {' · '}
                                        {formatActivity(entry)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
