import React, { useState, useMemo } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { FIXED_COLUMNS } from '../constants/columns'
import { sortTasks } from '../utils/sortTasks'
import TaskCard from './TaskCard'
import { nameToColor } from '../utils/generateColor'

export default function Swimlanes({ swimlaneMode, columnTasks, searchQuery, matchesFilters, onEditTask }) {
    const { activeTasks, activeLabels } = useBoardContext()
    const [collapsed, setCollapsed] = useState({})

    const toggleCollapse = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

    const groups = useMemo(() => {
        if (swimlaneMode === 'priority') {
            return [
                { key: 'high', label: '🔴 HIGH PRIORITY', filter: t => t.priority === 'high' },
                { key: 'medium', label: '🔵 MEDIUM PRIORITY', filter: t => t.priority === 'medium' },
                { key: 'low', label: '🟢 LOW PRIORITY', filter: t => t.priority === 'low' },
                { key: 'none', label: '— NO PRIORITY', filter: t => !t.priority }
            ]
        }
        if (swimlaneMode === 'assignee') {
            const assignees = [...new Set(activeTasks.map(t => t.assignee).filter(Boolean))]
            const lanes = assignees.map(a => ({
                key: a, label: a.toUpperCase(), filter: t => t.assignee === a
            }))
            lanes.push({ key: 'unassigned', label: '— UNASSIGNED', filter: t => !t.assignee })
            return lanes
        }
        if (swimlaneMode === 'label') {
            const lanes = activeLabels.map(l => ({
                key: l.id, label: `${l.name.toUpperCase()}`, filter: t => t.labelIds.includes(l.id),
                color: l.color
            }))
            lanes.push({ key: 'nolabel', label: '— NO LABEL', filter: t => t.labelIds.length === 0 })
            return lanes
        }
        return []
    }, [swimlaneMode, activeTasks, activeLabels])

    return (
        <div className="swimlanes-wrapper">
            {groups.map(group => {
                const isCollapsed = collapsed[group.key]
                return (
                    <div key={group.key} className={`swimlane ${isCollapsed ? 'collapsed' : ''}`} data-group={swimlaneMode === 'priority' ? group.key : undefined}>
                        <div className="swimlane-header">
                            {swimlaneMode === 'priority' && (
                                <div className="swimlane-header-icon" style={{ background: `var(--priority-${group.key === 'none' ? 'none' : group.key})` }}></div>
                            )}
                            {swimlaneMode === 'assignee' && (
                                <div className="swimlane-assignee-avatar" style={{ background: group.key === 'unassigned' ? 'var(--border)' : nameToColor(group.key) }}>
                                    {group.key === 'unassigned' ? '?' : group.label.charAt(0)}
                                </div>
                            )}
                            {swimlaneMode === 'label' && (
                                <span className="swimlane-label-chip" style={{
                                    background: group.key === 'nolabel' ? 'transparent' : `${group.color}20`,
                                    color: group.key === 'nolabel' ? 'var(--text-secondary)' : group.color,
                                    border: group.key === 'nolabel' ? '1.5px dashed var(--border)' : 'none'
                                }}>
                                    {group.label}
                                </span>
                            )}
                            {swimlaneMode !== 'label' && (
                                <span className={swimlaneMode === 'assignee' ? 'swimlane-assignee-name' : 'swimlane-header-label'}>
                                    {group.label}
                                </span>
                            )}
                            <span className="swimlane-chevron" onClick={() => toggleCollapse(group.key)}>
                                ▾
                            </span>
                        </div>
                        {!isCollapsed && (
                            <div className="swimlane-body">
                                {FIXED_COLUMNS.map(col => {
                                    const tasks = sortTasks(
                                        activeTasks.filter(t => t.columnId === col.id && group.filter(t))
                                    )
                                    return (
                                        <div key={col.id} className="swimlane-col">
                                            <div className="swimlane-col-label">
                                                {col.title}
                                                <span className="swimlane-col-count">{tasks.length}</span>
                                            </div>
                                            <div className="swimlane-col-cards">
                                                {tasks.length === 0 ? (
                                                    <div className="swimlane-empty-col">No tasks</div>
                                                ) : (
                                                    tasks.map(task => {
                                                        const dimmed = searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                                            !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                                                        return (
                                                            <TaskCard
                                                                key={task.id}
                                                                task={task}
                                                                dimmed={dimmed || !matchesFilters(task)}
                                                                onEdit={() => onEditTask(task.id)}
                                                            />
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
