import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Team } from './settingsStore'

export interface HalfRecord {
  inn: number
  top: boolean
  ra: number // 해당 이닝(초/말) A팀 득점
  rb: number // 해당 이닝(초/말) B팀 득점
}

export interface EventLog {
  label: string // 예: "3회 초"
  teamName: string
  event: string // 예: "2 득점"
}

interface Count {
  s: number // 스트라이크
  o: number // 아웃
  b: number // 볼
  f: number // 파울
}

const emptyCount = (): Count => ({ s: 0, o: 0, b: 0, f: 0 })

interface BaseballState {
  phase: 'idle' | 'playing'
  firstAttacker: Team // 1회 초에 공격하는 팀
  cur: { inn: number; top: boolean }
  scores: { a: number; b: number } // 누적 총 득점
  halfStart: { a: number; b: number } // 현재 이닝(초/말) 시작 시점 스냅샷
  halves: HalfRecord[]
  so: Count
  eventLog: EventLog[]

  start: (first: Team) => void
  inc: (team: Team) => void
  dec: (team: Team) => void
  switchHalf: (labelOf: (inn: number, top: boolean) => string, nameOf: (t: Team) => string) => void
  /** 기록표에서 특정 팀의 inn회 득점을 직접 수정 (총점·스냅샷 자동 보정) */
  editHalf: (team: Team, inn: number, value: number) => void
  toggleCount: (key: keyof Count) => void
  setCount: (key: keyof Count, value: number) => void
  /** 카운트 1 증가. 스트라이크 3=아웃, 볼 4=볼넷(출루), 파울=스트라이크 동반. 결과 종류 반환 */
  tickCount: (key: keyof Count) => 'fill' | 'out' | 'walk' | 'reset'
  reset: () => void
}

const other = (t: Team): Team => (t === 'a' ? 'b' : 'a')

/** 현재 이닝(초/말)의 공격 팀: 초=선공팀, 말=후공팀 */
export function attacker(top: boolean, first: Team): Team {
  return top ? first : other(first)
}

export function halfLabel(inn: number, top: boolean): string {
  return `${inn}회 ${top ? '초' : '말'}`
}

export const useBaseballStore = create<BaseballState>()(
  persist(
    (set) => ({
      phase: 'idle',
      firstAttacker: 'a',
      cur: { inn: 1, top: true },
      scores: { a: 0, b: 0 },
      halfStart: { a: 0, b: 0 },
      halves: [],
      so: emptyCount(),
      eventLog: [],

      start: (first) =>
        set({
          phase: 'playing',
          firstAttacker: first,
          cur: { inn: 1, top: true },
          scores: { a: 0, b: 0 },
          halfStart: { a: 0, b: 0 },
          halves: [],
          so: emptyCount(),
          eventLog: [],
        }),

      inc: (team) =>
        set((s) => {
          if (s.phase !== 'playing') return s
          // 공격 팀만 득점 가능
          if (team !== attacker(s.cur.top, s.firstAttacker)) return s
          return { scores: { ...s.scores, [team]: s.scores[team] + 1 } }
        }),

      dec: (team) =>
        set((s) => {
          if (s.phase !== 'playing') return s
          if (team !== attacker(s.cur.top, s.firstAttacker)) return s
          // 현재 이닝 시작점 아래로는 못 내려감 (이전 이닝 기록 보호)
          const floor = s.halfStart[team]
          return {
            scores: { ...s.scores, [team]: Math.max(floor, s.scores[team] - 1) },
          }
        }),

      switchHalf: (labelOf, nameOf) =>
        set((s) => {
          const atk = attacker(s.cur.top, s.firstAttacker)
          const delta = s.scores[atk] - s.halfStart[atk]
          const record: HalfRecord = {
            inn: s.cur.inn,
            top: s.cur.top,
            ra: atk === 'a' ? delta : 0,
            rb: atk === 'b' ? delta : 0,
          }
          const nextCur = s.cur.top
            ? { inn: s.cur.inn, top: false }
            : { inn: s.cur.inn + 1, top: true }
          return {
            halves: [...s.halves, record],
            eventLog: [
              ...s.eventLog,
              {
                label: labelOf(s.cur.inn, s.cur.top),
                teamName: nameOf(atk),
                event: `${delta} 득점`,
              },
            ],
            cur: nextCur,
            halfStart: { ...s.scores },
            so: emptyCount(),
          }
        }),

      editHalf: (team, inn, value) =>
        set((s) => {
          const v = Math.max(0, Math.floor(value) || 0)
          // 팀이 공격하는 반(초/말): 선공팀이면 초(top)
          const top = s.firstAttacker === team
          // 진행 중인(아직 기록 전) 칸이면 총점을 직접 보정
          if (s.cur.inn === inn && s.cur.top === top) {
            return {
              scores: { ...s.scores, [team]: s.halfStart[team] + v },
            }
          }
          // 완료된 칸: 기록 수정 + 총점/스냅샷 차이만큼 보정
          const idx = s.halves.findIndex((h) => h.inn === inn && h.top === top)
          if (idx === -1) return s
          const key = team === 'a' ? 'ra' : 'rb'
          const diff = v - s.halves[idx][key]
          return {
            halves: s.halves.map((h, i) => (i === idx ? { ...h, [key]: v } : h)),
            scores: { ...s.scores, [team]: Math.max(0, s.scores[team] + diff) },
            halfStart: {
              ...s.halfStart,
              [team]: Math.max(0, s.halfStart[team] + diff),
            },
          }
        }),

      toggleCount: (key) =>
        set((s) => {
          const max = { s: 3, b: 4, o: 3, f: 99 }[key]
          const cur = s.so[key]
          return { so: { ...s.so, [key]: cur >= max ? 0 : cur + 1 } }
        }),

      setCount: (key, value) =>
        set((s) => {
          const max = { s: 3, b: 4, o: 3, f: 99 }[key]
          return { so: { ...s.so, [key]: Math.max(0, Math.min(max, value)) } }
        }),

      tickCount: (key) => {
        let result: 'fill' | 'out' | 'walk' | 'reset' = 'fill'
        set((s) => {
          const so = { ...s.so }
          const addOut = () => {
            so.o = Math.min(3, so.o + 1)
            result = 'out'
          }
          if (key === 's') {
            // 스트라이크 3개 도달 → 아웃, 리셋
            so.s += 1
            if (so.s >= 3) {
              so.s = 0
              addOut()
            }
          } else if (key === 'b') {
            // 볼 4개 도달 → 볼넷(출루), 아웃 아님. 카운트만 리셋
            so.b += 1
            if (so.b >= 4) {
              so.b = 0
              result = 'walk'
            }
          } else if (key === 'f') {
            // 파울: 숫자 누적. 2스트라이크 미만일 때만 스트라이크 +1
            so.f += 1
            if (so.s < 2) so.s += 1
            result = 'fill'
          } else {
            // 아웃 도트 직접 탭: 3에서 더 누르면 0으로 리셋
            if (so.o >= 3) {
              so.o = 0
              result = 'reset'
            } else {
              so.o += 1
              result = 'out'
            }
          }
          return { so }
        })
        return result
      },

      reset: () =>
        set({
          phase: 'idle',
          firstAttacker: 'a',
          cur: { inn: 1, top: true },
          scores: { a: 0, b: 0 },
          halfStart: { a: 0, b: 0 },
          halves: [],
          so: emptyCount(),
          eventLog: [],
        }),
    }),
    { name: 'baseball-store' }
  )
)
