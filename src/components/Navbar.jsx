import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBoardContext } from '../context/BoardContext'
import BoardSelector from './BoardSelector'
import FilterDropdown from './FilterDropdown'
import { Search, X, Layers, Filter, BarChart2, Download, Moon } from 'lucide-react'

export default function Navbar({
    view, setView, searchQuery, setSearchQuery,
    filters, setFilters, swimlaneMode, setSwimlaneMode,
    onOpenAnalytics
}) {
    const { state, dispatch } = useBoardContext()
    const [showFilter, setShowFilter] = useState(false)
    const [showSwimlane, setShowSwimlane] = useState(false)
    const [mobileSearch, setMobileSearch] = useState(false)
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

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <BoardSelector />

                    <div className={`search-bar ${mobileSearch ? 'expanded' : ''} reference-search`}>
                        <span className="search-icon">
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

                    <button
                        ref={swimlaneBtnRef}
                        className={`nav-btn btn-ref-filter ${swimlaneMode !== 'none' ? 'active' : ''}`}
                        onClick={() => setShowSwimlane(!showSwimlane)}
                    >
                        <Layers size={14} />
                        Swimlanes
                    </button>

                    <button
                        ref={filterBtnRef}
                        className={`nav-btn btn-ref-filter ${activeFilterCount > 0 ? 'active' : ''}`}
                        onClick={() => showFilter ? setShowFilter(false) : openFilter()}
                    >
                        <Filter size={14} />
                        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                </div>

                <div className="navbar-right">

                    <button className="nav-icon-btn-minimal" onClick={onOpenAnalytics} aria-label="Analytics">
                        <BarChart2 size={16} />
                    </button>
                    <button className="nav-icon-btn-minimal" onClick={handleExport} aria-label="Export">
                        <Download size={16} />
                    </button>
                    <button className="nav-icon-btn-minimal" onClick={toggleTheme} aria-label="Toggle Theme">
                        <Moon size={16} />
                    </button>
                </div>

            </nav>

            {/* Swimlanes Dropdown */}
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

            {/* Filter Dropdown via createPortal — right-aligned to Filter button */}
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
                                <button onClick={() => removePill(pill)} aria-label={`Remove ${pill.label} filter`}>
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
