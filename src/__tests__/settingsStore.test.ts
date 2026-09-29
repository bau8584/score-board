import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../stores/settingsStore'
import { autoTeamName, colorHex } from '../lib/colors'

const st = () => useSettingsStore.getState()
beforeEach(() => {
  st().setColor('a', '빨강')
  st().setColor('b', '파랑')
  st().setCustomName('a', '')
  st().setCustomName('b', '')
})

describe('팀 이름/색상', () => {
  it('기본 이름은 색상 기반 자동 이름', () => {
    expect(st().teamName('a')).toBe('빨강팀')
    expect(st().teamName('b')).toBe('파랑팀')
  })

  it('색상을 바꾸면 자동 이름도 따라간다', () => {
    st().setColor('a', '초록')
    expect(st().teamName('a')).toBe('초록팀')
  })

  it('직접 입력한 이름은 색상이 바뀌어도 고정', () => {
    st().setCustomName('a', '독수리')
    st().setColor('a', '보라')
    expect(st().teamName('a')).toBe('독수리')
  })

  it('입력값을 지우거나 공백만 있으면 자동 이름으로 복귀', () => {
    st().setCustomName('a', '독수리')
    st().setCustomName('a', '   ')
    expect(st().teamName('a')).toBe('빨강팀')
  })
})

describe('야구 프리셋', () => {
  it('야구: 전부 켜기', () => {
    st().baseballPreset('baseball')
    expect(st().baseball).toEqual({
      showStrike: true, showBall: true, showOut: true, showFoul: true,
    })
  })

  it('발야구: 아웃만 켜기', () => {
    st().baseballPreset('kickball')
    expect(st().baseball).toEqual({
      showStrike: false, showBall: false, showOut: true, showFoul: false,
    })
  })
})

describe('색상', () => {
  it('알 수 없는 색은 회색 폴백', () => {
    expect(colorHex('없는색')).toBe('#555555')
    expect(autoTeamName('노랑')).toBe('노랑팀')
  })
})
