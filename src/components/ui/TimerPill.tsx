import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function TimerPill() {
  const timer = useSettingsStore((s) => s.timer)

  const startValue = timer.mode === 'down' ? timer.minutes * 60 : 0
  const [seconds, setSeconds] = useState(startValue)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // 설정(모드/분) 변경 시 리셋
  useEffect(() => {
    setRunning(false)
    setSeconds(timer.mode === 'down' ? timer.minutes * 60 : 0)
  }, [timer.mode, timer.minutes])

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (timer.mode === 'down') {
          if (prev <= 0) return 0
          return prev - 1
        }
        return prev + 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [running, timer.mode])

  const finished = timer.mode === 'down' && seconds <= 0
  // 카운트다운 종료 시 자동 정지
  useEffect(() => {
    if (finished && running) setRunning(false)
  }, [finished, running])

  const toggleRun = () => {
    if (finished) {
      // 종료 상태에서 다시 누르면 리셋
      setSeconds(timer.minutes * 60)
      setRunning(false)
      return
    }
    setRunning((r) => !r)
  }

  return (
    <div className={`pill ${expanded ? 'expanded' : ''} ${finished ? 'finished' : ''}`}>
      <button
        type="button"
        className="pill-time"
        onClick={() => setExpanded((e) => !e)}
      >
        {fmt(seconds)}
      </button>
      {expanded && (
        <button type="button" className="pill-action" onClick={toggleRun}>
          {finished ? '리셋' : running ? '정지' : '시작'}
        </button>
      )}
    </div>
  )
}
