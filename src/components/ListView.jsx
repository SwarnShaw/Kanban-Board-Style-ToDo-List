import React, { useState, useMemo } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { FIXED_COLUMNS } from '../constants/columns'
import { sortTasks } from '../utils/sortTasks'
import { formatDateShort, isOverdue, isDueToday, isDueThisWeek } from '../utils/formatDate'
import { activityId } from '../utils/idGenerators'

export default function ListView({ searchQuery, filters, onEditTask }) {
    const { activeTasks, activeLabels, dispatch } = useBoardContext()
    const [sortCol, setSortCol] = useState('title')
    const [sortDir, setSortDir] = useState('asc')
    const [menuOpen, setMenuOpen] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortCol(col)
            setSortDir('asc')
        }
    }

    const filteredTasks = useMemo(() => {
        let tasks = [...activeTasks]

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            tasks = tasks.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q)
            )
        }

        if (filters.priority.length > 0) {
            tasks = tasks.filter(t => {
                const p = t.priority || 'None'
                return filters.priority.includes(p) || (!t.priority && filters.priority.includes('None'))
            })
        }
        if (filters.dueDate.length > 0) {
            tasks = tasks.filter(t => filters.dueDate.some(f => {
                if (f === 'Overdue') return isOverdue(t.dueDate)
                if (f === 'Due Today') return isDueToday(t.dueDate)
                if (f === 'Due This Week') return isDueThisWeek(t.dueDate)
                if (f === 'No Date') return !t.dueDate
                return false
            }))
        }
        if (filters.labels.length > 0) {
            tasks = tasks.filter(t => filters.labels.some(l => t.labelIds.includes(l.id)))
        }
        if (filters.hideCompleted) {
            tasks = tasks.filter(t => t.columnId !== 'col_done')
        }

        tasks.sort((a, b) => {
            let va, vb
            switch (sortCol) {
                case 'title': va = a.title.toLowerCase(); vb = b.title.toLowerCase(); break
                case 'priority': {
                    const o = { high: 1, medium: 2, low: 3 }
                    va = o[a.priority] || 4; vb = o[b.priority] || 4; break
                }
                case 'column': {
                    const cols = FIXED_COLUMNS.reduce((m, c) => { m[c.id] = c.order; return m }, {})
                    va = cols[a.columnId] || 0; vb = cols[b.columnId] || 0; break
                }
                case 'assignee': va = (a.assignee || '').toLowerCase(); vb = (b.assignee || '').toLowerCase(); break
                case 'dueDate': va = a.dueDate || '9999'; vb = b.dueDate || '9999'; break
                default: va = a.title; vb = b.title
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1
            if (va > vb) return sortDir === 'asc' ? 1 : -1
            return 0
        })

        return tasks
    }, [activeTasks, searchQuery, filters, sortCol, sortDir])

    const handleMoveTask = (taskId, newColumnId) => {
        const task = activeTasks.find(t => t.id === taskId)
        if (!task || task.columnId === newColumnId) return
        const fromCol = FIXED_COLUMNS.find(c => c.id === task.columnId)
        const toCol = FIXED_COLUMNS.find(c => c.id === newColumnId)
        dispatch({ type: 'MOVE_TASK', payload: { taskId, newColumnId } })
        dispatch({
            type: 'LOG_ACTIVITY',
            payload: {
                entry: {
                    id: activityId(), type: 'moved', taskTitle: task.title,
                    fromColumn: fromCol?.title, toColumn: toCol?.title,
                    timestamp: new Date().toISOString()
                }
            }
        })
    }

    const handleDelete = (taskId) => {
        const task = activeTasks.find(t => t.id === taskId)
        dispatch({ type: 'DELETE_TASK', payload: { taskId } })
        dispatch({
            type: 'LOG_ACTIVITY',
            payload: {
                entry: {
                    id: activityId(), type: 'deleted', taskTitle: task?.title || '',
                    fromColumn: null, toColumn: null, timestamp: new Date().toISOString()
                }
            }
        })
        setDeleteConfirm(null)
        setMenuOpen(null)
    }

    const indicator = (col) => {
        if (sortCol !== col) return ''
        return sortDir === 'asc' ? ' ↑' : ' ↓'
    }

    const hasActiveFilters = filters.priority.length > 0 || filters.dueDate.length > 0 ||
        filters.labels.length > 0 || filters.hideCompleted
    const topOffset = hasActiveFilters ? 92 : 56

    return (
        <div className="list-view-container" style={{ paddingTop: topOffset + 20 }}>
            <table className="list-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('title')}>Title{indicator('title')}</th>
                        <th onClick={() => handleSort('priority')}>Priority{indicator('priority')}</th>
                        <th onClick={() => handleSort('column')}>Column{indicator('column')}</th>
                        <th onClick={() => handleSort('assignee')}>Assignee{indicator('assignee')}</th>
                        <th onClick={() => handleSort('dueDate')}>Due Date{indicator('dueDate')}</th>
                        <th>Labels</th>
                        <th style={{ width: 40 }}>⋮</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTasks.map(task => {
                        const col = FIXED_COLUMNS.find(c => c.id === task.columnId)
                        const taskLabels = (task.labelIds || []).map(id => activeLabels.find(l => l.id === id)).filter(Boolean)
                        const priorityColors = {
                            high: 'var(--priority-high)',
                            medium: 'var(--priority-medium)',
                            low: 'var(--priority-low)'
                        }

                        return (
                            <tr key={task.id} onClick={() => onEditTask(task.id)}>
                                <td style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {task.title}
                                </td>
                                <td>
                                    {task.priority && (
                                        <span className="list-priority-pill" style={{
                                            backgroundColor: `color-mix(in srgb, ${priorityColors[task.priority]} 15%, transparent)`,
                                            color: priorityColors[task.priority]
                                        }}>
                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                        </span>
                                    )}
                                </td>
                                <td onClick={e => e.stopPropagation()}>
                                    <select
                                        className="list-column-select"
                                        value={task.columnId}
                                        onChange={e => handleMoveTask(task.id, e.target.value)}
                                    >
                                        {FIXED_COLUMNS.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ color: task.assignee ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {task.assignee || '—'}
                                </td>
                                <td>
                                    {task.dueDate ? (
                                        <span className={`due-chip ${isOverdue(task.dueDate) ? 'overdue' : isDueToday(task.dueDate) ? 'due-today' : ''}`}>
                                            {formatDateShort(task.dueDate)}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td onClick={e => e.stopPropagation()}>
                                    <div className="list-labels-cell">
                                        {taskLabels.slice(0, 2).map(l => (
                                            <span key={l.id} className="list-label-pill" style={{ backgroundColor: l.color }}>{l.name}</span>
                                        ))}
                                        {taskLabels.length > 2 && <span className="list-label-overflow">+{taskLabels.length - 2}</span>}
                                    </div>
                                </td>
                                <td className="list-actions-cell" onClick={e => e.stopPropagation()}>
                                    <button className="list-actions-btn" onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}>⋮</button>
                                    {menuOpen === task.id && (
                                        <div className="list-actions-menu">
                                            {deleteConfirm === task.id ? (
                                                <>
                                                    <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--danger)' }}>Delete?</div>
                                                    <button className="delete" onClick={() => handleDelete(task.id)}>Yes, delete</button>
                                                    <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => { onEditTask(task.id); setMenuOpen(null) }}>Edit</button>
                                                    <button className="delete" onClick={() => setDeleteConfirm(task.id)}>Delete</button>
                                                </>
                                            )}
                                        </div>
                                    )}
<<<<<<< HEAD

                                    {/* Meta */}
                                    <div className="lv-mob-row__meta">
                                        {task.priority && (
                                            <span className="lv-mob-row__priority" data-priority={task.priority}>
                                                {task.priority === 'high' ? '🔴' :
                                                    task.priority === 'medium' ? '🔵' : '🟢'}
                                                {' '}{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                            </span>
                                        )}

                                        {task.dueDate && (
                                            <span className={`lv-mob-row__due ${overdue ? 'lv-mob-row__due--overdue' : ''} ${today ? 'lv-mob-row__due--today' : ''}`}>
                                                📅 {formatDateShort(task.dueDate)}
                                            </span>
                                        )}

                                        {task.assignee && (
                                            <span className="lv-mob-row__assignee">
                                                <span
                                                    className="lv-mob-row__avatar"
                                                    style={{ background: nameToColor(task.assignee) }}
                                                >
                                                    {task.assignee.charAt(0).toUpperCase()}
                                                </span>
                                                {task.assignee.split(' ')[0]}
                                            </span>
                                        )}

                                        {task.checklist?.length > 0 && (
                                            <span className="lv-mob-row__checklist">
                                                ☑ {task.checklist.filter(i => i.isChecked).length}/{task.checklist.length}
                                            </span>
                                        )}

                                        {task.comments?.length > 0 && (
                                            <span className="lv-mob-row__comments">
                                                💬 {task.comments.length}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Chevron */}
                                <span className="lv-mob-row__chevron" aria-hidden="true">›</span>
                            </div>
=======
                                </td>
                            </tr>
>>>>>>> parent of 738a7e0 (v3)
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
