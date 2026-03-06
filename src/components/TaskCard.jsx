import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBoardContext } from '../context/BoardContext'
import { nameToColor } from '../utils/generateColor'
import { formatDateShort, isOverdue, isDueToday, isDueTomorrow } from '../utils/formatDate'
import { activityId } from '../utils/idGenerators'

export default function TaskCard({ task, dimmed, onEdit, isOverlay }) {
    const { activeLabels, dispatch } = useBoardContext()
    const [showConfirm, setShowConfirm] = useState(false)

    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging
    } = useSortable({ id: task.id, disabled: isOverlay })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: dimmed ? 0.2 : isDragging ? 0.5 : 1,
    }

    const priorityClass = task.priority ? `priority-${task.priority}` : 'priority-none'

    const taskLabels = (task.labelIds || [])
        .map(id => activeLabels.find(l => l.id === id))
        .filter(Boolean)
        .slice(0, 4)

    const checkedCount = (task.checklist || []).filter(i => i.isChecked).length
    const totalChecklist = (task.checklist || []).length
    const allChecked = totalChecklist > 0 && checkedCount === totalChecklist

    const commentCount = (task.comments || []).length
    const doneAttachments = (task.attachments || []).filter(a => a.status === 'done').length
    const uploadingAttachments = (task.attachments || []).filter(a => a.status === 'uploading').length

    const dueDateClass = task.dueDate
        ? isOverdue(task.dueDate) ? 'overdue'
            : isDueToday(task.dueDate) ? 'due-today'
                : isDueTomorrow(task.dueDate) ? 'due-tomorrow'
                    : ''
        : ''

    const initials = task.assignee
        ? task.assignee.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : null

    const handleDelete = () => {
        dispatch({ type: 'DELETE_TASK', payload: { taskId: task.id } })
        dispatch({
            type: 'LOG_ACTIVITY',
            payload: {
                entry: {
                    id: activityId(), type: 'deleted', taskTitle: task.title,
                    fromColumn: null, toColumn: null, timestamp: new Date().toISOString()
                }
            }
        })
    }

    const handleCardClick = (e) => {
        if (e.target.closest('.card-actions') || e.target.closest('.card-inline-confirm')) return
        if (onEdit) onEdit()
    }

    const hasMeta = task.dueDate || totalChecklist > 0 || commentCount > 0 ||
        doneAttachments > 0 || uploadingAttachments > 0 || task.assignee

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`task-card ${priorityClass} ${isDragging ? 'dragging' : ''} ${isOverlay ? 'overlay' : ''}`}
            onClick={handleCardClick}
            role="button"
            aria-label={`Task: ${task.title}`}
            aria-roledescription="draggable"
        >
            {taskLabels.length > 0 && (
                <div className="card-labels">
                    {taskLabels.map(label => (
                        <div
                            key={label.id}
                            className="card-label-bar"
                            style={{ backgroundColor: label.color }}
                            title={label.name}
                        />
                    ))}
                </div>
            )}

            <h3 className="card-title">{task.title}</h3>

            {task.description && (
                <p className="card-description">{task.description}</p>
            )}

            {hasMeta && (
                <div className="card-meta">
                    <div className="card-meta-left">
                        {task.dueDate && (
                            <span className={`due-chip ${dueDateClass}`}>
                                {dueDateClass === 'due-today' ? '🕐' : '📅'} {formatDateShort(task.dueDate)}
                            </span>
                        )}
                        {totalChecklist > 0 && (
                            <div className="checklist-progress">
                                <span className="checklist-count">{checkedCount}/{totalChecklist}</span>
                                <div className="checklist-bar">
                                    <div
                                        className={`checklist-bar-fill ${allChecked ? 'complete' : ''}`}
                                        style={{ width: `${(checkedCount / totalChecklist) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="card-meta-right">
                        {commentCount > 0 && (
                            <span className="card-comment-count">💬 {commentCount}</span>
                        )}
                        {uploadingAttachments > 0 && (
                            <span className="upload-spinner-card" title="Uploading..." />
                        )}
                        {doneAttachments > 0 && (
                            <span className="card-attachment-count">📎 {doneAttachments}</span>
                        )}
                        {initials && (
                            <div
                                className="card-avatar"
                                style={{ backgroundColor: nameToColor(task.assignee) }}
                                data-tooltip={task.assignee}
                            >
                                {initials}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!isOverlay && (
                <>
                    {!showConfirm ? (
                        <div className="card-actions">
                            <button onClick={(e) => { e.stopPropagation(); onEdit() }} aria-label="Edit task">✏️</button>
                            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }} aria-label="Delete task">🗑️</button>
                        </div>
                    ) : (
                        <div className="card-inline-confirm" onClick={e => e.stopPropagation()}>
                            Delete?
                            <button className="yes" onClick={handleDelete}>Yes</button>
                            <button className="no" onClick={() => setShowConfirm(false)}>No</button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
