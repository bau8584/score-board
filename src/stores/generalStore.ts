import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Team } from './settingsStore'

interface GeneralState {
  scores: { a: number; b: number }
  inc: (team: Team) => void
  dec: (team: Team) => void
  reset: () => void
}

export const useGeneralStore = create<GeneralState>()(
  persist(
    (set) => ({
      scores: { a: 0, b: 0 },
      inc: (team) =>
        set((s) => ({ scores: { ...s.scores, [team]: s.scores[team] + 1 } })),
      dec: (team) =>
        set((s) => ({
          scores: { ...s.scores, [team]: Math.max(0, s.scores[team] - 1) },
        })),
      reset: () => set({ scores: { a: 0, b: 0 } }),
    }),
    { name: 'general-store' }
  )
)
