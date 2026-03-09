import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBoardContext } from '../context/BoardContext'
import BoardSelector from './BoardSelector'
import FilterDropdown from './FilterDropdown'
import { Search, X, Layers, Filter, BarChart2, Download, Moon, Sun, LayoutGrid, List } from 'lucide-react'

export default function Navbar({
    view, setView, searchQuery, setSearchQuery,
    filters, setFilters, swimlaneMode, setSwimlaneMode,
    onOpenAnalytics
}) {
    const { state, dispatch } = useBoardContext()
    const [showFilter, setShowFilter] = useState(false)
    const [showSwimlane, setShowSwimlane] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
    const filterBtnRef = useRef(null)
    const swimlaneBtnRef = useRef(null)
    const filterRef = useRef(null)
    const swimlaneRef = useRef(null)

    const theme = state.theme
    const toggleTheme = () => {
        dispatch({ type: 'SET_THEME', payload: { theme: theme === 'dark' ? 'light' : 'dark' } })
    }

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'todo-backup.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Close swimlane dropdown on outside click
    useEffect(() => {
        function handleClick(e) {
            if (swimlaneRef.current && !swimlaneRef.current.contains(e.target) &&
                swimlaneBtnRef.current && !swimlaneBtnRef.current.contains(e.target)) setShowSwimlane(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // Recalculate filter dropdown position on resize while open
    useEffect(() => {
        if (!showFilter) return
        const recalc = () => {
            if (filterBtnRef.current) {
                const rect = filterBtnRef.current.getBoundingClientRect()
                setDropdownPos({
                    top: rect.bottom + 6,
                    left: rect.left
                })
            }
        }
        window.addEventListener('resize', recalc)
        return () => window.removeEventListener('resize', recalc)
    }, [showFilter])

    const activeFilterCount = filters.priority.length + filters.dueDate.length +
        filters.labels.length + (filters.hideCompleted ? 1 : 0)

    const filterPills = []
    filters.priority.forEach(p => filterPills.push({ type: 'priority', value: p, label: p }))
    filters.dueDate.forEach(d => filterPills.push({ type: 'dueDate', value: d, label: d }))
    filters.labels.forEach(l => filterPills.push({ type: 'labels', value: l.id, label: l.name }))
    if (filters.hideCompleted) filterPills.push({ type: 'hideCompleted', value: true, label: 'Hide Completed' })

    const removePill = (pill) => {
        if (pill.type === 'priority') setFilters(f => ({ ...f, priority: f.priority.filter(p => p !== pill.value) }))
        else if (pill.type === 'dueDate') setFilters(f => ({ ...f, dueDate: f.dueDate.filter(d => d !== pill.value) }))
        else if (pill.type === 'labels') setFilters(f => ({ ...f, labels: f.labels.filter(l => l.id !== pill.value) }))
        else if (pill.type === 'hideCompleted') setFilters(f => ({ ...f, hideCompleted: false }))
    }

    const openFilter = () => {
        if (filterBtnRef.current) {
            const rect = filterBtnRef.current.getBoundingClientRect()
            setDropdownPos({
                top: rect.bottom + 6,
                left: rect.left
            })
        }
        setShowFilter(true)
    }

    const getSwimlaneDropdownPos = () => {
        if (!swimlaneBtnRef.current) return {}
        const rect = swimlaneBtnRef.current.getBoundingClientRect()
        return { top: rect.bottom + 4, left: rect.left }
    }

    const closeDrawer = () => setDrawerOpen(false)
    const boards = state.boards || []
    const activeBoardId = state.activeBoardId

    const switchBoard = (boardId) => {
        dispatch({ type: 'SWITCH_BOARD', payload: { boardId } })
    }

    const createBoard = () => {
        const name = prompt('Board name:')
        if (name && name.trim()) {
            dispatch({ type: 'CREATE_BOARD', payload: { name: name.trim().slice(0, 40) } })
        }
    }

    return (
        <>
            <nav className="navbar">
                {/* ── MOBILE TOP ROW ── */}
                <div className="navbar-top-row">
                    <button
                        className={`mob-hamburger ${drawerOpen ? 'open' : ''}`}
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        aria-label="Menu"
                    >
                        <span className="mob-hamburger-icon">
                            <span /><span /><span />
                        </span>
                    </button>
                    <div className="app-name">Kanban</div>
                    <button className="theme-toggle-btn mob-theme-btn-mobile" onClick={toggleTheme} aria-label="Toggle Theme">
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                {/* ── MOBILE SEARCH ROW (Tier 2) ── */}
                <div className="navbar-search-row">
                    <div className="search-bar">
                        <span className="search-bar-icon"><Search size={14} /></span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            aria-label="Search tasks"
                        />
                        {searchQuery && (
                            <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── DESKTOP LEFT GROUP ── */}
                <div className="navbar-left">
                    <div className="app-name">Kanban</div>
                    <BoardSelector />

                    <div className="search-bar">
                        <span className="search-bar-icon">
                            <Search size={14} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            aria-label="Search tasks"
                        />
                        {searchQuery && (
                            <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="navbar-divider" />

                    <button
                        ref={swimlaneBtnRef}
                        className={`navbar-btn ${swimlaneMode !== 'none' ? 'active' : ''}`}
                        onClick={() => setShowSwimlane(!showSwimlane)}
                    >
                        <Layers size={14} />
                        Swimlanes
                    </button>

                    <button
                        ref={filterBtnRef}
                        className={`navbar-btn ${activeFilterCount > 0 ? 'active' : ''}`}
                        onClick={() => showFilter ? setShowFilter(false) : openFilter()}
                    >
                        <Filter size={14} />
                        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                </div>

                {/* ── DESKTOP RIGHT GROUP ── */}
                <div className="navbar-right">
                    <div className="view-toggle-group">
                        <button
                            className={`view-toggle-btn ${view === 'board' ? 'active' : ''}`}
                            onClick={() => setView('board')}
                            aria-label="Grid view"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
                            onClick={() => setView('list')}
                            aria-label="List view"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <div className="navbar-divider" />

                    <button className="navbar-icon-btn" onClick={onOpenAnalytics} aria-label="Analytics">
                        <BarChart2 size={16} />
                    </button>
                    <button className="navbar-icon-btn" onClick={handleExport} aria-label="Export">
                        <Download size={16} />
                    </button>
                    <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                        <Moon size={16} />
                    </button>
                </div>

            </nav>

            {/* ── MOBILE DRAWER (FROM LEFT) ── */}
            <div
                className={`mob-drawer__backdrop ${drawerOpen ? 'mob-drawer__backdrop--open' : ''}`}
                onClick={closeDrawer}
            />
            <div
                className={`mob-drawer ${drawerOpen ? 'mob-drawer--open' : ''}`}
                aria-hidden={!drawerOpen}
            >
                <div className="mob-drawer__header">
                    <div className="mob-drawer__brand">
                        <span className="mob-drawer__brand-name">ToDo</span>
                        <span className="mob-drawer__brand-sub">Kanban</span>
                    </div>
                    <button className="mob-drawer__close" onClick={closeDrawer} aria-label="Close menu">
                        <X size={16} />
                    </button>
                </div>

                <div className="mob-drawer__body">
                    {/* ── BOARDS SECTION ── */}
                    <div className="mob-drawer__section">
                        <div className="mob-drawer__section-label">My Boards</div>
                        <div className="mob-drawer__boards-list">
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    className={`mob-drawer__board-item ${board.id === activeBoardId ? 'mob-drawer__board-item--active' : ''}`}
                                    onClick={() => { switchBoard(board.id); closeDrawer() }}
                                >
                                    <span className="mob-drawer__board-dot" />
                                    <span className="mob-drawer__board-name">{board.name}</span>
                                    {board.id === activeBoardId && (
                                        <span className="mob-drawer__board-active-badge">Active</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {boards.length < 10 && (
                            <button className="mob-drawer__new-board-btn"
                                onClick={() => { createBoard(); closeDrawer() }}>
                                <span className="mob-drawer__new-board-icon">+</span>
                                New Board
                            </button>
                        )}
                    </div>

                    <div className="mob-drawer__divider" />

                    {/* ── TOOLS SECTION ── */}
                    <div className="mob-drawer__section">
                        <div className="mob-drawer__section-label">Tools</div>
                        <button className="mob-drawer__item"
                            onClick={() => { onOpenAnalytics(); closeDrawer() }}>
                            <span className="mob-drawer__item-icon"><BarChart2 size={20} /></span>
                            <div className="mob-drawer__item-content">
                                <span className="mob-drawer__item-label">Analytics</span>
                                <span className="mob-drawer__item-sub">Charts, stats & activity</span>
                            </div>
                            <span className="mob-drawer__item-arrow">›</span>
                        </button>
                        <button className="mob-drawer__item"
                            onClick={() => { handleExport(); closeDrawer() }}>
                            <span className="mob-drawer__item-icon"><Download size={20} /></span>
                            <div className="mob-drawer__item-content">
                                <span className="mob-drawer__item-label">Export</span>
                                <span className="mob-drawer__item-sub">Download as JSON</span>
                            </div>
                            <span className="mob-drawer__item-arrow">›</span>
                        </button>
                    </div>

                    <div className="mob-drawer__divider" />

                    {/* ── SETTINGS SECTION ── */}
                    <div className="mob-drawer__section">
                        <div className="mob-drawer__section-label">Settings</div>
                        <div className="mob-drawer__item mob-drawer__item--no-tap">
                            <span className="mob-drawer__item-icon">
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            </span>
                            <div className="mob-drawer__item-content">
                                <span className="mob-drawer__item-label">
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </span>
                                <span className="mob-drawer__item-sub">Tap to switch theme</span>
                            </div>
                            <button
                                className={`mob-drawer__toggle ${theme === 'dark' ? 'mob-drawer__toggle--on' : ''}`}
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                <span className="mob-drawer__toggle-thumb" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mob-drawer__footer">
                    <span className="mob-drawer__footer-text">ToDo · Kanban Task Manager</span>
                </div>
            </div>

            {/* Swimlanes Dropdown (desktop only) */}
            {showSwimlane && (
                <div ref={swimlaneRef} className="filter-dropdown" style={{ ...getSwimlaneDropdownPos(), position: 'fixed', width: 180, zIndex: 1000 }}>
                    {['none', 'priority', 'assignee', 'label'].map(mode => (
                        <div
                            key={mode}
                            className="filter-option"
                            onClick={() => { setSwimlaneMode(mode); setShowSwimlane(false) }}
                            style={{
                                fontWeight: swimlaneMode === mode ? 700 : 400,
                                color: swimlaneMode === mode ? 'var(--accent)' : undefined,
                                padding: '6px 12px', cursor: 'pointer'
                            }}
                        >
                            {mode === 'none' ? 'None' :
                                mode === 'priority' ? 'By Priority' :
                                    mode === 'assignee' ? 'By Assignee' : 'By Label'}
                        </div>
                    ))}
                </div>
            )}

            {/* Filter Dropdown via createPortal */}
            {
                showFilter && createPortal(
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 499, background: 'transparent' }}
                            onClick={() => setShowFilter(false)}
                        />
                        <div
                            ref={filterRef}
                            style={{
                                position: 'fixed',
                                top: dropdownPos.top,
                                left: dropdownPos.left,
                                zIndex: 1000,
                                width: 320,
                            }}
                        >
                            <FilterDropdown filters={filters} setFilters={setFilters} />
                        </div>
                    </>,
                    document.body
                )
            }

            {
                filterPills.length > 0 && (
                    <div className="filter-pills-bar">
                        {filterPills.map((pill, i) => (
                            <span key={i} className="filter-pill">
                                {pill.label}
                                <button className="filter-pill-remove" onClick={() => removePill(pill)} aria-label={`Remove ${pill.label} filter`}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )
            }
        </>
    )
}
