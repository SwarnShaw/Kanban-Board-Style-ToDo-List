import React, { useState, useRef } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { attachmentId as genAttachmentId } from '../utils/idGenerators'
import { formatSize } from '../utils/formatSize'

function getFileIcon(type) {
    if (!type) return '📎'
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.startsWith('video/')) return '🎬'
    if (type.startsWith('audio/')) return '🎵'
    if (type.startsWith('text/')) return '📝'
    if (type.includes('zip') || type.includes('compressed') || type.includes('archive')) return '🗜️'
    if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📑'
    return '📎'
}

function isViewable(type) {
    if (!type) return false
    return type.startsWith('image/') || type === 'application/pdf' || type.startsWith('text/')
}

export default function Attachments({ taskId, onViewFile }) {
    const { activeTasks, dispatch } = useBoardContext()
    const liveTask = activeTasks.find(t => t.id === taskId)
    const attachments = liveTask?.attachments || []

    const [isDragging, setIsDragging] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [storageWarning, setStorageWarning] = useState(false)
    const fileInputRef = useRef(null)

    function checkStorageWarning() {
        try {
            const used = new Blob([localStorage.getItem('todo_app_v1') || '']).size
            if (used > 4 * 1024 * 1024) setStorageWarning(true)
        } catch { }
    }

    const handleFileSelect = (files) => {
        setUploadError('')
        Array.from(files).forEach(file => {
            if (file.size > 2 * 1024 * 1024) {
                setUploadError(`"${file.name}" exceeds 2MB limit`)
                return
            }
            const tempId = genAttachmentId()
            dispatch({
                type: 'ADD_ATTACHMENT_UPLOADING',
                payload: {
                    taskId,
                    attachment: {
                        id: tempId, name: file.name, size: file.size,
                        type: file.type, dataUrl: null, status: 'uploading'
                    }
                }
            })
            const reader = new FileReader()
            reader.onload = (e) => {
                dispatch({
                    type: 'COMPLETE_ATTACHMENT',
                    payload: { taskId, tempId, dataUrl: e.target.result, status: 'done' }
                })
                checkStorageWarning()
            }
            reader.onerror = () => {
                dispatch({
                    type: 'COMPLETE_ATTACHMENT',
                    payload: { taskId, tempId, dataUrl: null, status: 'error' }
                })
            }
            reader.readAsDataURL(file)
        })
    }

    const handleDownload = (att) => {
        const a = document.createElement('a')
        a.href = att.dataUrl
        a.download = att.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <div>
            <span className="field-label">Attachments</span>

            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files) }}
            >
                <div className="drop-zone-text">Drop files here or click to upload</div>
                <div className="drop-zone-hint">Max 2MB per file</div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => { handleFileSelect(e.target.files); e.target.value = '' }}
                />
            </div>

            {uploadError && <div className="upload-error-msg">{uploadError}</div>}

            {storageWarning && (
                <div className="storage-warning">
                    ⚠ localStorage usage exceeds 4MB. Some uploads may fail.
                    <button onClick={() => setStorageWarning(false)}>×</button>
                </div>
            )}

            {attachments.length > 0 && (
                <div className="attachment-list">
                    {attachments.map(att => (
                        <div key={att.id} className={`attachment-row ${att.status === 'error' ? 'error-row' : ''}`}>
                            {att.status === 'uploading' ? (
                                <>
                                    <span className="upload-spinner" />
                                    <div className="attachment-info">
                                        <div className="attachment-name">{att.name.slice(0, 30)}</div>
                                        <div className="attachment-status">Uploading…</div>
                                    </div>
                                </>
                            ) : att.status === 'error' ? (
                                <>
                                    <span className="attachment-icon">❌</span>
                                    <div className="attachment-info">
                                        <div className="attachment-name">{att.name.slice(0, 30)}</div>
                                        <div className="attachment-error-text">Upload failed</div>
                                    </div>
                                    <button
                                        className="attachment-delete"
                                        style={{ opacity: 1 }}
                                        onClick={() => dispatch({ type: 'DELETE_ATTACHMENT', payload: { taskId, attachmentId: att.id } })}
                                    >×</button>
                                </>
                            ) : (
                                <>
                                    <span className="attachment-icon">{getFileIcon(att.type)}</span>
                                    <div className="attachment-info">
                                        <div className="attachment-name">{att.name.slice(0, 30)}</div>
                                        <div className="attachment-size">{formatSize(att.size)}</div>
                                    </div>
                                    <div className="attachment-actions">
                                        {isViewable(att.type) && (
                                            <button onClick={() => onViewFile(att)}>👁 View</button>
                                        )}
                                        <button onClick={() => handleDownload(att)}>⬇ Download</button>
                                    </div>
                                    <button
                                        className="attachment-delete"
                                        onClick={() => dispatch({ type: 'DELETE_ATTACHMENT', payload: { taskId, attachmentId: att.id } })}
                                        aria-label="Delete attachment"
                                    >×</button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
