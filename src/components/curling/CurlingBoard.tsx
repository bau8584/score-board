import { useState } from 'react'
import {
  useCurlingStore,
  totals,
  type CurlTeam,
} from '../../stores/curlingStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { colorHex } from '../../lib/colors'
import { playScore, playMinus } from '../../lib/sound'

export function CurlingBoard() {
  const ends = useCurlingStore((s) => s.ends)
  const hammer = useCurlingStore((s) => s.hammer)
  const score = useCurlingStore((s) => s.score)
  const blank = useCurlingStore((s) => s.blank)
  const undo = useCurlingStore((s) => s.undo)
  const reset = useCurlingStore((s) => s.reset)
  const setHammer = useCurlingStore((s) => s.setHammer)

  const teamName = useSettingsStore((s) => s.teamName)
  const colorA = colorHex(useSettingsStore((s) => s.teamA.color))
  const colorB = colorHex(useSettingsStore((s) => s.teamB.color))
  const totalEnds = useSettingsStore((s) => s.curling?.ends ?? 6)

  const [pick, setPick] = useState<CurlTeam | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const sum = totals(ends)
  const curEnd = ends.length + 1
  const done = ends.length >= totalEnds
  // 기록표 컬럼: 진행한 엔드 + 현재 엔드(설정 엔드 수까지)
  const cols = Math.max(totalEnds, ends.length)

  const teams: { key: CurlTeam; name: string; color: string; total: number }[] = [
    { key: 'a', name: teamName('a'), color: colorA, total: sum.a },
    { key: 'b', name: teamName('b'), color: colorB, total: sum.b },
  ]

  return (
    <div className="curl-board">
      <div className="curl-halves">
        {teams.map((t) => (
          <div
            key={t.key}
            className="curl-half"
            style={{ background: t.color }}
            role="button"
            aria-label={`${t.name} 득점`}
            onClick={() => !done && setPick(t.key)}
          >
            <div className="curl-name">
              {t.name}
              <span className="curl-order">
                {hammer === t.key ? '🔨 후공' : '선공'}
              </span>
            </div>
            <div className="curl-total">{t.total}</div>
          </div>
        ))}
      </div>

      <div className="curl-bar">
        <span className="curl-endlabel">
          {done ? '경기 종료' : `${curEnd}엔드`}
        </span>
        <button type="button" className="curl-btn" onClick={() => {
          if (done) return
          blank()
          playMinus()
        }}>
          무승부
        </button>
        <button type="button" className="curl-btn" onClick={() => {
          undo()
          playMinus()
        }}>
          ↩ 되돌리기
        </button>
        <button
          type="button"
          className="curl-btn"
          onClick={() => setHammer(hammer === 'a' ? 'b' : 'a')}
        >
          🔨 선공/후공 변경
        </button>
        <button
          type="button"
          className="curl-btn danger"
          onClick={() => setConfirmReset(true)}
        >
          리셋
        </button>
      </div>

      <div className="curl-record record-scroll">
        <table className="record-table">
          <thead>
            <tr>
              <th className="team-col">엔드</th>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i}>{i + 1}</th>
              ))}
              <th className="total-col">합계</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.key}>
                <td className="team-col">{t.name}</td>
                {Array.from({ length: cols }, (_, i) => {
                  const e = ends[i]
                  const isCur = !done && i === ends.length
                  return (
                    <td key={i} className={isCur ? 'current' : ''}>
                      {e ? (e.team === t.key ? e.n : e.team === null ? '–' : 0) : ''}
                    </td>
                  )
                })}
                <td className="total-col">{t.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pick && (
        <div className="bb-modal-backdrop" onClick={() => setPick(null)}>
          <div className="bb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bb-modal-text">
              {teamName(pick)} — {curEnd}엔드 득점
            </div>
            <div className="curl-pad">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className="curl-pad-btn"
                  onClick={() => {
                    score(pick, n)
                    playScore()
                    setPick(null)
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="bb-modal-btns">
              <button
                type="button"
                className="bb-modal-cancel"
                onClick={() => setPick(null)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="bb-modal-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="bb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bb-modal-text">경기 기록을 모두 지울까요?</div>
            <div className="bb-modal-btns">
              <button
                type="button"
                className="bb-modal-cancel"
                onClick={() => setConfirmReset(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="bb-modal-ok"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                }}
              >
                리셋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
