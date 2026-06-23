import { useEffect, useState } from 'react'
import {
  useBaseballStore,
  halfLabel,
  attacker,
} from '../../stores/baseballStore'
import { useSettingsStore, type Team } from '../../stores/settingsStore'
import { colorHex } from '../../lib/colors'
import {
  playScore,
  playMinus,
  playStrike,
  playBall,
  playOut,
  playFoul,
  playWalk,
  playSwitch,
} from '../../lib/sound'
import { RecordTable } from './RecordTable'

function TeamHalf({ team, side }: { team: Team; side: 'left' | 'right' }) {
  const score = useBaseballStore((s) => s.scores[team])
  const floor = useBaseballStore((s) => s.halfStart[team])
  const inc = useBaseballStore((s) => s.inc)
  const dec = useBaseballStore((s) => s.dec)
  const isAttacker = useBaseballStore(
    (s) => attacker(s.cur.top, s.firstAttacker) === team
  )
  const color = useSettingsStore((s) => (team === 'a' ? s.teamA.color : s.teamB.color))
  const name = useSettingsStore((s) => s.teamName(team))

  return (
    <div
      className={`team-half minus-${side} ${
        isAttacker ? 'bb-attacking' : 'bb-defending'
      }`}
      style={{ background: colorHex(color) }}
      onClick={() => {
        if (!isAttacker) return
        inc(team)
        playScore()
      }}
      role="button"
      aria-label={`${name} 득점`}
    >
      <div className="team-name">{name}</div>
      <div className="team-score">{score}</div>
      {isAttacker && (
        <button
          type="button"
          className="minus-btn"
          onClick={(e) => {
            e.stopPropagation()
            if (score > floor) playMinus()
            dec(team)
          }}
          aria-label={`${name} 감점`}
        >
          −
        </button>
      )}
    </div>
  )
}

/** 화면 정중앙에 떠있는 세로 아웃 카운트 (무채색) */
function CenterOut() {
  const o = useBaseballStore((s) => s.so.o)
  const tickCount = useBaseballStore((s) => s.tickCount)
  const setCount = useBaseballStore((s) => s.setCount)
  const showOut = useSettingsStore((s) => s.baseball.showOut)
  if (!showOut) return null

  return (
    <div className="bb-out-pill" onClick={(e) => e.stopPropagation()}>
      <span className="bb-out-label">OUT</span>
      <button
        type="button"
        className="bb-out-dots"
        onClick={() => {
          if (tickCount('o') === 'out') playOut()
        }}
        aria-label="아웃 추가"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className={`bb-out-dot ${i < o ? 'on' : ''}`} />
        ))}
      </button>
      <button
        type="button"
        className="bb-out-reset"
        onClick={() => setCount('o', 0)}
        title="아웃 초기화"
        aria-label="아웃 초기화"
      >
        ↺
      </button>
    </div>
  )
}

type SbfKey = 's' | 'b' | 'f'

/** 하단 슬림 스트립: 스트라이크 · 볼 · 파울 */
function BottomCounts() {
  const so = useBaseballStore((s) => s.so)
  const tickCount = useBaseballStore((s) => s.tickCount)
  const setCount = useBaseballStore((s) => s.setCount)
  const bb = useSettingsStore((s) => s.baseball)

  const sounds: Record<SbfKey, () => void> = {
    s: playStrike,
    b: playBall,
    f: playFoul,
  }
  const defs = [
    { k: 's' as const, label: 'S', max: 3, color: '#f9a825', numeric: false, show: bb.showStrike },
    { k: 'b' as const, label: 'B', max: 4, color: '#43a047', numeric: false, show: bb.showBall },
    { k: 'f' as const, label: 'F', max: 4, color: '#42a5f5', numeric: true, show: bb.showFoul },
  ].filter((d) => d.show)

  // 칩이 없어도(예: 발야구) 빈 영역을 유지해 기록·경기초기화를 오른쪽에 고정
  return (
    <div className="bb-bottom-counts" onClick={(e) => e.stopPropagation()}>
      {defs.map((d) => (
        <div key={d.k} className="bb-chip-unit">
          <button
            type="button"
            className="bb-chip"
            onClick={() => {
              const r = tickCount(d.k)
              if (r === 'fill') sounds[d.k]()
              else if (r === 'out') playOut()
              else if (r === 'walk') playWalk()
            }}
          >
            <span className="bb-chip-label" style={{ color: d.color }}>
              {d.label}
            </span>
            {d.numeric ? (
              <span className="bb-chip-num" style={{ color: d.color }}>
                {so[d.k]}
              </span>
            ) : (
              <span className="bb-chip-dots">
                {Array.from({ length: d.max }, (_, i) => (
                  <span
                    key={i}
                    className="bb-chip-dot"
                    style={
                      i < so[d.k]
                        ? { background: d.color, borderColor: d.color }
                        : undefined
                    }
                  />
                ))}
              </span>
            )}
          </button>
          <button
            type="button"
            className="bb-chip-reset"
            onClick={() => setCount(d.k, 0)}
            title={`${d.label} 초기화`}
            aria-label={`${d.label} 초기화`}
          >
            ↺
          </button>
        </div>
      ))}
    </div>
  )
}

