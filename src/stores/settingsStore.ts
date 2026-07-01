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
  mode: 'up' | 'down' | 'clock'
  minutes: number
  seconds: number
}

interface KinballConfig {
  target: number // 점수제 목표 점수
  timeMinutes: number // 시간제 제한 시간(분)
  timeSeconds: number // 시간제 제한 시간(초)
  setsToWin: number // 세트제 선승 세트 수
  sound: boolean // 시간제 카운트다운 알림음
}

export type Theme = 'dark' | 'light'

interface SettingsState {
  teamA: TeamConfig
  teamB: TeamConfig
  timer: TimerConfig
  baseball: BaseballDisplay
  kinball: KinballConfig
  theme: Theme
  /** 일반 점수판 세트 카운터 표시 */
  setCounter: boolean
  setColor: (team: Team, color: string) => void
  setCustomName: (team: Team, name: string) => void
  setTimer: (patch: Partial<TimerConfig>) => void
  setBaseball: (patch: Partial<BaseballDisplay>) => void
  baseballPreset: (preset: 'baseball' | 'kickball') => void
  setKinball: (patch: Partial<KinballConfig>) => void
  setTheme: (theme: Theme) => void
  setSetCounter: (v: boolean) => void
  /** customName 우선, 없으면 색상 기반 자동명 */
  teamName: (team: Team) => string
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      teamA: { color: '빨강', customName: '' },
      teamB: { color: '파랑', customName: '' },
      timer: { enabled: false, mode: 'up', minutes: 10, seconds: 0 },
      baseball: { showStrike: true, showBall: true, showOut: true, showFoul: true },
      kinball: {
        target: 13,
        timeMinutes: 7,
        timeSeconds: 0,
        setsToWin: 3,
        sound: true,
      },
      theme: 'dark',
      setCounter: false,

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

      setKinball: (patch) => set((s) => ({ kinball: { ...s.kinball, ...patch } })),

      setTheme: (theme) => set({ theme }),

      setSetCounter: (v) => set({ setCounter: v }),

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
