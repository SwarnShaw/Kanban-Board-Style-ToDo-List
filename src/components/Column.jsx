import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useBoardContext } from '../context/BoardContext'
import TaskCard from './TaskCard'
import WipBadge from './WipBadge'

export default function Column({ col, tasks, searchQuery, matchesFilters, onAddTask, onEditTask }) {
    const { activeBoard } = useBoardContext()
    const { setNodeRef, isOver } = useDroppable({ id: col.id })

    const wipLimit = activeBoard?.wipLimits?.[col.id] ?? col.wipLimit
    const isOverWip = wipLimit !== null && wipLimit !== undefined && tasks.length > wipLimit

    const count = tasks.length

    return (
        <div className={`column-wrapper ${col.id}`}>
            <div className="column-header">
                <span className="column-title">{col.title}</span>
                <span className="task-count">{count}</span>
                <WipBadge columnId={col.id} taskCount={count} />
            </div>
            <div
                ref={setNodeRef}
                className={`column-container ${isOver ? 'drag-over' : ''} ${isOverWip ? 'wip-over' : ''}`}
            >
                {tasks.length === 0 ? (
                    <div className="column-empty">
                        <span className="column-empty-icon">📋</span>
                        <span className="column-empty-text">No tasks yet</span>
                    </div>
                ) : (
                    tasks.map(task => {
                        const passesFilter = matchesFilters(task)
                        const matchesSearch = searchQuery ? task._matchesSearch !== false : true
                        const dimmed = (searchQuery && !task._matchesSearch) || !passesFilter

                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                dimmed={dimmed}
                                onEdit={() => onEditTask(task.id)}
                            />
                        )
                    })
                )}
                <button
                    className="add-task-btn"
                    onClick={() => onAddTask(col.id)}
                    aria-label={`Add task to ${col.title}`}
                >
                    ＋ Add Task
                </button>
            </div>
        </div>
    )
}
