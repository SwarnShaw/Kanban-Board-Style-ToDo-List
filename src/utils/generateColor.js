const COLORS = [
    "#7c6af7", "#ff2a6d", "#05d9e8",
    "#00ff9f", "#f7e733", "#f472b6"
]

export function nameToColor(name) {
    if (!name) return COLORS[0]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return COLORS[Math.abs(hash) % COLORS.length]
}
