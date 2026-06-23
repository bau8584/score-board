import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { playTimeUp } from '../../lib/sound'

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** 현재 시간 표시 (오전/오후 H:MM) */
function ClockPill() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const h = now.getHours()
  const m = now.getMinutes()
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12

  return (
    <div className="pill clock">
      <span className="pill-time">
        {ampm} {h12}:{String(m).padStart(2, '0')}
      </span>
    </div>
  )
}

/** 카운트업/카운트다운 */
function CountPill({
  mode,
  minutes,
  seconds: cfgSeconds,
}: {
  mode: 'up' | 'down'
  minutes: number
  seconds: number
}) {
  const startValue = mode === 'down' ? minutes * 60 + cfgSeconds : 0
  const [seconds, setSeconds] = useState(startValue)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // 설정 변경 시 리셋
  useEffect(() => {
    setRunning(false)
    setDone(false)
    setSeconds(startValue)
  }, [mode, minutes, cfgSeconds, startValue])

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'down') return prev <= 1 ? 0 : prev - 1
        return prev + 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [running, mode])

  // 카운트다운 종료 감지 → 정지 + 소리 + 팝업
  useEffect(() => {
    if (mode === 'down' && running && seconds === 0) {
      setRunning(false)
      setDone(true)
      playTimeUp()
    }
  }, [seconds, running, mode])

  const reset = () => {
    setRunning(false)
    setDone(false)
    setSeconds(startValue)
  }

  const toggleRun = () => {
    if (done) {
      reset()
      return
    }
    setRunning((r) => !r)
  }

  return (
    <>
      <div className={`pill ${expanded ? 'expanded' : ''} ${done ? 'finished' : ''}`}>
        <button
          type="button"
          className="pill-time"
          onClick={() => setExpanded((e) => !e)}
        >
          {fmt(seconds)}
        </button>
        {expanded && (
          <div className="pill-actions">
            <button
              type="button"
              className="pill-action"
              onClick={toggleRun}
              aria-label={running ? '일시정지' : '시작'}
              title={running ? '일시정지' : '시작'}
            >
              {running ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="pill-action ghost"
              onClick={reset}
              aria-label="새로고침"
              title="새로고침"
            >
              ↺
            </button>
          </div>
        )}
      </div>

      {done && (
        <div className="timer-modal-backdrop" onClick={reset}>
          <div className="timer-modal" onClick={(e) => e.stopPropagation()}>
            <p className="timer-modal-text">⏰ 시간 종료!</p>
            <button type="button" className="timer-modal-ok" onClick={reset}>
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function TimerPill() {
  const mode = useSettingsStore((s) => s.timer.mode)
  const minutes = useSettingsStore((s) => s.timer.minutes)
  const seconds = useSettingsStore((s) => s.timer.seconds ?? 0)

  if (mode === 'clock') return <ClockPill />
  return <CountPill mode={mode} minutes={minutes} seconds={seconds} />
}
