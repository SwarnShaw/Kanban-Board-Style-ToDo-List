import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { FIXED_COLUMNS } from '../constants/columns'
import { taskId as genTaskId, activityId as genActivityId } from '../utils/idGenerators'
import { formatTimestamp } from '../utils/formatDate'
import DateInput from './DateInput'
import LabelPicker from './LabelPicker'
import Checklist from './Checklist'
import Comments from './Comments'
import Attachments from './Attachments'
import Lightbox from './Lightbox'

export default function TaskModal({ mode, taskId: existingTaskId, columnId, onClose }) {
    const { activeTasks, dispatch } = useBoardContext()
    const titleRef = useRef(null)

    const isCreate = mode === 'create'
    const [createdTaskId, setCreatedTaskId] = useState(null)
    const effectiveTaskId = isCreate ? createdTaskId : existingTaskId

    const liveTask = effectiveTaskId ? activeTasks.find(t => t.id === effectiveTaskId) : null

    const [draft, setDraft] = useState({
        title: liveTask?.title || '',
        description: liveTask?.description || '',
        priority: liveTask?.priority || null,
        dueDate: liveTask?.dueDate || '',
        assignee: liveTask?.assignee || '',
        columnId: liveTask?.columnId || columnId || 'col_todo'
    })

    const [originalDraft] = useState({ ...draft })
    const [titleError, setTitleError] = useState(false)
    const [dateError, setDateError] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [lightboxFile, setLightboxFile] = useState(null)

    useEffect(() => {
        if (titleRef.current) titleRef.current.focus()
    }, [])

    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') {
                if (lightboxFile) { setLightboxFile(null); return }
                handleClose()
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [lightboxFile, draft, originalDraft])

    const isDirty = JSON.stringify(draft) !== JSON.stringify(originalDraft)

    const handleClose = useCallback(() => {
        if (isDirty) {
            if (!window.confirm('Discard unsaved changes?')) return
        }
        onClose()
    }, [isDirty, onClose])

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) handleClose()
    }

    const handleDateValidation = (state) => {
        setDateError(state === 'error')
    }

    const canSave = draft.title.trim() && !dateError && (isCreate || isDirty)

    const handleSave = () => {
        if (!draft.title.trim()) {
            setTitleError(true)
            return
        }
        if (dateError) return

        if (isCreate) {
            const newId = genTaskId()
            const task = {
                id: newId,
                columnId: draft.columnId,
                title: draft.title.trim(),
                description: draft.description,
                priority: draft.priority,
                dueDate: draft.dueDate || null,
                assignee: draft.assignee || null,
                labelIds: [],
                checklist: [],
                comments: [],
                attachments: [],
                createdAt: new Date().toISOString()
            }
            dispatch({ type: 'ADD_TASK', payload: { task } })
            const col = FIXED_COLUMNS.find(c => c.id === draft.columnId)
            dispatch({
                type: 'LOG_ACTIVITY',
                payload: {
                    entry: {
                        id: genActivityId(), type: 'created', taskTitle: task.title,
                        fromColumn: null, toColumn: col?.title || null,
                        timestamp: new Date().toISOString()
                    }
                }
            })
            onClose()
        } else {
            const changes = {
                title: draft.title.trim(),
                description: draft.description,
                priority: draft.priority,
                dueDate: draft.dueDate || null,
                assignee: draft.assignee || null,
            }
            if (draft.columnId !== liveTask?.columnId) {
                changes.columnId = draft.columnId
                const fromCol = FIXED_COLUMNS.find(c => c.id === liveTask?.columnId)
                const toCol = FIXED_COLUMNS.find(c => c.id === draft.columnId)
                dispatch({
                    type: 'LOG_ACTIVITY',
                    payload: {
                        entry: {
                            id: genActivityId(), type: 'moved', taskTitle: draft.title.trim(),
                            fromColumn: fromCol?.title || null, toColumn: toCol?.title || null,
                            timestamp: new Date().toISOString()
                        }
                    }
                })
            }
            dispatch({ type: 'UPDATE_TASK', payload: { taskId: effectiveTaskId, changes } })
            onClose()
        }
    }

    const handleDelete = () => {
        dispatch({ type: 'DELETE_TASK', payload: { taskId: effectiveTaskId } })
        dispatch({
            type: 'LOG_ACTIVITY',
            payload: {
                entry: {
                    id: genActivityId(), type: 'deleted', taskTitle: liveTask?.title || draft.title,
                    fromColumn: null, toColumn: null, timestamp: new Date().toISOString()
                }
            }
        })
        onClose()
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    return (
        <>
            <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    {/* HEADER */}
                    <div className="modal-header">
                        <input
                            ref={titleRef}
                            id="modal-title"
                            className="modal-title-input"
                            value={draft.title}
                            onChange={e => { setDraft(d => ({ ...d, title: e.target.value.slice(0, 80) })); setTitleError(false) }}
                            placeholder="Task title"
                            maxLength={80}
                            aria-label="Task title"
                        />
                        {titleError && <div className="modal-title-error">Title is required</div>}
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                        {/* Priority */}
                        <div>
                            <span className="field-label">Priority</span>
                            <div className="priority-selector">
                                {[
                                    { value: 'high', label: '🔴 High', cls: 'active-high' },
                                    { value: 'medium', label: '🔵 Medium', cls: 'active-medium' },
                                    { value: 'low', label: '🟢 Low', cls: 'active-low' }
                                ].map(p => (
                                    <button
                                        key={p.value}
                                        className={`priority-btn ${draft.priority === p.value ? p.cls : ''}`}
                                        onClick={() => setDraft(d => ({ ...d, priority: d.priority === p.value ? null : p.value }))}
                                    >{p.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <span className="field-label">Due Date</span>
                            <DateInput
                                value={draft.dueDate}
                                onChange={val => setDraft(d => ({ ...d, dueDate: val }))}
                                onValidation={handleDateValidation}
                            />
                        </div>

                        {/* Column (mobile) */}
                        {(isMobile || !isCreate) && (
                            <div className="modal-column-select" style={{ display: isMobile ? 'block' : undefined }}>
                                <span className="field-label">Column</span>
                                <select
                                    className="modal-input"
                                    value={draft.columnId}
                                    onChange={e => setDraft(d => ({ ...d, columnId: e.target.value }))}
                                >
                                    {FIXED_COLUMNS.map(col => (
                                        <option key={col.id} value={col.id}>{col.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Assignee */}
                        <div>
                            <span className="field-label">Assignee</span>
                            <input
                                className="modal-input"
                                value={draft.assignee}
                                onChange={e => setDraft(d => ({ ...d, assignee: e.target.value.slice(0, 40) }))}
                                placeholder="Assign to…"
                                maxLength={40}
                            />
                        </div>

                        {/* Labels (only if task exists in context) */}
                        {effectiveTaskId && liveTask && (
                            <div>
                                <span className="field-label">Labels</span>
                                <LabelPicker taskId={effectiveTaskId} />
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <span className="field-label">Description</span>
                            <textarea
                                className="modal-textarea"
                                value={draft.description}
                                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                                placeholder="Add notes, links, or context…"
                            />
                        </div>

                        {/* Checklist (only if task exists) */}
                        {effectiveTaskId && liveTask && (
                            <Checklist taskId={effectiveTaskId} />
                        )}

                        {/* Attachments (only if task exists) */}
                        {effectiveTaskId && liveTask && (
                            <Attachments taskId={effectiveTaskId} onViewFile={setLightboxFile} />
                        )}

                        {/* Comments (only if task exists) */}
                        {effectiveTaskId && liveTask && (
                            <Comments taskId={effectiveTaskId} />
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer">
                        <div>
                            {!isCreate && effectiveTaskId && (
                                showDeleteConfirm ? (
                                    <div className="modal-delete-confirm">
                                        Delete this task?
                                        <button className="yes" onClick={handleDelete}>Yes</button>
                                        <button className="no" onClick={() => setShowDeleteConfirm(false)}>No</button>
                                    </div>
                                ) : (
                                    <button className="modal-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                                        Delete Task
                                    </button>
                                )
                            )}
                        </div>
                        <button
                            className="modal-save-btn"
                            disabled={!canSave}
                            onClick={handleSave}
                        >
                            {isCreate ? 'Add Task' : 'Save Changes'}
                        </button>
                    </div>

                    {liveTask && (
                        <div className="modal-created-at">
                            Created {formatTimestamp(liveTask.createdAt)}
                        </div>
                    )}
                </div>
            </div>

            {lightboxFile && (
                <Lightbox attachment={lightboxFile} onClose={() => setLightboxFile(null)} />
            )}
        </>
    )
}
