import React, { useState, useRef, useEffect } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { ChevronDown, Edit2, Trash2, Plus } from 'lucide-react'

export default function BoardSelector() {
    const { state, dispatch, activeBoard } = useBoardContext()
    const [open, setOpen] = useState(false)
    const [renamingId, setRenamingId] = useState(null)
    const [renameValue, setRenameValue] = useState('')
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)
    const [creatingNew, setCreatingNew] = useState(false)
    const [newName, setNewName] = useState('')
    const ref = useRef(null)
    const buttonRef = useRef(null)
    const renameRef = useRef(null)
    const newRef = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false)
                setRenamingId(null)
                setDeleteConfirmId(null)
                setCreatingNew(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    useEffect(() => {
        if (renamingId && renameRef.current) { renameRef.current.focus(); renameRef.current.select() }
    }, [renamingId])

    useEffect(() => {
        if (creatingNew && newRef.current) newRef.current.focus()
    }, [creatingNew])

    const handleSwitch = (boardId) => {
        dispatch({ type: 'SWITCH_BOARD', payload: { boardId } })
        setOpen(false)
    }

    const handleRename = (boardId) => {
        if (renameValue.trim()) {
            dispatch({ type: 'RENAME_BOARD', payload: { boardId, name: renameValue.trim().slice(0, 40) } })
        }
        setRenamingId(null)
    }

    const handleDelete = (boardId) => {
        dispatch({ type: 'DELETE_BOARD', payload: { boardId } })
        setDeleteConfirmId(null)
    }

    const handleCreate = () => {
        if (!newName.trim()) return
        dispatch({ type: 'CREATE_BOARD', payload: { name: newName.trim().slice(0, 40) } })
        setNewName('')
        setCreatingNew(false)
    }

    const atLimit = state.boards.length >= 10

    const getDropdownPos = () => {
        if (!buttonRef.current) return {}
        const rect = buttonRef.current.getBoundingClientRect()
        return { top: rect.bottom + 4, left: rect.left }
    }

    return (
        <div className="board-selector" ref={ref}>
            <button ref={buttonRef} className="board-selector-btn" onClick={() => setOpen(!open)}>
                {activeBoard ? activeBoard.name : 'My Board'}
                <ChevronDown className="board-selector-chevron" size={14} />
            </button>

            {open && (
                <div className="board-dropdown" style={getDropdownPos()}>
                    {state.boards.map(board => (
                        <div
                            key={board.id}
                            className={`board-item ${board.id === state.activeBoardId ? 'active' : ''}`}
                        >
                            {renamingId === board.id ? (
                                <input
                                    ref={renameRef}
                                    className="board-rename-input"
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value.slice(0, 40))}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleRename(board.id)
                                        if (e.key === 'Escape') setRenamingId(null)
                                    }}
                                    onBlur={() => handleRename(board.id)}
                                    maxLength={40}
                                />
                            ) : deleteConfirmId === board.id ? (
                                <div style={{ flex: 1, fontSize: 11, color: 'var(--danger)' }}>
                                    Delete board and all its tasks?
                                    <button style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', marginLeft: 6, fontSize: 11 }}
                                        onClick={() => handleDelete(board.id)}>Yes</button>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 4, fontSize: 11 }}
                                        onClick={() => setDeleteConfirmId(null)}>No</button>
                                </div>
                            ) : (
                                <>
                                    <span className="board-item-name" onClick={() => handleSwitch(board.id)}>
                                        {board.name}
                                    </span>
                                    <div className="board-item-actions">
                                        <button onClick={() => { setRenamingId(board.id); setRenameValue(board.name) }}
                                            aria-label="Rename board">
                                            <Edit2 size={13} />
                                        </button>
                                        {state.boards.length > 1 && (
                                            <button className="delete" onClick={() => setDeleteConfirmId(board.id)}
                                                aria-label="Delete board">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {creatingNew ? (
                        <div style={{ padding: '6px 10px' }}>
                            <input
                                ref={newRef}
                                className="board-rename-input"
                                style={{ width: '100%' }}
                                value={newName}
                                onChange={e => setNewName(e.target.value.slice(0, 40))}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreate()
                                    if (e.key === 'Escape') setCreatingNew(false)
                                }}
                                placeholder="Board name"
                                maxLength={40}
                            />
                        </div>
                    ) : (
                        <button
                            className="new-board-btn"
                            onClick={() => { setCreatingNew(true); setNewName('') }}
                            disabled={atLimit}
                            title={atLimit ? 'Maximum 10 boards reached' : ''}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Plus size={14} /> New Board
                            </span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
