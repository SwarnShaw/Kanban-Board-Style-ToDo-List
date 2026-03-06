import React from 'react'
import { useBoardContext } from '../context/BoardContext'

export default function FilterDropdown({ filters, setFilters }) {
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

    return (
        <div className="filter-dropdown" onClick={e => e.stopPropagation()}>
            <div className="filter-section">
                <div className="filter-section-title">Priority</div>
                {['high', 'medium', 'low', 'None'].map(p => (
                    <label key={p} className="filter-option">
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
                    <label key={d} className="filter-option">
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
                    <label key={label.id} className="filter-option">
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
                <label className="filter-option">
                    <input
                        type="checkbox"
                        checked={filters.hideCompleted}
                        onChange={() => setFilters(f => ({ ...f, hideCompleted: !f.hideCompleted }))}
                    />
                    Hide Completed
                </label>
            </div>
        </div>
    )
}
