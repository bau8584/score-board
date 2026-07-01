import { useEffect, useRef, useState } from 'react'
import {
  useKinballStore,
  KIN_TEAMS,
  type KinTeam,
} from '../../stores/kinballStore'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  playScore,
  playMinus,
  playOut,
  playTimeUp,
  playWarn,
  playUrgent,
} from '../../lib/sound'

function fmt(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function TeamArea({
  team,
  label,
  color,
  setsToWin,
}: {
  team: KinTeam
  label: string
  color: string
  setsToWin: number
}) {
  const score = useKinballStore((s) => s.scores[team])
  const setsWon = useKinballStore((s) => s.setsWon[team])
  const inc = useKinballStore((s) => s.inc)
  const dec = useKinballStore((s) => s.dec)
  const foul = useKinballStore((s) => s.foul)

  return (
    <div
      className="kin-area"
      style={{ background: color }}
      onClick={() => {
        // 팀 영역 터치 = 이 팀 파울 → 나머지 두 팀 +1
        foul(team)
        playOut()
      }}
      role="button"
      aria-label={`${label} 파울`}
    >
      <div className="kin-pips" aria-label={`획득 세트 ${setsWon}`}>
        {Array.from({ length: setsToWin }, (_, i) => (
          <span key={i} className={`kin-pip ${i < setsWon ? 'on' : ''}`} />
        ))}
      </div>
      <div className="kin-score">{score}</div>
      <div className="kin-btns" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="kin-adj"
          onClick={() => {
            if (score > 0) playMinus()
            dec(team)
          }}
          aria-label={`${label} 감점`}
        >
          −
        </button>
        <button
          type="button"
          className="kin-adj"
          onClick={() => {
            inc(team)
            playScore()
          }}
          aria-label={`${label} 득점`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function KinballBoard() {
  const scores = useKinballStore((s) => s.scores)
  const setsWon = useKinballStore((s) => s.setsWon)
  const gameMode = useKinballStore((s) => s.gameMode)
  const setGameMode = useKinballStore((s) => s.setGameMode)
  const awardSet = useKinballStore((s) => s.awardSet)
  const resetRound = useKinballStore((s) => s.resetRound)
  const resetMatch = useKinballStore((s) => s.resetMatch)
  const { target, timeMinutes, timeSeconds, setsToWin, sound } = useSettingsStore(
    (s) => s.kinball
  )
  const totalTime = timeMinutes * 60 + (timeSeconds ?? 0)
  const currentSet = Math.min(
    setsToWin * 2,
    setsWon.pink + setsWon.gray + setsWon.black + 1
  )

  const [seconds, setSeconds] = useState(totalTime)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ label: string; isMatch: boolean } | null>(
    null
  )
  const intervalRef = useRef<number | null>(null)

  const nameOf = (key: KinTeam) => KIN_TEAMS.find((t) => t.key === key)!.label

  // 모드/시간 설정 변경 시 타이머 리셋
  useEffect(() => {
    setRunning(false)
    setSeconds(totalTime)
  }, [gameMode, totalTime])

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setSeconds((p) => (p <= 1 ? 0 : p - 1))
    }, 1000)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [running])

  // 카운트다운 알림음: 30초~ 경고, 10초~ 긴박 (매초)
  useEffect(() => {
    if (gameMode !== 'time' || !running || !sound) return
    if (seconds <= 10 && seconds > 0) playUrgent()
    else if (seconds <= 30 && seconds > 10) playWarn()
  }, [seconds, running, gameMode, sound])

  /** 세트 종료 처리 */
  const endSet = (key: KinTeam) => {
    const newSets = setsWon[key] + 1
    awardSet(key)
    playTimeUp()
    if (newSets >= setsToWin) {
      setResult({ label: `🏆 ${nameOf(key)}팀 경기 승리!`, isMatch: true })
    } else {
      setResult({ label: `${nameOf(key)}팀 세트 획득!`, isMatch: false })
    }
  }

  // 점수제: 목표 도달 → 세트 종료
  useEffect(() => {
    if (gameMode === 'score' && !result) {
      const reached = KIN_TEAMS.find((t) => scores[t.key] >= target)
      if (reached) endSet(reached.key)
    }
  }, [scores, gameMode, result, target])

  // 시간제: 시간 종료 → 최고 점수 팀이 세트 획득(동점이면 무승부)
  useEffect(() => {
    if (gameMode === 'time' && running && seconds === 0 && !result) {
      setRunning(false)
      const max = Math.max(...KIN_TEAMS.map((t) => scores[t.key]))
      const leaders = KIN_TEAMS.filter((t) => scores[t.key] === max)
      if (max > 0 && leaders.length === 1) {
        endSet(leaders[0].key)
      } else {
        resetRound()
        playTimeUp()
        setResult({ label: '무승부! 다시 진행', isMatch: false })
      }
    }
  }, [seconds, running, gameMode, scores, result])

  const closeResult = () => {
    const wasMatch = result?.isMatch
    setResult(null)
    setRunning(false)
    setSeconds(totalTime)
    if (wasMatch) resetMatch()
  }

  return (
    <div className="kin-board">
      <div className="kin-areas">
        {KIN_TEAMS.map((t) => (
          <TeamArea
            key={t.key}
            team={t.key}
            label={t.label}
            color={t.color}
            setsToWin={setsToWin}
          />
        ))}
      </div>

      {/* 상단 중앙: 경기 모드 + 상태 */}
      <div className="kin-top">
        <div className="seg kin-seg">
          <button
            className={gameMode === 'score' ? 'active' : ''}
            onClick={() => setGameMode('score')}
          >
            점수제
          </button>
          <button
            className={gameMode === 'time' ? 'active' : ''}
            onClick={() => setGameMode('time')}
          >
            시간제
          </button>
        </div>
        <span className="kin-format">
          <strong>{currentSet}세트</strong> · {setsToWin}판 선승
        </span>
        {gameMode === 'time' && (
          <div className="kin-timer">
            <span className={`kin-time ${seconds === 0 ? 'done' : ''}`}>
              {fmt(seconds)}
            </span>
            <button
              type="button"
              className="kin-timer-btn"
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? '일시정지' : '시작'}
            >
              {running ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="kin-timer-btn ghost"
              onClick={() => {
                setRunning(false)
                setSeconds(totalTime)
              }}
              aria-label="새로고침"
            >
              ↺
            </button>
          </div>
        )}
      </div>

      {/* 우상단(설정 왼쪽): 경기 초기화 아이콘 */}
      <button
        type="button"
        className="float-btn kin-reset-top"
        onClick={() => {
          if (confirm('경기(점수·세트)를 초기화할까요?')) {
            resetMatch()
            setSeconds(totalTime)
            setRunning(false)
            setResult(null)
          }
        }}
        aria-label="경기 초기화"
        title="경기 초기화"
      >
        ↺
      </button>

      {result && (
        <div className="kin-win-backdrop" onClick={closeResult}>
          <div className="kin-win" onClick={(e) => e.stopPropagation()}>
            <p className="kin-win-text">{result.label}</p>
            <p className="kin-win-score">
              {KIN_TEAMS.map((t) => `${nameOf(t.key)} ${setsWon[t.key]}세트`).join(
                '  ·  '
              )}
            </p>
            <button type="button" className="kin-win-ok" onClick={closeResult}>
              {result.isMatch ? '새 경기' : '다음 세트'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
