import React, { useState, useEffect, useMemo } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { isOverdue, isDueToday } from '../utils/formatDate'
import { AlertTriangle, X } from 'lucide-react'

export default function ReminderBanner({ setFilters, hasActiveFilters, onVisibilityChange }) {
    const { activeTasks } = useBoardContext()
    const [dismissed, setDismissed] = useState(false)
    const [, setTick] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000)
        return () => clearInterval(interval)
    }, [])

    const overdue = useMemo(() => activeTasks.filter(t => isOverdue(t.dueDate)), [activeTasks])
    const dueToday = useMemo(() => activeTasks.filter(t => isDueToday(t.dueDate)), [activeTasks])

    const isVisible = !dismissed && (overdue.length > 0 || dueToday.length > 0)

    useEffect(() => {
        if (onVisibilityChange) onVisibilityChange(isVisible)
    }, [isVisible, onVisibilityChange])

    if (!isVisible) return null

    const bannerTop = 56 + (hasActiveFilters ? 36 : 0)

    const handleClick = () => {
        const newFilters = { priority: [], labels: [], hideCompleted: false, dueDate: [] }
        if (overdue.length > 0) newFilters.dueDate.push('Overdue')
        if (dueToday.length > 0) newFilters.dueDate.push('Due Today')
        setFilters(newFilters)
    }

    const parts = []
    if (overdue.length > 0) parts.push(`${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue`)
    if (dueToday.length > 0) parts.push(`${dueToday.length} due today`)

    return (
        <div className="reminder-banner" style={{ top: bannerTop }}>
            <span onClick={handleClick} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> {parts.join(' · ')}
            </span>
            <button onClick={() => setDismissed(true)} aria-label="Dismiss reminder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
            </button>
        </div>
    )
}
