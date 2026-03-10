/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { FIXED_COLUMNS } from '../constants/columns'
import { isOverdue, isDueToday, getRelativeTime } from '../utils/formatDate'
import { X, Hash, Clock, Calendar, AlertCircle } from 'lucide-react'

function animateCountUp(element, targetValue, delay = 0) {
    if (!element) return

    setTimeout(() => {
        const duration = 1200
        const startTime = performance.now()
        const startVal = 0

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

        const update = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutCubic(progress)
            const current = Math.round(startVal + eased * targetValue)

            element.textContent = current

            if (progress < 1) {
                requestAnimationFrame(update)
            } else {
                element.textContent = targetValue
            }
        }

        requestAnimationFrame(update)
    }, delay)
}

function animateBar(barElement, targetPercent, delay = 0) {
    if (!barElement) return

    barElement.classList.add('animating')

    setTimeout(() => {
        const duration = 900
        const startTime = performance.now()
        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)

        const update = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutQuart(progress)
            const current = eased * targetPercent

            barElement.style.width = `${current.toFixed(1)}%`

            if (progress < 1) {
                requestAnimationFrame(update)
            } else {
                barElement.style.width = `${targetPercent}%`
                barElement.classList.remove('animating')
            }
        }

        requestAnimationFrame(update)
    }, delay)
}

