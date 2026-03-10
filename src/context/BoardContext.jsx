import React, { createContext, useReducer, useContext, useEffect, useMemo } from 'react'
import { migrate } from '../utils/migration'
import { readLocalStorage } from '../hooks/useLocalStorage'
import { DEFAULT_LABELS } from '../constants/defaultLabels'
import { boardId as genBoardId } from '../utils/idGenerators'

const BoardContext = createContext()

function boardReducer(state, action) {
    const { type, payload } = action
    const activeBoardIndex = state.boards.findIndex(b => b.id === state.activeBoardId)
    if (activeBoardIndex === -1 && !['CREATE_BOARD', 'SWITCH_BOARD', 'SET_THEME'].includes(type)) {
        return state
    }

    function updateActiveBoard(updater) {
        const boards = [...state.boards]
        boards[activeBoardIndex] = updater(boards[activeBoardIndex])
        return { ...state, boards }
    }

    switch (type) {
        case 'ADD_TASK':
            return updateActiveBoard(board => ({
                ...board,
                tasks: [...board.tasks, payload.task]
            }))

        case 'UPDATE_TASK':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId ? { ...t, ...payload.changes } : t
                )
            }))

        case 'DELETE_TASK':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.filter(t => t.id !== payload.taskId)
            }))

        case 'MOVE_TASK':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId ? { ...t, columnId: payload.newColumnId } : t
                )
            }))

        case 'ADD_COMMENT':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? { ...t, comments: [payload.comment, ...t.comments] }
                        : t
                )
            }))

        case 'DELETE_COMMENT':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? { ...t, comments: t.comments.filter(c => c.id !== payload.commentId) }
                        : t
                )
            }))

        case 'ADD_ATTACHMENT_UPLOADING':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? { ...t, attachments: [...t.attachments, payload.attachment] }
                        : t
                )
            }))

        case 'COMPLETE_ATTACHMENT':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? {
                            ...t,
                            attachments: t.attachments.map(a =>
                                a.id === payload.tempId
                                    ? { ...a, dataUrl: payload.dataUrl, status: payload.status }
                                    : a
                            )
                        }
                        : t
                )
            }))

        case 'DELETE_ATTACHMENT':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? { ...t, attachments: t.attachments.filter(a => a.id !== payload.attachmentId) }
                        : t
                )
            }))

        case 'ADD_CHECKLIST_ITEM':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? { ...t, checklist: [...t.checklist, payload.item] }
                        : t
                )
            }))

        case 'TOGGLE_CHECKLIST_ITEM':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? {
                            ...t,
                            checklist: t.checklist.map(i =>
                                i.id === payload.itemId ? { ...i, isChecked: !i.isChecked } : i
                            )
                        }
                        : t
                )
            }))

        case 'DELETE_CHECKLIST_ITEM':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? { ...t, checklist: t.checklist.filter(i => i.id !== payload.itemId) }
                        : t
                )
            }))

        case 'REORDER_CHECKLIST':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId ? { ...t, checklist: payload.orderedItems } : t
                )
            }))

        case 'UPDATE_CHECKLIST_TEXT':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t =>
                    t.id === payload.taskId
                        ? {
                            ...t,
                            checklist: t.checklist.map(i =>
                                i.id === payload.itemId ? { ...i, text: payload.text } : i
                            )
                        }
                        : t
                )
            }))

        case 'CREATE_LABEL':
            return updateActiveBoard(board => ({
                ...board,
                labels: [...board.labels, payload.label]
            }))

        case 'DELETE_LABEL':
            return updateActiveBoard(board => ({
                ...board,
                labels: board.labels.filter(l => l.id !== payload.labelId),
                tasks: board.tasks.map(t => ({
                    ...t,
                    labelIds: t.labelIds.filter(id => id !== payload.labelId)
                }))
            }))

        case 'SET_WIP_LIMIT':
            return updateActiveBoard(board => ({
                ...board,
                wipLimits: {
                    ...board.wipLimits,
                    [payload.columnId]: payload.limit
                }
            }))

        case 'CREATE_BOARD': {
            const newId = genBoardId()
            return {
                ...state,
                boards: [...state.boards, {
                    id: newId,
                    name: payload.name || 'New Board',
                    tasks: [],
                    labels: DEFAULT_LABELS.map(l => ({ ...l })),
                    activity: [],
                    wipLimits: {}
                }],
                activeBoardId: newId
            }
        }

        case 'RENAME_BOARD':
            return {
                ...state,
                boards: state.boards.map(b =>
                    b.id === payload.boardId ? { ...b, name: payload.name } : b
                )
            }

        case 'DELETE_BOARD': {
            if (state.boards.length <= 1) return state
            const remaining = state.boards.filter(b => b.id !== payload.boardId)
            return {
                ...state,
                boards: remaining,
                activeBoardId: state.activeBoardId === payload.boardId
                    ? remaining[0].id
                    : state.activeBoardId
            }
        }

        case 'SWITCH_BOARD':
            return { ...state, activeBoardId: payload.boardId }

        case 'LOG_ACTIVITY':
            return updateActiveBoard(board => ({
                ...board,
                activity: [payload.entry, ...board.activity].slice(0, 50)
            }))

        case 'SET_THEME':
            document.documentElement.setAttribute('data-theme', payload.theme)
            try {
                const metaTheme = document.querySelector('meta[name="theme-color"]')
                if (metaTheme) metaTheme.setAttribute('content', payload.theme === 'dark' ? '#121212' : '#ffffff')
            } catch (e) { }
            return { ...state, theme: payload.theme }

        case 'TOGGLE_LABEL_ON_TASK':
            return updateActiveBoard(board => ({
                ...board,
                tasks: board.tasks.map(t => {
                    if (t.id !== payload.taskId) return t
                    const has = t.labelIds.includes(payload.labelId)
                    return {
                        ...t,
                        labelIds: has
                            ? t.labelIds.filter(id => id !== payload.labelId)
                            : [...t.labelIds, payload.labelId]
                    }
                })
            }))

        default:
            return state
    }
}

const initialState = migrate(readLocalStorage())

export function BoardProvider({ children }) {
    const [state, dispatch] = useReducer(boardReducer, initialState)

    useEffect(() => {
        localStorage.setItem('todo_app_v1', JSON.stringify(state))
    }, [state])

    const activeBoard = useMemo(() =>
        state.boards.find(b => b.id === state.activeBoardId) || state.boards[0],
        [state.boards, state.activeBoardId]
    )

    const activeTasks = activeBoard?.tasks || []
    const activeLabels = activeBoard?.labels || []

    const value = useMemo(() => ({
        state,
        dispatch,
        activeBoard,
        activeTasks,
        activeLabels
    }), [state, activeBoard, activeTasks, activeLabels])

    return (
        <BoardContext.Provider value={value}>
            {children}
        </BoardContext.Provider>
    )
}

export function useBoardContext() {
    const ctx = useContext(BoardContext)
    if (!ctx) throw new Error('useBoardContext must be used within BoardProvider')
    return ctx
}

export default BoardContext
