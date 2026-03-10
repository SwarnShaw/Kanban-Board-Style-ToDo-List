import React, { useState, useEffect } from 'react'
import { BoardProvider } from './context/BoardContext'
import Navbar from './components/Navbar'
import Board from './components/Board'
import ListView from './components/ListView'
import Analytics from './components/Analytics'
import TaskModal from './components/TaskModal'
import BackgroundShapes from './components/BackgroundShapes'
import FilterDropdown from './components/FilterDropdown'
import { Layers, Filter, LayoutGrid, List, Plus } from 'lucide-react'

export default function App() {
    const [view, setView] = useState('board')
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [modalState, setModalState] = useState({ open: false, mode: 'create', taskId: null, columnId: 'col_todo' })
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({ priority: [], dueDate: [], labels: [], hideCompleted: false })
    const [swimlaneMode, setSwimlaneMode] = useState('none')
    const [isReminderVisible, setIsReminderVisible] = useState(false)
    const [swimlaneSheetOpen, setSwimlaneSheetOpen] = useState(false)
    const [showMobileFilter, setShowMobileFilter] = useState(false)

    const hasActiveFilters = filters.priority.length > 0 || filters.dueDate.length > 0 ||
        filters.labels.length > 0 || filters.hideCompleted

    useEffect(() => {
        const updateOffset = () => {
            const isMobile = window.innerWidth < 768
            const navbar = isMobile ? 96 : 56
            const pills = hasActiveFilters ? (isMobile ? 36 : 40) : 0
            const banner = isReminderVisible ? (isMobile ? 36 : 40) : 0
            const total = navbar + pills + banner

            document.documentElement.style.setProperty(
                '--total-offset', `${total}px`
            )
        }
        updateOffset()
        window.addEventListener('resize', updateOffset)
        return () => window.removeEventListener('resize', updateOffset)
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

    const activeFilterCount = filters.priority.length + filters.dueDate.length +
        filters.labels.length + (filters.hideCompleted ? 1 : 0)

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

            {/* ── NEW MOBILE BOTTOM BAR (mob-bar) ── */}
            <div className="mob-bar" role="navigation" aria-label="Mobile navigation">
                <button
                    type="button"
                    className={`mob-bar__btn ${view === 'board' ? 'mob-bar__btn--active' : ''}`}
                    onClick={() => setView('board')}
                    aria-label="Board view"
                >
                    <span className="mob-bar__icon"><LayoutGrid size={20} /></span>
                    <span className="mob-bar__label">Board</span>
                </button>

                <button
                    type="button"
                    className={`mob-bar__btn ${hasActiveFilters ? 'mob-bar__btn--active' : ''}`}
                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                    aria-label="Filter"
                >
                    <span className="mob-bar__icon"><Filter size={20} /></span>
                    {activeFilterCount > 0 && (
                        <span className="mob-bar__badge">{activeFilterCount}</span>
                    )}
                    <span className="mob-bar__label">Filter</span>
                </button>

                <button
                    type="button"
                    className="mob-bar__fab"
                    onClick={() => openCreateModal('col_todo')}
                    aria-label="Add task"
                >
                    <span className="mob-bar__fab-icon"><Plus size={26} /></span>
                </button>

                <button
                    type="button"
                    className={`mob-bar__btn ${swimlaneMode !== 'none' ? 'mob-bar__btn--active' : ''}`}
                    onClick={() => setSwimlaneSheetOpen(true)}
                    aria-label="Swimlanes"
                >
                    <span className="mob-bar__icon"><Layers size={20} /></span>
                    <span className="mob-bar__label">Group</span>
                </button>

                <button
                    type="button"
                    className={`mob-bar__btn ${view === 'list' ? 'mob-bar__btn--active' : ''}`}
                    onClick={() => setView('list')}
                    aria-label="List view"
                >
                    <span className="mob-bar__icon"><List size={20} /></span>
                    <span className="mob-bar__label">List</span>
                </button>
            </div>

            {/* ── SWIMLANE PICKER BOTTOM SHEET ── */}
            <div className={`sheet-backdrop ${swimlaneSheetOpen ? 'open' : ''}`}
                onClick={() => setSwimlaneSheetOpen(false)} />
            <div className={`swimlane-sheet ${swimlaneSheetOpen ? 'open' : ''}`}>
                <div className="swimlane-sheet__handle" />
                <div className="swimlane-sheet__header">
                    <span className="swimlane-sheet__title">Group by</span>
                    <button className="swimlane-sheet__close"
                        onClick={() => setSwimlaneSheetOpen(false)}>✕</button>
                </div>

                <button
                    className={`swimlane-sheet__option ${swimlaneMode === 'none' ? 'active' : ''}`}
                    onClick={() => { setSwimlaneMode('none'); setSwimlaneSheetOpen(false) }}
                >
                    <span className="swimlane-sheet__option-icon">⊡</span>
                    <span className="swimlane-sheet__option-label">No grouping</span>
                    {swimlaneMode === 'none' && <span className="swimlane-sheet__check">✓</span>}
                </button>

                <button
                    className={`swimlane-sheet__option ${swimlaneMode === 'priority' ? 'active' : ''}`}
                    onClick={() => { setSwimlaneMode('priority'); setSwimlaneSheetOpen(false) }}
                >
                    <span className="swimlane-sheet__option-icon">🔴</span>
                    <div className="swimlane-sheet__option-label">
                        By Priority
                        <span className="swimlane-sheet__option-sub">High · Medium · Low · None</span>
                    </div>
                    {swimlaneMode === 'priority' && <span className="swimlane-sheet__check">✓</span>}
                </button>

                <button
                    className={`swimlane-sheet__option ${swimlaneMode === 'assignee' ? 'active' : ''}`}
                    onClick={() => { setSwimlaneMode('assignee'); setSwimlaneSheetOpen(false) }}
                >
                    <span className="swimlane-sheet__option-icon">👤</span>
                    <div className="swimlane-sheet__option-label">
                        By Assignee
                        <span className="swimlane-sheet__option-sub">One row per person</span>
                    </div>
                    {swimlaneMode === 'assignee' && <span className="swimlane-sheet__check">✓</span>}
                </button>

                <button
                    className={`swimlane-sheet__option ${swimlaneMode === 'label' ? 'active' : ''}`}
                    onClick={() => { setSwimlaneMode('label'); setSwimlaneSheetOpen(false) }}
                >
                    <span className="swimlane-sheet__option-icon">🏷</span>
                    <div className="swimlane-sheet__option-label">
                        By Label
                        <span className="swimlane-sheet__option-sub">One row per label</span>
                    </div>
                    {swimlaneMode === 'label' && <span className="swimlane-sheet__check">✓</span>}
                </button>

                <div className="swimlane-sheet__footer-space" />
            </div>

            {/* ── MOBILE FILTER SHEET ── */}
            {showMobileFilter && (
                <>
                    <div
                        className="filter-backdrop"
                        onClick={() => setShowMobileFilter(false)}
                    />
                    <FilterDropdown
                        filters={filters}
                        setFilters={setFilters}
                        onClose={() => setShowMobileFilter(false)}
                    />
                </>
            )}

            <Analytics isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />

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