export default function Analytics({ isOpen, onClose }) {
    const { activeTasks, activeBoard } = useBoardContext()
    const [animKey, setAnimKey] = useState(0)

    const totalRef = useRef(null)
    const overdueRef = useRef(null)
    const todayRef = useRef(null)
    const nodateRef = useRef(null)

    const barRefs = useRef([])
    const priorityBarRefs = useRef([])

    const stats = useMemo(() => {
        const total = activeTasks.length
        const overdue = activeTasks.filter(t => isOverdue(t.dueDate)).length
        const dueToday = activeTasks.filter(t => isDueToday(t.dueDate)).length
        const noDate = activeTasks.filter(t => !t.dueDate).length
        return { total, overdue, dueToday, noDate }
    }, [activeTasks])

    const columnCounts = useMemo(() => {
        const counts = FIXED_COLUMNS.map(col => ({
            ...col,
            count: activeTasks.filter(t => t.columnId === col.id).length
        }))
        const max = Math.max(...counts.map(c => c.count), 1)
        return counts.map(c => ({ ...c, pct: (c.count / max) * 100 }))
    }, [activeTasks])

    const priorityCounts = useMemo(() => {
        const high = activeTasks.filter(t => t.priority === 'high').length
        const medium = activeTasks.filter(t => t.priority === 'medium').length
        const low = activeTasks.filter(t => t.priority === 'low').length
        const max = Math.max(high, medium, low, 1)
        return [
            { id: 'high', label: 'High', count: high, pct: (high / max) * 100, color: 'var(--priority-high)' },
            { id: 'medium', label: 'Medium', count: medium, pct: (medium / max) * 100, color: 'var(--priority-medium)' },
            { id: 'low', label: 'Low', count: low, pct: (low / max) * 100, color: 'var(--priority-low)' }
        ]
    }, [activeTasks])

    const wipStatus = useMemo(() => {
        return FIXED_COLUMNS
            .map(col => {
                const limit = activeBoard?.wipLimits?.[col.id] ?? col.wipLimit
                if (limit === null || limit === undefined) return null
                const count = activeTasks.filter(t => t.columnId === col.id).length
                const status = count > limit ? 'over-limit' : count === limit ? 'at-limit' : 'under'
                return { title: col.title, count, limit, status }
            })
            .filter(Boolean)
    }, [activeTasks, activeBoard])

    const activity = (activeBoard?.activity || []).slice(0, 10)

    const formatActivity = (entry) => {
        if (entry.type === 'created') return `Task "${entry.taskTitle}" added to ${entry.toColumn}`
        if (entry.type === 'moved') return `Task "${entry.taskTitle}" moved to ${entry.toColumn}`
        if (entry.type === 'deleted') return `Task "${entry.taskTitle}" deleted`
        return ''
    }

    // Key increment for re-mount animations
    useEffect(() => {
        if (isOpen) {
            setAnimKey(prev => prev + 1)
        } else {
            // Reset widths
            barRefs.current.forEach(ref => {
                if (ref) ref.style.width = '0%'
            })
            priorityBarRefs.current.forEach(ref => {
                if (ref) ref.style.width = '0%'
            })
        }
    }, [isOpen])

    // Mount animations
    useEffect(() => {
        if (!isOpen) return

        const timeout = setTimeout(() => {
            // Stat Cards - countUp
            animateCountUp(totalRef.current, stats.total, 0)
            animateCountUp(overdueRef.current, stats.overdue, 150)
            animateCountUp(todayRef.current, stats.dueToday, 300)
            animateCountUp(nodateRef.current, stats.noDate, 450)

            // Bar Charts
            barRefs.current.forEach((ref, index) => {
                if (!ref) return
                animateBar(ref, columnCounts[index].pct, index * 120)
            })

            // Priority Bars - 100ms stagger over 800ms
            priorityBarRefs.current.forEach((ref, index) => {
                if (!ref) return
                animateBar(ref, priorityCounts[index].pct, index * 100)
            })

        }, 450)

        return () => clearTimeout(timeout)
    }, [isOpen, animKey, stats, columnCounts, priorityCounts])

    return (
        <div key={animKey}>
            <div className={`analytics-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`analytics-panel ${isOpen ? 'open' : ''}`}>
                <div className="analytics-header">
                    <h2>Analytics</h2>
                    <button className="analytics-close" onClick={onClose} aria-label="Close analytics">
                        <X size={16} />
                    </button>
                </div>
                <div className="analytics-body">

                    {/* STAT CARDS */}
                    <div className="stat-grid">
                        {[
                            { n: stats.total, l: 'Total Tasks', icon: <Hash size={14} />, ref: totalRef },
                            { n: stats.overdue, l: 'Overdue', icon: <AlertCircle size={14} />, ref: overdueRef },
                            { n: stats.dueToday, l: 'Due Today', icon: <Clock size={14} />, ref: todayRef },
                            { n: stats.noDate, l: 'No Due Date', icon: <Calendar size={14} />, ref: nodateRef }
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-header">
                                    <span className="stat-icon">{s.icon}</span>
                                    {s.l}
                                </div>
                                <div className="stat-number" ref={s.ref}>0</div>
                            </div>
                        ))}
                    </div>

                    {/* BAR CHARTS */}
                    <div className="analytics-section">
                        <div className="analytics-section-title">Tasks by Column</div>
                        {columnCounts.map((col, idx) => (
                            <div key={col.id} className="chart-row">
                                <span className="chart-row-label">{col.title}</span>
                                <div className="chart-bar-track">
                                    <div
                                        className="chart-bar-fill"
                                        ref={el => barRefs.current[idx] = el}
                                        style={{ width: '0%' }}
                                    />
                                </div>
                                <span className="chart-row-count">{col.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* PRIORITY CHARTS */}
                    <div className="analytics-section">
                        <div className="analytics-section-title">Tasks by Priority</div>
                        {priorityCounts.map((p, idx) => (
                            <div key={p.id} className="priority-bar-row">
                                <div className="priority-bar-label">
                                    <div className="priority-bar-dot" style={{ background: p.color }} />
                                    <span className="priority-bar-name">{p.label}</span>
                                </div>
                                <div className="priority-bar-track">
                                    <div
                                        className="priority-bar-fill"
                                        data-priority={p.id}
                                        ref={el => priorityBarRefs.current[idx] = el}
                                        style={{ width: '0%' }}
                                    />
                                </div>
                                <span className="priority-bar-count">{p.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* WIP LIMITS */}
                    {wipStatus.length > 0 && (
                        <div className="analytics-section">
                            <div className="analytics-section-title">WIP Status</div>
                            {wipStatus.map((w, i) => (
                                <div key={i} className="wip-row">
                                    <span className="wip-row-label">{w.title}</span>
                                    <span className={`wip-row-status ${w.status}`}>
                                        {w.count}/{w.limit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ACTIVITY */}
                    <div className="analytics-section" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="analytics-section-title">Activity Log</div>
                        {activity.length === 0 ? (
                            <div className="analytics-activity-empty">
                                <span className="analytics-empty-icon">📋</span>
                                <span className="analytics-empty-text">
                                    No activity yet.
                                    <br />
                                    <span className="analytics-empty-sub">Move tasks between columns to see your history here.</span>
                                </span>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {activity.map(entry => (
                                    <div key={entry.id} className="activity-entry">
                                        <div className="activity-dot" />
                                        <div className="activity-text">
                                            {formatActivity(entry)}
                                        </div>
                                        <div className="activity-time">{getRelativeTime(entry.timestamp)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
