export function sortTasks(tasks) {
    const priorityOrder = { high: 1, medium: 2, low: 3 }
    return [...tasks].sort((a, b) => {
        const pa = priorityOrder[a.priority] || 4
        const pb = priorityOrder[b.priority] || 4
        if (pa !== pb) return pa - pb
        return new Date(b.createdAt) - new Date(a.createdAt)
    })
}
