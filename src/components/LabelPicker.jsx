import React, { useState, useRef, useEffect } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { labelId as genLabelId } from '../utils/idGenerators'
import { DEFAULT_LABELS } from '../constants/defaultLabels'
import { X, Check, Trash2 } from 'lucide-react'

const SWATCH_COLORS = [
    'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--info)',
    'var(--priority-high)', 'var(--priority-medium)', 'var(--priority-low)', 'var(--accent)'
]

export default function LabelPicker({ taskId }) {
    const { activeLabels, activeTasks, dispatch } = useBoardContext()
    const [showDropdown, setShowDropdown] = useState(false)
    const [newLabelName, setNewLabelName] = useState('')
    const [newLabelColor, setNewLabelColor] = useState(SWATCH_COLORS[0])
    const [deletingId, setDeletingId] = useState(null)
    const ref = useRef(null)
    const fieldRef = useRef(null)

    const liveTask = activeTasks.find(t => t.id === taskId)
    const appliedLabelIds = liveTask?.labelIds || []

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const toggleLabel = (labelId) => {
        dispatch({ type: 'TOGGLE_LABEL_ON_TASK', payload: { taskId, labelId } })
    }

    const removeLabel = (labelId) => {
        dispatch({ type: 'TOGGLE_LABEL_ON_TASK', payload: { taskId, labelId } })
    }

    const createLabel = () => {
        if (!newLabelName.trim()) return
        const label = { id: genLabelId(), name: newLabelName.trim(), color: newLabelColor }
        dispatch({ type: 'CREATE_LABEL', payload: { label } })
        setNewLabelName('')
    }

    const appliedLabels = appliedLabelIds.map(id => activeLabels.find(l => l.id === id)).filter(Boolean)

    const getDropdownPos = () => {
        if (!fieldRef.current) return {}
        const rect = fieldRef.current.getBoundingClientRect()
        return { top: rect.bottom + 4, left: rect.left }
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <div ref={fieldRef} className="label-picker-field" onClick={() => setShowDropdown(!showDropdown)}>
                {appliedLabels.length === 0 && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Select labels…</span>
                )}
                {appliedLabels.map(label => (
                    <span
                        key={label.id}
                        className="label-pill"
                        style={{ backgroundColor: label.color }}
                    >
                        {label.name}
                        <button onClick={(e) => { e.stopPropagation(); removeLabel(label.id) }}>
                            <X size={12} />
                        </button>
                    </span>
                ))}
            </div>

            {showDropdown && (
                <div className="label-dropdown" style={getDropdownPos()}>
                    {activeLabels.map(label => {
                        const isApplied = appliedLabelIds.includes(label.id)
                        return (
                            <div key={label.id} className="label-option" style={{ padding: '0 8px 0 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, padding: '6px 0' }} onClick={() => toggleLabel(label.id)}>
                                    <span className="check" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isApplied ? <Check size={12} /> : ''}
                                    </span>
                                    <span className="label-color-pip" style={{ backgroundColor: label.color }} />
                                    <span>{label.name}</span>
                                </div>
                                {deletingId === label.id ? (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                dispatch({ type: 'DELETE_LABEL', payload: { labelId: label.id } })
                                                setDeletingId(null)
                                            }}
                                            style={{ background: 'var(--danger)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
                                        >
                                            Sure?
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeletingId(null)
                                            }}
                                            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    !DEFAULT_LABELS.find(dl => dl.id === label.id) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeletingId(label.id) }}
                                            className="delete-label-btn"
                                            style={{
                                                background: 'none', border: 'none', color: 'var(--text-secondary)',
                                                cursor: 'pointer', fontSize: 13, padding: '8px', margin: '-4px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            aria-label="Delete label"
                                            title="Delete label globally"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )
                                )}
                            </div>
                        )
                    })}
                    <div className="create-label-section">
                        <div style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 6
                        }}>
                            Create label
                        </div>
                        <div className="create-label-row">
                            <input
                                value={newLabelName}
                                onChange={e => setNewLabelName(e.target.value.slice(0, 30))}
                                placeholder="Label name"
                                onKeyDown={e => { if (e.key === 'Enter') createLabel() }}
                            />
                        </div>
                        <div className="color-swatches">
                            {SWATCH_COLORS.map(c => (
                                <button
                                    key={c}
                                    className={`color-swatch ${newLabelColor === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setNewLabelColor(c)}
                                    aria-label={`Color ${c}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
