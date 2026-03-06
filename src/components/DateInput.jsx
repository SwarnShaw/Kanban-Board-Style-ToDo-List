import React, { useState } from 'react'

export default function DateInput({ value, onChange, onValidation }) {
    const [message, setMessage] = useState({ state: 'empty', text: '' })

    function validate(val) {
        if (!val) {
            const r = { state: 'empty', text: '' }
            setMessage(r)
            if (onValidation) onValidation(r.state)
            return
        }
        const date = new Date(val + 'T00:00:00')
        if (isNaN(date.getTime())) {
            const r = { state: 'error', text: 'Please enter a valid date' }
            setMessage(r)
            if (onValidation) onValidation(r.state)
            return
        }
        const year = parseInt(val.split('-')[0])
        if (year < 2000) {
            const r = { state: 'error', text: 'Year must be 2000 or later' }
            setMessage(r)
            if (onValidation) onValidation(r.state)
            return
        }
        if (year > 2099) {
            const r = { state: 'error', text: 'Year must be 2099 or earlier' }
            setMessage(r)
            if (onValidation) onValidation(r.state)
            return
        }
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date < today) {
            const r = { state: 'warning', text: 'This date is in the past' }
            setMessage(r)
            if (onValidation) onValidation(r.state)
            return
        }
        const r = { state: 'valid', text: '' }
        setMessage(r)
        if (onValidation) onValidation(r.state)
    }

    const handleChange = (e) => {
        const val = e.target.value
        onChange(val)
        validate(val)
    }

    const handleBlur = () => {
        validate(value)
    }

    const inputClass = `date-input ${message.state === 'error' ? 'error' : message.state === 'warning' ? 'warning' : message.state === 'valid' ? 'valid' : ''}`

    return (
        <div className="date-input-wrapper">
            <input
                type="date"
                className={inputClass}
                value={value || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                min="2000-01-01"
                max="2099-12-31"
                aria-label="Due date"
            />
            {message.text && (
                <div className={`date-message ${message.state}`}>{message.text}</div>
            )}
        </div>
    )
}
