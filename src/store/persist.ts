import { useSyncExternalStore } from 'react'

export interface Persisted<T> {
  get: () => T
  set: (v: T | ((prev: T) => T)) => void
  subscribe: (fn: () => void) => () => void
  reset: () => void
}

/** Pequeño store reactivo guardado en localStorage (hace de "base de datos" del mockup). */
export function createStore<T>(key: string, initial: () => T): Persisted<T> {
  const read = (): T => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial()
    } catch {
      return initial()
    }
  }
  let value = read()
  const subs = new Set<() => void>()
  const emit = () => subs.forEach((f) => f())

  const api: Persisted<T> = {
    get: () => value,
    set: (v) => {
      value = typeof v === 'function' ? (v as (p: T) => T)(value) : v
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        /* sin storage */
      }
      emit()
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => {
        subs.delete(fn)
      }
    },
    reset: () => api.set(initial()),
  }

  // Sincroniza con otras pestañas
  if (typeof window !== 'undefined')
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      value = e.newValue ? (JSON.parse(e.newValue) as T) : initial()
      emit()
    })

  return api
}

export const useStoreValue = <T,>(s: Persisted<T>): T => useSyncExternalStore(s.subscribe, s.get)
