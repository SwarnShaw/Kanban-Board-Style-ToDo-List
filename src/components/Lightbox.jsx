import React, { useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function Lightbox({ attachment, onClose }) {
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onClose])

    const handleDownload = () => {
        const a = document.createElement('a')
        a.href = attachment.dataUrl
        a.download = attachment.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    let content = null
    const type = attachment.type || ''

    if (type.startsWith('image/')) {
        content = <img src={attachment.dataUrl} alt={attachment.name} />
    } else if (type === 'application/pdf') {
        content = <iframe src={attachment.dataUrl} title={attachment.name} />
    } else if (type.startsWith('text/')) {
        let text = ''
        try {
            text = atob(attachment.dataUrl.split(',')[1])
        } catch { text = 'Unable to decode file' }
        content = <pre>{text}</pre>
    }

    return (
        <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={`Viewing ${attachment.name}`}>
            <div className="lightbox-top-bar">
                <span className="lightbox-filename">{attachment.name}</span>
                <div className="lightbox-actions">
                    <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={14} /> Download
                    </button>
                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <X size={14} /> Close
                    </button>
                </div>
            </div>
            <div className="lightbox-content" onClick={handleOverlayClick}>
                {content}
            </div>
        </div>
    )
}
