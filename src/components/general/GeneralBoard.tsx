import { useGeneralStore } from '../../stores/generalStore'
import { useSettingsStore, type Team } from '../../stores/settingsStore'
import { colorHex } from '../../lib/colors'
import { playScore, playMinus } from '../../lib/sound'
import { TimerPill } from '../ui/TimerPill'

function TeamHalf({ team }: { team: Team }) {
  const score = useGeneralStore((s) => s.scores[team])
  const inc = useGeneralStore((s) => s.inc)
  const dec = useGeneralStore((s) => s.dec)
  const color = useSettingsStore((s) => (team === 'a' ? s.teamA.color : s.teamB.color))
  const name = useSettingsStore((s) => s.teamName(team))

  return (
    <div
      className={`team-half minus-${team === 'a' ? 'left' : 'right'}`}
      style={{ background: colorHex(color) }}
      onClick={() => {
        inc(team)
        playScore()
      }}
      role="button"
      aria-label={`${name} 득점`}
    >
      <div className="team-name">{name}</div>
      <div className="team-score">{score}</div>
      <button
        type="button"
        className="minus-btn"
        onClick={(e) => {
          e.stopPropagation()
          if (score > 0) playMinus()
          dec(team)
        }}
        aria-label={`${name} 감점`}
      >
        −
      </button>
    </div>
  )
}

function SetCounter() {
  const sets = useGeneralStore((s) => s.sets)
  const incSet = useGeneralStore((s) => s.incSet)
  const decSet = useGeneralStore((s) => s.decSet)
  const resetSets = useGeneralStore((s) => s.resetSets)
  const colorA = useSettingsStore((s) => colorHex(s.teamA.color))
  const colorB = useSettingsStore((s) => colorHex(s.teamB.color))

  return (
    <div className="set-counter" onClick={(e) => e.stopPropagation()}>
      <span className="set-label">세트</span>
      <div className="set-row">
        <button
          type="button"
          className="set-num"
          style={{ color: colorA }}
          onClick={() => incSet('a')}
          onContextMenu={(e) => {
            e.preventDefault()
            decSet('a')
          }}
        >
          {sets.a}
        </button>
        <span className="set-colon">:</span>
        <button
          type="button"
          className="set-num"
          style={{ color: colorB }}
          onClick={() => incSet('b')}
          onContextMenu={(e) => {
            e.preventDefault()
            decSet('b')
          }}
        >
          {sets.b}
        </button>
      </div>
      <button
        type="button"
        className="set-reset"
        onClick={resetSets}
        aria-label="세트 초기화"
        title="세트 초기화"
      >
        ↺
      </button>
    </div>
  )
}

export function GeneralBoard() {
  const timerEnabled = useSettingsStore((s) => s.timer.enabled)
  const setCounter = useSettingsStore((s) => s.setCounter)
  const reset = useGeneralStore((s) => s.reset)

  return (
    <div className="general-board">
      {timerEnabled && <TimerPill />}
      <TeamHalf team="a" />
      <TeamHalf team="b" />
      {setCounter && <SetCounter />}
      <button
        type="button"
        className="general-reset"
        onClick={() => {
          if (confirm('점수를 초기화할까요?')) reset()
        }}
        aria-label="점수 초기화"
      >
        ↺ 초기화
      </button>
    </div>
  )
}
