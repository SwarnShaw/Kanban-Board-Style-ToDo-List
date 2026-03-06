import React, { useState, useRef } from 'react'
import { useBoardContext } from '../context/BoardContext'
import { commentId as genCommentId } from '../utils/idGenerators'
import { formatTimestamp } from '../utils/formatDate'

export default function Comments({ taskId }) {
    const { activeTasks, dispatch } = useBoardContext()
    const liveTask = activeTasks.find(t => t.id === taskId)
    const comments = liveTask?.comments || []

    const [input, setInput] = useState('')
    const [posted, setPosted] = useState(false)
    const listRef = useRef(null)

    const handlePost = () => {
        if (!input.trim()) return
        dispatch({
            type: 'ADD_COMMENT',
            payload: {
                taskId,
                comment: {
                    id: genCommentId(),
                    text: input.trim(),
                    createdAt: new Date().toISOString()
                }
            }
        })
        setInput('')
        setPosted(true)
        setTimeout(() => setPosted(false), 800)
        setTimeout(() => {
            if (listRef.current) listRef.current.scrollTop = 0
        }, 50)
    }

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handlePost()
        }
    }

    return (
        <div>
            <span className="field-label">Comments</span>
            <div className="comment-input-area">
                <textarea
                    className="modal-textarea"
                    placeholder="Add a comment…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ minHeight: 60 }}
                />
                <button
                    className={`comment-post-btn ${posted ? 'posted' : ''}`}
                    onClick={handlePost}
                    disabled={!input.trim() && !posted}
                >
                    {posted ? '✓ Posted' : 'Post'}
                </button>
            </div>
            {comments.length > 0 && (
                <div className="comment-list" ref={listRef}>
                    {comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-timestamp">{formatTimestamp(comment.createdAt)}</div>
                            <div className="comment-text">{comment.text}</div>
                            <button
                                className="comment-delete"
                                onClick={() => dispatch({ type: 'DELETE_COMMENT', payload: { taskId, commentId: comment.id } })}
                                aria-label="Delete comment"
                            >×</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
