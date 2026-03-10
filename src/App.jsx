import React, { useState, useEffect } from 'react'
import { BoardProvider } from './context/BoardContext'
import Navbar from './components/Navbar'
import Board from './components/Board'
import ListView from './components/ListView'
import Analytics from './components/Analytics'
import TaskModal from './components/TaskModal'
import BackgroundShapes from './components/BackgroundShapes'

export default function App() {
    const [view, setView] = useState('board')
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [modalState, setModalState] = useState({ open: false, mode: 'create', taskId: null, columnId: 'col_todo' })
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({ priority: [], dueDate: [], labels: [], hideCompleted: false })
    const [swimlaneMode, setSwimlaneMode] = useState('none')
    const [isReminderVisible, setIsReminderVisible] = useState(false)

    const hasActiveFilters = filters.priority.length > 0 || filters.dueDate.length > 0 ||
        filters.labels.length > 0 || filters.hideCompleted

    useEffect(() => {
        const updateOffset = () => {
            const navbar = 56
            const pills = hasActiveFilters ? 40 : 0
            const banner = isReminderVisible ? 40 : 0
            const total = navbar + pills + banner

            document.documentElement.style.setProperty(
                '--total-offset', `${total}px`
            )
        }
        updateOffset()
    }, [hasActiveFilters, isReminderVisible])

    const openCreateModal = (columnId) => {
        setModalState({ open: true, mode: 'create', taskId: null, columnId })
    }

    const openEditModal = (taskId) => {
        setModalState({ open: true, mode: 'edit', taskId, columnId: null })
    }

    const closeModal = () => {
        setModalState({ open: false, mode: 'create', taskId: null, columnId: 'col_todo' })
    }

    const contentClasses = ['app-content']
    if (hasActiveFilters) contentClasses.push('has-filters')
    if (isReminderVisible) contentClasses.push('has-reminder')

    return (
        <BoardProvider>
            <BackgroundShapes />
            <Navbar
                view={view}
                setView={setView}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                swimlaneMode={swimlaneMode}
                setSwimlaneMode={setSwimlaneMode}
                onOpenAnalytics={() => setShowAnalytics(true)}
            />

            <div className={contentClasses.join(' ')}>
                {view === 'board' ? (
                    <Board
                        searchQuery={searchQuery}
                        filters={filters}
                        swimlaneMode={swimlaneMode}
                        onAddTask={openCreateModal}
                        onEditTask={openEditModal}
                        setFilters={setFilters}
                        onReminderChange={setIsReminderVisible}
                        hasActiveFilters={hasActiveFilters}
                    />
                ) : (
                    <ListView
                        searchQuery={searchQuery}
                        filters={filters}
                        onEditTask={openEditModal}
                    />
                )}
            </div>

            {showAnalytics && (
                <Analytics onClose={() => setShowAnalytics(false)} />
            )}

            {modalState.open && (
                <TaskModal
                    mode={modalState.mode}
                    taskId={modalState.taskId}
                    columnId={modalState.columnId}
                    onClose={closeModal}
                />
            )}
        </BoardProvider>
    )
}
