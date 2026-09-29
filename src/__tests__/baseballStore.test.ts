import { describe, it, expect, beforeEach } from 'vitest'
import { useBaseballStore, attacker, halfLabel } from '../stores/baseballStore'

const st = () => useBaseballStore.getState()
const name = (t: 'a' | 'b') => (t === 'a' ? 'A팀' : 'B팀')

beforeEach(() => {
  st().reset()
  st().start('a')
})

describe('공격/득점 규칙', () => {
  it('초는 선공팀, 말은 후공팀이 공격', () => {
    expect(attacker(true, 'a')).toBe('a')
    expect(attacker(false, 'a')).toBe('b')
    expect(attacker(true, 'b')).toBe('b')
  })

  it('공격 팀만 득점할 수 있다', () => {
    st().inc('b')
    expect(st().scores).toEqual({ a: 0, b: 0 })
    st().inc('a')
    expect(st().scores).toEqual({ a: 1, b: 0 })
  })

  it('감점은 현재 이닝 시작점 아래로 내려가지 않는다', () => {
    st().inc('a')
    st().inc('a')
    st().switchHalf(halfLabel, name) // 1회 초 종료 (A 2점)
    st().switchHalf(halfLabel, name) // 1회 말 종료
    st().dec('a')
    expect(st().scores.a).toBe(2)
  })

  it('경기 시작 전에는 득점 불가', () => {
    st().reset()
    st().inc('a')
    expect(st().scores.a).toBe(0)
  })
})

describe('초/말 진행', () => {
  it('초 → 말 → 다음 회 초 순서로 진행', () => {
    expect(st().cur).toEqual({ inn: 1, top: true })
    st().switchHalf(halfLabel, name)
    expect(st().cur).toEqual({ inn: 1, top: false })
    st().switchHalf(halfLabel, name)
    expect(st().cur).toEqual({ inn: 2, top: true })
  })

  it('이닝 기록과 이벤트 로그가 남는다', () => {
    st().inc('a')
    st().inc('a')
    st().switchHalf(halfLabel, name)
    expect(st().halves).toEqual([{ inn: 1, top: true, ra: 2, rb: 0 }])
    expect(st().eventLog[0]).toEqual({ label: '1회 초', teamName: 'A팀', event: '2 득점' })
  })

  it('이닝이 넘어가면 카운트가 초기화된다', () => {
    st().tickCount('s')
    st().tickCount('b')
    st().switchHalf(halfLabel, name)
    expect(st().so).toEqual({ s: 0, o: 0, b: 0, f: 0 })
  })

  it('후공팀이 말에 득점하면 B 점수가 기록된다', () => {
    st().switchHalf(halfLabel, name)
    st().inc('b')
    st().switchHalf(halfLabel, name)
    expect(st().halves[1]).toEqual({ inn: 1, top: false, ra: 0, rb: 1 })
  })
})

describe('카운트(S/B/O/F)', () => {
  it('스트라이크 3개 = 아웃 1개, 스트라이크 리셋', () => {
    st().tickCount('s')
    st().tickCount('s')
    expect(st().tickCount('s')).toBe('out')
    expect(st().so).toMatchObject({ s: 0, o: 1 })
  })

  it('볼 4개 = 볼넷, 아웃은 늘지 않는다', () => {
    for (let i = 0; i < 3; i++) st().tickCount('b')
    expect(st().tickCount('b')).toBe('walk')
    expect(st().so).toMatchObject({ b: 0, o: 0 })
  })

  it('파울은 2스트라이크 전까지만 스트라이크를 올린다', () => {
    st().tickCount('f')
    st().tickCount('f')
    st().tickCount('f')
    expect(st().so).toMatchObject({ s: 2, f: 3, o: 0 })
  })

  it('아웃 3개에서 한 번 더 누르면 0으로 리셋', () => {
    st().tickCount('o')
    st().tickCount('o')
    st().tickCount('o')
    expect(st().so.o).toBe(3)
    expect(st().tickCount('o')).toBe('reset')
    expect(st().so.o).toBe(0)
  })
})

describe('기록표 수정(editHalf)', () => {
  it('완료된 칸을 고치면 총점이 보정된다', () => {
    st().inc('a')
    st().switchHalf(halfLabel, name) // 1회 초 A 1점
    st().editHalf('a', 1, 4)
    expect(st().halves[0].ra).toBe(4)
    expect(st().scores.a).toBe(4)
    expect(st().halfStart.a).toBe(4)
  })

  it('진행 중인 칸을 고치면 이닝 시작 점수 기준으로 총점이 정해진다', () => {
    st().inc('a')
    st().switchHalf(halfLabel, name) // A 1점
    st().switchHalf(halfLabel, name)
    st().editHalf('a', 2, 3) // 2회 초 진행 중
    expect(st().scores.a).toBe(4)
  })

  it('음수는 0으로 처리', () => {
    st().inc('a')
    st().switchHalf(halfLabel, name)
    st().editHalf('a', 1, -5)
    expect(st().halves[0].ra).toBe(0)
  })
})
