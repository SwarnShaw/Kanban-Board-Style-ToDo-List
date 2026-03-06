import { useEffect, useRef } from 'react'

const STORAGE_KEY = 'todo_app_v1'

export function useLocalStorage(state) {
    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, [state])
}

export function readLocalStorage() {
    return localStorage.getItem(STORAGE_KEY)
}
