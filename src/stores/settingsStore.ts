import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { autoTeamName } from '../lib/colors'

export type Team = 'a' | 'b'

interface TeamConfig {
  color: string
  customName: string
}

interface BaseballDisplay {
  showStrike: boolean
  showBall: boolean
  showOut: boolean
  showFoul: boolean
}

interface TimerConfig {
  enabled: boolean
  mode: 'up' | 'down'
  minutes: number
}

interface SettingsState {
  teamA: TeamConfig
  teamB: TeamConfig
  timer: TimerConfig
  baseball: BaseballDisplay
  setColor: (team: Team, color: string) => void
  setCustomName: (team: Team, name: string) => void
  setTimer: (patch: Partial<TimerConfig>) => void
  setBaseball: (patch: Partial<BaseballDisplay>) => void
  baseballPreset: (preset: 'baseball' | 'kickball') => void
  /** customName 우선, 없으면 색상 기반 자동명 */
  teamName: (team: Team) => string
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      teamA: { color: '빨강', customName: '' },
      teamB: { color: '파랑', customName: '' },
      timer: { enabled: false, mode: 'up', minutes: 10 },
      baseball: { showStrike: true, showBall: true, showOut: true, showFoul: true },

      setColor: (team, color) =>
        set((s) => ({
          [team === 'a' ? 'teamA' : 'teamB']: {
            ...(team === 'a' ? s.teamA : s.teamB),
            color,
          },
        })),

      setCustomName: (team, name) =>
        set((s) => ({
          [team === 'a' ? 'teamA' : 'teamB']: {
            ...(team === 'a' ? s.teamA : s.teamB),
            customName: name,
          },
        })),

      setTimer: (patch) => set((s) => ({ timer: { ...s.timer, ...patch } })),

      setBaseball: (patch) => set((s) => ({ baseball: { ...s.baseball, ...patch } })),

      baseballPreset: (preset) =>
        set(() => ({
          baseball:
            preset === 'baseball'
              ? { showStrike: true, showBall: true, showOut: true, showFoul: true }
              : { showStrike: false, showBall: false, showOut: true, showFoul: false },
        })),

      teamName: (team) => {
        const t = team === 'a' ? get().teamA : get().teamB
        return t.customName.trim() ? t.customName.trim() : autoTeamName(t.color)
      },
    }),
    { name: 'settings-store' }
  )
)
