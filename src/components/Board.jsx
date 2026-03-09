import React, { useState, useMemo, useCallback } from 'react'
import { DndContext, closestCorners, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardContext } from '../context/BoardContext'
import { FIXED_COLUMNS } from '../constants/columns'
import { sortTasks } from '../utils/sortTasks'
import { isOverdue, isDueToday, isDueThisWeek } from '../utils/formatDate'
import { activityId } from '../utils/idGenerators'
import Column from './Column'
import TaskCard from './TaskCard'
import ReminderBanner from './ReminderBanner'
import Swimlanes from './Swimlanes'

export default function Board({ searchQuery, filters, swimlaneMode, onAddTask, onEditTask, setFilters, onReminderChange, hasActiveFilters }) {
    const { activeTasks, activeLabels, activeBoard, dispatch } = useBoardContext()
    const [activeTask, setActiveTask] = useState(null)

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
        useSensor(KeyboardSensor)
    )

    const filteredTasks = useMemo(() => {
        let tasks = activeTasks
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            tasks = tasks.map(t => ({
                ...t,
                _matchesSearch: t.title.toLowerCase().includes(q) ||
                    (t.description || '').toLowerCase().includes(q)
            }))
        }
        return tasks
    }, [activeTasks, searchQuery])

    const matchesFilters = useCallback((task) => {
        if (filters.priority.length > 0) {
            const tp = task.priority || 'None'
            if (!filters.priority.includes(tp) && !(task.priority === null && filters.priority.includes('None'))) return false
        }
        if (filters.dueDate.length > 0) {
            const matches = filters.dueDate.some(f => {
                if (f === 'Overdue') return isOverdue(task.dueDate)
                if (f === 'Due Today') return isDueToday(task.dueDate)
                if (f === 'Due This Week') return isDueThisWeek(task.dueDate)
                if (f === 'No Date') return !task.dueDate
                return false
            })
            if (!matches) return false
        }
        if (filters.labels.length > 0) {
            if (!filters.labels.some(l => task.labelIds.includes(l.id))) return false
        }
        if (filters.hideCompleted && task.columnId === 'col_done') return false
        return true
    }, [filters])

    const columnTasks = useMemo(() => {
        const map = {}
        FIXED_COLUMNS.forEach(col => { map[col.id] = [] })
        filteredTasks.forEach(t => { if (map[t.columnId]) map[t.columnId].push(t) })
        Object.keys(map).forEach(colId => { map[colId] = sortTasks(map[colId]) })
        return map
    }, [filteredTasks])

    const handleDragStart = ({ active }) => {
        setActiveTask(activeTasks.find(t => t.id === active.id) || null)
    }

    const handleDragEnd = ({ active, over }) => {
        setActiveTask(null)
        if (!over) return
        const task = activeTasks.find(t => t.id === active.id)
        if (!task) return
        let newColumnId = over.id
        if (!FIXED_COLUMNS.find(c => c.id === newColumnId)) {
            const overTask = activeTasks.find(t => t.id === over.id)
            if (overTask) newColumnId = overTask.columnId
            else return
        }
        if (task.columnId !== newColumnId) {
            const fromCol = FIXED_COLUMNS.find(c => c.id === task.columnId)
            const toCol = FIXED_COLUMNS.find(c => c.id === newColumnId)
            dispatch({ type: 'MOVE_TASK', payload: { taskId: active.id, newColumnId } })
            dispatch({
                type: 'LOG_ACTIVITY',
                payload: {
                    entry: {
                        id: activityId(), type: 'moved', taskTitle: task.title,
                        fromColumn: fromCol?.title, toColumn: toCol?.title, timestamp: new Date().toISOString()
                    }
                }
            })
        }
    }

    const boardContent = swimlaneMode !== 'none' ? (
        <Swimlanes
            swimlaneMode={swimlaneMode} columnTasks={columnTasks}
            searchQuery={searchQuery} matchesFilters={matchesFilters}
            onEditTask={onEditTask} onAddTask={onAddTask}
        />
    ) : (
        FIXED_COLUMNS.map(col => (
            <SortableContext key={col.id} id={col.id} items={columnTasks[col.id].map(t => t.id)} strategy={verticalListSortingStrategy}>
                <Column col={col} tasks={columnTasks[col.id]} searchQuery={searchQuery}
                    matchesFilters={matchesFilters} onAddTask={onAddTask} onEditTask={onEditTask} />
            </SortableContext>
        ))
    )

    return (
        <>
            <ReminderBanner setFilters={setFilters} hasActiveFilters={hasActiveFilters} onVisibilityChange={onReminderChange} />
            <div className={`board-container ${swimlaneMode !== 'none' ? 'swimlanes-active' : ''}`}>
                {isMobile ? boardContent : (
                    <DndContext sensors={sensors} collisionDetection={closestCorners}
                        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        {boardContent}
                        <DragOverlay>{activeTask && <TaskCard task={activeTask} isOverlay />}</DragOverlay>
                    </DndContext>
                )}
            </div>
        </>
    )
}
