import { describe, it, expect, beforeEach } from 'vitest'
import { useCurlingStore, totals } from '../stores/curlingStore'

const st = () => useCurlingStore.getState()
beforeEach(() => st().reset())

describe('컬링', () => {
  it('득점당한 팀이 다음 엔드 해머(후공)를 가진다', () => {
    st().score('a', 2)
    expect(st().hammer).toBe('b')
    st().score('b', 1)
    expect(st().hammer).toBe('a')
  })

  it('무득점(blank) 엔드는 해머를 유지하고 점수는 0', () => {
    const h = st().hammer
    st().blank()
    expect(st().hammer).toBe(h)
    expect(totals(st().ends)).toEqual({ a: 0, b: 0 })
  })

  it('합계 계산', () => {
    st().score('a', 2)
    st().score('b', 1)
    st().score('a', 3)
    expect(totals(st().ends)).toEqual({ a: 5, b: 1 })
  })

  it('되돌리기는 마지막 엔드와 해머를 복원', () => {
    st().score('a', 2)
    const before = st().hammer
    st().score('b', 1)
    st().undo()
    expect(st().ends).toHaveLength(1)
    expect(st().hammer).toBe(before)
  })

  it('기록이 없을 때 되돌리기는 무시', () => {
    st().undo()
    expect(st().ends).toHaveLength(0)
  })
})
