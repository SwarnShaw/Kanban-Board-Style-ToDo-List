import React from 'react'
import { useBoardContext } from '../context/BoardContext'

export default function FilterDropdown({ filters, setFilters, onClose }) {
    const { activeLabels } = useBoardContext()

    const togglePriority = (p) => {
        setFilters(f => ({
            ...f,
            priority: f.priority.includes(p)
                ? f.priority.filter(x => x !== p)
                : [...f.priority, p]
        }))
    }

    const toggleDueDate = (d) => {
        setFilters(f => ({
            ...f,
            dueDate: f.dueDate.includes(d)
                ? f.dueDate.filter(x => x !== d)
                : [...f.dueDate, d]
        }))
    }

    const toggleLabel = (label) => {
        setFilters(f => ({
            ...f,
            labels: f.labels.find(l => l.id === label.id)
                ? f.labels.filter(l => l.id !== label.id)
                : [...f.labels, label]
        }))
    }

    const clearAll = () => {
        setFilters({ priority: [], dueDate: [], labels: [], hideCompleted: false })
    }

    const hasAny = filters.priority.length > 0 || filters.dueDate.length > 0 ||
        filters.labels.length > 0 || filters.hideCompleted

    return (
        <div className="filter-dropdown" onClick={e => e.stopPropagation()}>
            <div className="filter-dropdown-header">
                <span>Filters</span>
                {hasAny && (
                    <button type="button" className="filter-clear-btn" onClick={clearAll}>
                        Clear All
                    </button>
                )}
            </div>

            <div className="filter-section">
                <div className="filter-section-title">Priority</div>
                {['high', 'medium', 'low', 'None'].map(p => (
                    <label key={p} className={`filter-option ${filters.priority.includes(p) ? 'selected' : ''}`}>
                        <input
                            type="checkbox"
                            checked={filters.priority.includes(p)}
                            onChange={() => togglePriority(p)}
                        />
                        {p === 'None' ? 'None' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                ))}
            </div>

            <div className="filter-section">
                <div className="filter-section-title">Due Date</div>
                {['Overdue', 'Due Today', 'Due This Week', 'No Date'].map(d => (
                    <label key={d} className={`filter-option ${filters.dueDate.includes(d) ? 'selected' : ''}`}>
                        <input
                            type="checkbox"
                            checked={filters.dueDate.includes(d)}
                            onChange={() => toggleDueDate(d)}
                        />
                        {d}
                    </label>
                ))}
            </div>

            <div className="filter-section">
                <div className="filter-section-title">Labels</div>
                {activeLabels.map(label => (
                    <label key={label.id} className={`filter-option ${filters.labels.find(l => l.id === label.id) ? 'selected' : ''}`}>
                        <input
                            type="checkbox"
                            checked={!!filters.labels.find(l => l.id === label.id)}
                            onChange={() => toggleLabel(label)}
                        />
                        <span className="label-color-pip" style={{ backgroundColor: label.color }} />
                        {label.name}
                    </label>
                ))}
            </div>

            <div className="filter-section" style={{ marginBottom: 0 }}>
                <div className="filter-section-title">View</div>
                <label className={`filter-option ${filters.hideCompleted ? 'selected' : ''}`}>
                    <input
                        type="checkbox"
                        checked={filters.hideCompleted}
                        onChange={() => setFilters(f => ({ ...f, hideCompleted: !f.hideCompleted }))}
                    />
                    Hide Completed
                </label>
            </div>

            {onClose && (
                <div className="filter-close-row">
                    <button type="button" className="filter-close-btn" onClick={onClose}>
                        Done
                    </button>
                </div>
            )}
        </div>
    )
}
