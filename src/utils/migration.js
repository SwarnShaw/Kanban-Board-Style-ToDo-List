import { DEFAULT_LABELS } from '../constants/defaultLabels'

export function migrate(raw) {
    if (!raw) return freshState()

    let data
    try {
        data = JSON.parse(raw)
    } catch {
        return freshState()
    }

    if (!data.boards) {
        const id = 'board_' + Date.now()
        return {
            boards: [{
                id,
                name: 'My Board',
                tasks: patchTasks(data.tasks || []),
                labels: data.labels || DEFAULT_LABELS.map(l => ({ ...l })),
                activity: [],
                wipLimits: {}
            }],
            activeBoardId: id,
            theme: data.theme || 'dark'
        }
    }

    return {
        ...data,
        boards: data.boards.map(board => ({
            ...board,
            tasks: patchTasks(board.tasks || []),
            activity: board.activity || [],
            labels: board.labels || DEFAULT_LABELS.map(l => ({ ...l })),
            wipLimits: board.wipLimits || {}
        }))
    }
}

function patchTasks(tasks) {
    return tasks.map(t => ({
        ...t,
        assignee: t.assignee ?? null,
        labelIds: t.labelIds ?? [],
        checklist: t.checklist ?? [],
        comments: t.comments ?? [],
        attachments: t.attachments ?? []
    }))
}

function freshState() {
    const id = 'board_' + Date.now()
    return {
        boards: [{
            id,
            name: 'My Board',
            tasks: [],
            labels: DEFAULT_LABELS.map(l => ({ ...l })),
            activity: [],
            wipLimits: {}
        }],
        activeBoardId: id,
        theme: 'dark'
    }
}
