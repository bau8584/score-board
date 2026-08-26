import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurlTeam = 'a' | 'b'

/** 한 엔드의 결과: 득점 팀과 점수(blank end는 team=null, n=0) */
export interface EndResult {
  team: CurlTeam | null
  n: number
  hammer: CurlTeam // 이 엔드의 해머(되돌리기 복원용)
}

interface CurlingState {
  ends: EndResult[] // 종료된 엔드 기록
  hammer: CurlTeam // 현재 엔드 해머(후공)
  /** 엔드 확정: 득점 팀 + 점수. 실점 팀이 다음 엔드 해머를 가져감 */
  score: (team: CurlTeam, n: number) => void
  /** 무득점 엔드(blank) — 해머 유지 */
  blank: () => void
  /** 마지막 엔드 취소 */
  undo: () => void
  reset: () => void
  setHammer: (team: CurlTeam) => void
}

/** 합계 (파생 계산 — 중복 저장하지 않음) */
export function totals(ends: EndResult[]) {
  return ends.reduce(
    (acc, e) => {
      if (e.team) acc[e.team] += e.n
      return acc
    },
    { a: 0, b: 0 }
  )
}

const other = (t: CurlTeam): CurlTeam => (t === 'a' ? 'b' : 'a')

export const useCurlingStore = create<CurlingState>()(
  persist(
    (set) => ({
      ends: [],
      hammer: 'b',
      score: (team, n) =>
        set((s) => ({
          ends: [...s.ends, { team, n: Math.max(1, n), hammer: s.hammer }],
          // 득점당한 팀이 다음 엔드 해머
          hammer: other(team),
        })),
      blank: () =>
        set((s) => ({ ends: [...s.ends, { team: null, n: 0, hammer: s.hammer }] })),
      undo: () =>
        set((s) => {
          if (!s.ends.length) return s
          const last = s.ends[s.ends.length - 1]
          return { ends: s.ends.slice(0, -1), hammer: last.hammer }
        }),
      reset: () => set({ ends: [], hammer: 'b' }),
      setHammer: (team) => set({ hammer: team }),
    }),
    { name: 'curling-store' }
  )
)