function StartOverlay({ onStart }: { onStart: (first: Team) => void }) {
  const nameA = useSettingsStore((s) => s.teamName('a'))
  const nameB = useSettingsStore((s) => s.teamName('b'))
  const colorA = useSettingsStore((s) => colorHex(s.teamA.color))
  const colorB = useSettingsStore((s) => colorHex(s.teamB.color))

  return (
    <div className="bb-start-overlay">
      <h2 className="bb-start-title">먼저 공격할 팀을 선택하세요</h2>
      <div className="bb-start-pick">
        <button
          className="bb-pick-btn"
          style={{ background: colorA }}
          onClick={() => onStart('a')}
        >
          {nameA}
          <span className="bb-pick-sub">선공 ▶</span>
        </button>
        <button
          className="bb-pick-btn"
          style={{ background: colorB }}
          onClick={() => onStart('b')}
        >
          {nameB}
          <span className="bb-pick-sub">선공 ▶</span>
        </button>
      </div>
    </div>
  )
}

export function BaseballTab() {
  const phase = useBaseballStore((s) => s.phase)
  const cur = useBaseballStore((s) => s.cur)
  const firstAttacker = useBaseballStore((s) => s.firstAttacker)
  const outs = useBaseballStore((s) => s.so.o)
  const showOut = useSettingsStore((s) => s.baseball.showOut)
  const start = useBaseballStore((s) => s.start)
  const switchHalf = useBaseballStore((s) => s.switchHalf)
  const setCount = useBaseballStore((s) => s.setCount)
  const reset = useBaseballStore((s) => s.reset)
  const teamName = useSettingsStore((s) => s.teamName)
  const colorA = useSettingsStore((s) => s.teamA.color)
  const colorB = useSettingsStore((s) => s.teamB.color)
  const [showRecord, setShowRecord] = useState(false)
  const [askSwitch, setAskSwitch] = useState(false)

  // 아웃 3개 도달 시 공수 전환 확인 팝업
  useEffect(() => {
    if (phase === 'playing' && showOut && outs >= 3) setAskSwitch(true)
  }, [outs, showOut, phase])

  // 공수 전환 (사운드 한 번만 — 버튼/팝업 어느 경로든 중복 없음)
  const doSwitch = () => {
    playSwitch()
    switchHalf(halfLabel, teamName)
    setAskSwitch(false)
  }

  // 공격 팀이 항상 왼쪽: 공수전환 시 위치가 바뀜
  const leftTeam: Team = attacker(cur.top, firstAttacker)
  const rightTeam: Team = leftTeam === 'a' ? 'b' : 'a'
  // 공수 전환 버튼 색상 = 현재 수비팀 색상
  const defenderColor = colorHex(rightTeam === 'a' ? colorA : colorB)

  return (
    <div className="bb-board">
      <div className="bb-top-pill">{halfLabel(cur.inn, cur.top)}</div>

      <div className="bb-halves">
        <TeamHalf key={leftTeam} team={leftTeam} side="left" />
        <TeamHalf key={rightTeam} team={rightTeam} side="right" />
      </div>

      {/* 중앙 플로팅 아웃 카운트 */}
      {phase === 'playing' && <CenterOut />}

      {/* 하단 통합 바: S·B·F 카운트 + 공수전환 + 기록 + 초기화 */}
      {phase === 'playing' && (
        <div className="bb-controlbar">
          <button
            className="bb-big-btn switch"
            style={{ background: defenderColor }}
            onClick={doSwitch}
          >
            ⇄ 공수 전환
          </button>
          <BottomCounts />
          <button className="bb-big-btn record" onClick={() => setShowRecord(true)}>
            📋 기록
          </button>
          <button
            type="button"
            className="bb-big-btn ctl-reset"
            onClick={() => {
              if (confirm('경기를 초기화할까요?')) reset()
            }}
            aria-label="경기 초기화"
            title="경기 초기화"
          >
            경기
            <br />
            초기화
          </button>
        </div>
      )}

      {/* 경기 시작 전: 선공 팀 선택 */}
      {phase === 'idle' && <StartOverlay onStart={start} />}

      {/* 아웃 3개 → 공수 전환 확인 팝업 */}
      {askSwitch && (
        <div className="bb-modal-backdrop">
          <div className="bb-modal">
            <p className="bb-modal-text">아웃 3개! 공수를 전환할까요?</p>
            <div className="bb-modal-btns">
              <button
                className="bb-modal-cancel"
                onClick={() => {
                  setCount('o', 2)
                  setAskSwitch(false)
                }}
              >
                아니요
              </button>
              <button className="bb-modal-ok" onClick={doSwitch}>
                공수 전환
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기록 보기 오버레이 */}
      {showRecord && (
        <div className="bb-record-overlay">
          <div className="bb-record-head">
            <h2>경기 기록</h2>
            <div className="bb-record-head-btns">
              <button
                className="bb-record-reset"
                onClick={() => {
                  if (confirm('경기를 초기화할까요?')) {
                    reset()
                    setShowRecord(false)
                  }
                }}
              >
                경기 초기화
              </button>
              <button className="bb-record-close" onClick={() => setShowRecord(false)}>
                닫기 ✕
              </button>
            </div>
          </div>
          <div className="bb-record-body">
            <RecordTable />
          </div>
        </div>
      )}
    </div>
  )
}
