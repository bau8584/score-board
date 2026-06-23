import { useBaseballStore } from '../../stores/baseballStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { colorHex } from '../../lib/colors'

export function RecordTable() {
  const halves = useBaseballStore((s) => s.halves)
  const cur = useBaseballStore((s) => s.cur)
  const scores = useBaseballStore((s) => s.scores)
  const halfStart = useBaseballStore((s) => s.halfStart)
  const firstAttacker = useBaseballStore((s) => s.firstAttacker)
  const editHalf = useBaseballStore((s) => s.editHalf)
  const nameA = useSettingsStore((s) => s.teamName('a'))
  const nameB = useSettingsStore((s) => s.teamName('b'))
  const colorA = useSettingsStore((s) => colorHex(s.teamA.color))
  const colorB = useSettingsStore((s) => colorHex(s.teamB.color))

  // 진행한 최대 회차 (현재 회차 포함)
  const maxInn = Math.max(cur.inn, ...halves.map((h) => h.inn), 1)
  const innings = Array.from({ length: maxInn }, (_, i) => i + 1)

  // 팀이 공격하는 반(초/말): 선공팀이면 초(top), 후공팀이면 말(bottom)
  const teamTop = (team: 'a' | 'b') => firstAttacker === team

  /** 해당 칸이 시작됐는지 (진행 중이거나 기록 있음) */
  const startedHalf = (inn: number, top: boolean) => {
    if (inn < cur.inn) return true
    if (inn === cur.inn) return top ? true : !cur.top
    return false
  }

  const isCurrentTeam = (team: 'a' | 'b', inn: number) =>
    cur.inn === inn && cur.top === teamTop(team)

  /** 팀 T의 inn회 득점 칸 */
  const teamCell = (team: 'a' | 'b', inn: number) => {
    const top = teamTop(team)
    if (!startedHalf(inn, top)) return '·'
    // 진행 중인 칸은 실시간 득점(스냅샷 대비 증가분) 표시
    if (isCurrentTeam(team, inn)) {
      return scores[team] - halfStart[team]
    }
    const h = halves.find((x) => x.inn === inn && x.top === top)
    return (team === 'a' ? h?.ra : h?.rb) ?? 0
  }

  const teamMeta = [
    { team: 'a' as const, name: nameA, color: colorA, total: scores.a },
    { team: 'b' as const, name: nameB, color: colorB, total: scores.b },
  ]

  return (
    <div className="bb-record">
      <div className="record-scroll">
        <table className="record-table">
          <thead>
            <tr>
              <th className="team-col">팀</th>
              {innings.map((n) => (
                <th key={n}>{n}회</th>
              ))}
              <th className="total-col">R</th>
            </tr>
          </thead>
          <tbody>
            {teamMeta.map((t) => (
              <tr key={t.team}>
                <td className="team-col" style={{ color: t.color }}>
                  {t.name}
                </td>
                {innings.map((n) => {
                  const started = startedHalf(n, teamTop(t.team))
                  const val = teamCell(t.team, n)
                  return (
                    <td
                      key={n}
                      className={isCurrentTeam(t.team, n) ? 'current' : ''}
                    >
                      {started ? (
                        <input
                          type="number"
                          min={0}
                          className="record-edit"
                          value={val as number}
                          onChange={(e) =>
                            editHalf(t.team, n, Number(e.target.value))
                          }
                          onFocus={(e) => e.target.select()}
                        />
                      ) : (
                        '·'
                      )}
                    </td>
                  )
                })}
                <td className="total-col" style={{ color: t.color }}>
                  {t.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="record-hint">
        숫자 칸을 눌러 점수를 직접 수정할 수 있어요. 총점(R)은 자동 반영됩니다.
      </p>
    </div>
  )
}
