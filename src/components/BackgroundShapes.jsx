import React, { useEffect, useRef, useState } from 'react'

const SHAPE_TYPES = ['circle', 'square', 'triangle']

export default function BackgroundShapes() {
    const shapesRef = useRef([])
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const requestRef = useRef()

    const [shapesData] = useState(() => {
        const count = Math.floor(Math.random() * 7) + 12 // 12-18 shapes
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
            size: Math.floor(Math.random() * 36) + 20, // 20px - 55px
            left: Math.random() * 100, // 0 - 100%
            top: Math.random() * 100, // 0 - 100%
            opacity: (Math.random() * 0.07 + 0.08).toFixed(2), // 0.08 - 0.15
            duration: Math.floor(Math.random() * 9) + 6, // 6s - 14s
            delay: Math.random() * 5, // 0 - 5s
            rotation: Math.random() * 360
        }))
    })

    useEffect(() => {
        const physics = shapesData.map(() => ({
            currentX: 0,
            currentY: 0,
            targetX: 0,
            targetY: 0
        }))

        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX
            mouseRef.current.y = e.clientY
        }

        const handleMouseLeave = () => {
            mouseRef.current.x = -1000
            mouseRef.current.y = -1000
        }

        window.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        const animate = () => {
            const mx = mouseRef.current.x
            const my = mouseRef.current.y

            shapesRef.current.forEach((el, index) => {
                if (!el) return

                // For performance, we could cache rects, but they float so rects change slowly.
                // We'll calculate distance directly based on bounding client rect representing current screen pos.
                const rect = el.getBoundingClientRect()
                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2

                const dx = cx - mx
                const dy = cy - my
                const dist = Math.sqrt(dx * dx + dy * dy)

                const phys = physics[index]

                if (dist < 120 && mx > -500) {
                    const force = (120 - dist) / 120 // 0 to 1
                    const nx = dx / (dist || 1)
                    const ny = dy / (dist || 1)

                    phys.targetX = nx * force * 50 // Push outward by max 50px
                    phys.targetY = ny * force * 50
                } else {
                    phys.targetX = 0
                    phys.targetY = 0
                }

                // Smooth ease
                phys.currentX += (phys.targetX - phys.currentX) * 0.08
                phys.currentY += (phys.targetY - phys.currentY) * 0.08

                el.style.transform = `translate3d(${phys.currentX}px, ${phys.currentY}px, 0)`
            })

            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseleave', handleMouseLeave)
            cancelAnimationFrame(requestRef.current)
        }
    }, [shapesData])

    return (
        <div className="bg-shapes-container">
            {shapesData.map((s, i) => (
                <div
                    key={s.id}
                    className="bg-shape-wrapper"
                    style={{ left: `${s.left}%`, top: `${s.top}%`, opacity: s.opacity }}
                >
                    <div className="bg-shape-physics" ref={el => shapesRef.current[i] = el}>
                        <div
                            className="bg-shape-anim"
                            style={{
                                animationDuration: `${s.duration}s`,
                                animationDelay: `${s.delay}s`
                            }}
                        >
                            <Shape type={s.type} size={s.size} rotation={s.rotation} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

const Shape = ({ type, size, rotation }) => {
    const style = { width: size, height: size, transform: `rotate(${rotation}deg)` }

    if (type === 'circle') {
        return (
            <svg style={style} viewBox="0 0 100 100" className="hollow-shape">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" />
            </svg>
        )
    } else if (type === 'square') {
        return (
            <svg style={style} viewBox="0 0 100 100" className="hollow-shape">
                <rect x="4" y="4" width="92" height="92" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
            </svg>
        )
    } else {
        return (
            <svg style={style} viewBox="0 0 100 100" className="hollow-shape">
                <polygon points="50,4 96,92 4,92" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
            </svg>
        )
    }
}
