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
  const phase = useBaseballStore((s) => s.phase)
  const inc = useBaseballStore((s) => s.inc)
  const dec = useBaseballStore((s) => s.dec)
  const isAttacker = useBaseballStore(
    (s) => attacker(s.cur.top, s.firstAttacker) === team
  )
  const color = useSettingsStore((s) => (team === 'a' ? s.teamA.color : s.teamB.color))
  const name = useSettingsStore((s) => s.teamName(team))
  const playing = phase === 'playing'

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
      {/* 수비팀: S·B·F 카운트를 이름 위에 */}
      {playing && !isAttacker && (
        <CountControl keys={['s', 'b', 'f']} className="bb-counts-defender" />
      )}
      <div className="team-name">{name}</div>
      <div className="bb-role">{isAttacker ? '공격' : '수비'}</div>
      {/* 공격팀: 아웃 카운트를 점수 위에 */}
      {playing && isAttacker && (
        <CountControl keys={['o']} className="bb-counts-out" />
      )}
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

function CountButton({
  label,
  count,
  max,
  color,
  numeric,
  onTap,
  onReset,
}: {
  label: string
  count: number
  max: number
  color: string
  numeric?: boolean
  onTap: () => void
  onReset: () => void
}) {
  return (
    <div className="bb-count-row">
      <button type="button" className="bb-count-btn" onClick={onTap}>
        <span className="bb-count-label">{label}</span>
        {numeric ? (
          <span className="bb-count-number" style={{ color }}>
            {count}
          </span>
        ) : (
          <span className="bb-count-dots">
            {Array.from({ length: max }, (_, i) => (
              <span
                key={i}
                className={`bb-count-dot ${i < count ? 'on' : ''}`}
                style={
                  i < count ? { background: color, borderColor: color } : undefined
                }
              />
            ))}
          </span>
        )}
      </button>
      <button
        type="button"
        className="bb-count-reset"
        onClick={onReset}
        aria-label={`${label} 초기화`}
        title="초기화"
      >
        ↺
      </button>
    </div>
  )
}

type CountKey = 's' | 'b' | 'o' | 'f'

const COUNT_DEFS: Record<
  CountKey,
  { label: string; max: number; color: string; numeric: boolean }
> = {
  s: { label: 'S', max: 3, color: '#f9a825', numeric: false },
  b: { label: 'B', max: 4, color: '#43a047', numeric: false },
  o: { label: 'O', max: 3, color: '#e53935', numeric: false },
  f: { label: 'F', max: 4, color: '#42a5f5', numeric: true },
}

function CountControl({
  keys,
  className,
}: {
  keys: CountKey[]
  className?: string
}) {
  const so = useBaseballStore((s) => s.so)
  const tickCount = useBaseballStore((s) => s.tickCount)
  const setCount = useBaseballStore((s) => s.setCount)
  const bb = useSettingsStore((s) => s.baseball)

  const sounds = { s: playStrike, b: playBall, o: playOut, f: playFoul }
  const shown: Record<CountKey, boolean> = {
    s: bb.showStrike,
    b: bb.showBall,
    o: bb.showOut,
    f: bb.showFoul,
  }

  const rows = keys.filter((k) => shown[k])
  if (rows.length === 0) return null

  return (
    <div
      className={`bb-counts ${className ?? ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {rows.map((k) => {
        const def = COUNT_DEFS[k]
        return (
          <CountButton
            key={k}
            label={def.label}
            count={so[k]}
            max={def.max}
            color={def.color}
            numeric={def.numeric}
            onTap={() => {
              const res = tickCount(k)
              if (res === 'fill') sounds[k]()
              else if (res === 'out') sounds.o()
              else if (res === 'walk') playWalk()
              // 'reset'(가득 찬 아웃 도트 비우기)은 무음
            }}
            onReset={() => setCount(k, 0)}
          />
        )
      })}
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

      {/* 일반 탭과 동일한 위치(하단 중앙) 초기화 버튼 */}
      {phase === 'playing' && (
        <button
          type="button"
          className="general-reset bb-reset-float"
          onClick={() => {
            if (confirm('경기를 초기화할까요?')) reset()
          }}
          aria-label="경기 초기화"
        >
          ↺ 초기화
        </button>
      )}

      {/* 하단 컨트롤 바 */}
      {phase === 'playing' && (
        <div className="bb-controlbar">
          <button
            className="bb-big-btn switch"
            style={{ background: defenderColor }}
            onClick={doSwitch}
          >
            ⇄ 공수 전환
          </button>
          <button className="bb-big-btn record" onClick={() => setShowRecord(true)}>
            📋 기록 보기
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
