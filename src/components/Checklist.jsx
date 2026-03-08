import React, { useRef } from 'react'
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBoardContext } from '../context/BoardContext'
import { checklistId as genChecklistId } from '../utils/idGenerators'
import { GripVertical, X, Plus } from 'lucide-react'

function ChecklistItem({ item, taskId }) {
    const { dispatch } = useBoardContext()
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
    const style = { transform: CSS.Transform.toString(transform), transition }

    return (
        <div ref={setNodeRef} style={style} className="checklist-item">
            <span className="checklist-drag-handle" {...attributes} {...listeners}>
                <GripVertical size={14} />
            </span>
            <input
                type="checkbox"
                className="checklist-checkbox"
                checked={item.isChecked}
                onChange={() => dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { taskId, itemId: item.id } })}
                aria-label={`Toggle ${item.text || 'checklist item'}`}
            />
            <input
                className={`checklist-text ${item.isChecked ? 'checked' : ''}`}
                value={item.text}
                onChange={e => dispatch({
                    type: 'UPDATE_CHECKLIST_TEXT',
                    payload: { taskId, itemId: item.id, text: e.target.value.slice(0, 100) }
                })}
                placeholder="Item text"
                maxLength={100}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        const newItem = {
                            id: genChecklistId(), text: '', isChecked: false,
                            order: (item.order || 0) + 1
                        }
                        dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { taskId, item: newItem } })
                        setTimeout(() => {
                            const inputs = e.target.closest('.checklist-section')?.querySelectorAll('.checklist-text')
                            if (inputs) inputs[inputs.length - 1]?.focus()
                        }, 50)
                    }
                }}
            />
            <button
                className="checklist-delete"
                onClick={() => dispatch({ type: 'DELETE_CHECKLIST_ITEM', payload: { taskId, itemId: item.id } })}
                aria-label="Delete checklist item"
            >
                <X size={14} />
            </button>
        </div>
    )
}

export default function Checklist({ taskId }) {
    const { activeTasks, dispatch } = useBoardContext()
    const liveTask = activeTasks.find(t => t.id === taskId)
    const items = (liveTask?.checklist || []).sort((a, b) => (a.order || 0) - (b.order || 0))

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    const checked = items.filter(i => i.isChecked).length
    const total = items.length
    const allChecked = total > 0 && checked === total

    const addItem = () => {
        const newItem = {
            id: genChecklistId(), text: '', isChecked: false, order: items.length
        }
        dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { taskId, item: newItem } })
    }

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return
        const oldIdx = items.findIndex(i => i.id === active.id)
        const newIdx = items.findIndex(i => i.id === over.id)
        const reordered = arrayMove(items, oldIdx, newIdx).map((item, idx) => ({ ...item, order: idx }))
        dispatch({ type: 'REORDER_CHECKLIST', payload: { taskId, orderedItems: reordered } })
    }

    return (
        <div className="checklist-section">
            <div className="checklist-header">
                <span className="field-label" style={{ margin: 0 }}>Checklist</span>
                <button className="add-checklist-btn" onClick={addItem} style={{ width: 'auto', padding: '4px 10px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add item
                </button>
            </div>

            {total > 0 && (
                <>
                    <div className="checklist-progress-text">{checked} of {total} items completed</div>
                    <div className="checklist-progress-bar">
                        <div
                            className={`checklist-progress-fill ${allChecked ? 'complete' : ''}`}
                            style={{ width: `${(checked / total) * 100}%` }}
                        />
                    </div>
                </>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map(item => (
                        <ChecklistItem key={item.id} item={item} taskId={taskId} />
                    ))}
                </SortableContext>
            </DndContext>

            {total === 0 && (
                <button className="add-checklist-btn" onClick={addItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add checklist item
                </button>
            )}
        </div>
    )
}
