import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Team } from './settingsStore'

interface GeneralState {
  scores: { a: number; b: number }
  sets: { a: number; b: number }
  inc: (team: Team) => void
  dec: (team: Team) => void
  incSet: (team: Team) => void
  decSet: (team: Team) => void
  resetSets: () => void
  reset: () => void
}

export const useGeneralStore = create<GeneralState>()(
  persist(
    (set) => ({
      scores: { a: 0, b: 0 },
      sets: { a: 0, b: 0 },
      inc: (team) =>
        set((s) => ({ scores: { ...s.scores, [team]: s.scores[team] + 1 } })),
      dec: (team) =>
        set((s) => ({
          scores: { ...s.scores, [team]: Math.max(0, s.scores[team] - 1) },
        })),
      incSet: (team) =>
        set((s) => ({ sets: { ...s.sets, [team]: s.sets[team] + 1 } })),
      decSet: (team) =>
        set((s) => ({
          sets: { ...s.sets, [team]: Math.max(0, s.sets[team] - 1) },
        })),
      resetSets: () => set({ sets: { a: 0, b: 0 } }),
      reset: () => set({ scores: { a: 0, b: 0 } }),
    }),
    { name: 'general-store' }
  )
)
