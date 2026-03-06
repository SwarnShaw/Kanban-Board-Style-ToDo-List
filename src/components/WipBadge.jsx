import React, { useState, useRef, useEffect } from 'react'
import { useBoardContext } from '../context/BoardContext'

export default function WipBadge({ columnId, taskCount }) {
    const { activeBoard, dispatch } = useBoardContext()
    const [editing, setEditing] = useState(false)
    const inputRef = useRef(null)

    const wipLimit = activeBoard?.wipLimits?.[columnId] ??
        (columnId === 'col_inprogress' ? 3 : null)

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [editing])

    const handleSave = (val) => {
        const num = parseInt(val)
        const limit = isNaN(num) || num <= 0 ? null : Math.min(num, 99)
        dispatch({ type: 'SET_WIP_LIMIT', payload: { columnId, limit } })
        setEditing(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave(e.target.value)
        if (e.key === 'Escape') setEditing(false)
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                className="wip-inline-input"
                type="number"
                min="0"
                max="99"
                defaultValue={wipLimit || ''}
                onKeyDown={handleKeyDown}
                onBlur={(e) => handleSave(e.target.value)}
                aria-label="Set WIP limit"
            />
        )
    }

    if (wipLimit === null || wipLimit === undefined) {
        return (
            <button className="wip-badge set-wip" onClick={() => setEditing(true)}>
                Set WIP
            </button>
        )
    }

    const status = taskCount > wipLimit ? 'over-limit'
        : taskCount === wipLimit ? 'at-limit'
            : 'under'

    const icon = status === 'over-limit' ? ' ✕' : status === 'at-limit' ? ' ⚠' : ''

    return (
        <button
            className={`wip-badge ${status}`}
            onClick={() => setEditing(true)}
            aria-label={`WIP limit: ${taskCount}/${wipLimit}`}
        >
            WIP: {taskCount}/{wipLimit}{icon}
        </button>
    )
}
