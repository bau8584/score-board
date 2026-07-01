import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type KinTeam = 'pink' | 'gray' | 'black'

export const KIN_TEAMS: { key: KinTeam; label: string; color: string }[] = [
  { key: 'pink', label: '핑크', color: '#ec407a' },
  { key: 'gray', label: '그레이', color: '#9e9e9e' },
  { key: 'black', label: '블랙', color: '#1c1c22' },
]

export type KinMode = 'score' | 'time'

interface KinballState {
  scores: Record<KinTeam, number> // 현재 세트 점수
  setsWon: Record<KinTeam, number> // 획득 세트 수
  gameMode: KinMode // 세트 승리 방식(점수제/시간제)
  inc: (team: KinTeam) => void
  dec: (team: KinTeam) => void
  /** 파울: 해당 팀이 실패 → 나머지 두 팀 +1 (킨볼 규칙) */
  foul: (team: KinTeam) => void
  /** 세트 획득: 승팀 세트 +1, 현재 세트 점수 리셋 */
  awardSet: (team: KinTeam) => void
  /** 현재 세트만 리셋(점수 0) */
  resetRound: () => void
  /** 경기 전체 리셋(점수·세트 0) */
  resetMatch: () => void
  setGameMode: (m: KinMode) => void
}

const zero = (): Record<KinTeam, number> => ({ pink: 0, gray: 0, black: 0 })

export const useKinballStore = create<KinballState>()(
  persist(
    (set) => ({
      scores: zero(),
      setsWon: zero(),
      gameMode: 'score',
      inc: (team) =>
        set((s) => ({ scores: { ...s.scores, [team]: s.scores[team] + 1 } })),
      dec: (team) =>
        set((s) => ({
          scores: { ...s.scores, [team]: Math.max(0, s.scores[team] - 1) },
        })),
      foul: (team) =>
        set((s) => {
          const next = { ...s.scores }
          KIN_TEAMS.forEach(({ key }) => {
            if (key !== team) next[key] = next[key] + 1
          })
          return { scores: next }
        }),
      awardSet: (team) =>
        set((s) => ({
          setsWon: { ...s.setsWon, [team]: s.setsWon[team] + 1 },
          scores: zero(),
        })),
      resetRound: () => set({ scores: zero() }),
      resetMatch: () => set({ scores: zero(), setsWon: zero() }),
      setGameMode: (m) => set({ gameMode: m }),
    }),
    { name: 'kinball-store' }
  )
)
