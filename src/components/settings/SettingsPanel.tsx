import { useSettingsStore, type Team } from '../../stores/settingsStore'
import { useGeneralStore } from '../../stores/generalStore'
import { useBaseballStore } from '../../stores/baseballStore'
import { autoTeamName } from '../../lib/colors'
import { Toggle } from '../ui/Toggle'
import { ColorSwatch } from '../ui/ColorSwatch'

function TeamSettings({ team }: { team: Team }) {
  const cfg = useSettingsStore((s) => (team === 'a' ? s.teamA : s.teamB))
  const other = useSettingsStore((s) => (team === 'a' ? s.teamB : s.teamA))
  const setColor = useSettingsStore((s) => s.setColor)
  const setCustomName = useSettingsStore((s) => s.setCustomName)

  return (
    <div className="settings-card">
      <h3>팀 {team === 'a' ? 'A' : 'B'}</h3>
      <label className="field-label">색상</label>
      <ColorSwatch
        value={cfg.color}
        onChange={(c) => setColor(team, c)}
        disabledColor={other.color}
      />
      <label className="field-label">이름</label>
      <input
        className="text-input"
        type="text"
        value={cfg.customName}
        placeholder={autoTeamName(cfg.color)}
        onChange={(e) => setCustomName(team, e.target.value)}
      />
    </div>
  )
}

function TimerSettings() {
  const timer = useSettingsStore((s) => s.timer)
  const setTimer = useSettingsStore((s) => s.setTimer)

  return (
    <div className="settings-card">
      <h3>타이머</h3>
      <div className="row">
        <span>사용</span>
        <Toggle checked={timer.enabled} onChange={(v) => setTimer({ enabled: v })} />
      </div>
      {timer.enabled && (
        <>
          <div className="seg">
            <button
              className={timer.mode === 'up' ? 'active' : ''}
              onClick={() => setTimer({ mode: 'up' })}
            >
              카운트업
            </button>
            <button
              className={timer.mode === 'down' ? 'active' : ''}
              onClick={() => setTimer({ mode: 'down' })}
            >
              카운트다운
            </button>
          </div>
          {timer.mode === 'down' && (
            <div className="row">
              <span>시간(분)</span>
              <input
                className="num-input"
                type="number"
                min={1}
                value={timer.minutes}
                onChange={(e) =>
                  setTimer({ minutes: Math.max(1, Number(e.target.value) || 1) })
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BaseballSettings() {
  const baseball = useSettingsStore((s) => s.baseball)
  const setBaseball = useSettingsStore((s) => s.setBaseball)
  const preset = useSettingsStore((s) => s.baseballPreset)

  const items: { key: keyof typeof baseball; label: string }[] = [
    { key: 'showStrike', label: '스트라이크' },
    { key: 'showBall', label: '볼' },
    { key: 'showOut', label: '아웃' },
    { key: 'showFoul', label: '파울' },
  ]

  return (
    <div className="settings-card">
      <h3>야구 점수판 표시 항목</h3>
      <div className="seg">
        <button onClick={() => preset('baseball')}>야구</button>
        <button onClick={() => preset('kickball')}>발야구</button>
      </div>
      {items.map((it) => (
        <div className="row" key={it.key}>
          <span>{it.label}</span>
          <Toggle
            checked={baseball[it.key]}
            onChange={(v) => setBaseball({ [it.key]: v })}
          />
        </div>
      ))}
    </div>
  )
}

export function SettingsPanel() {
  const resetGeneral = useGeneralStore((s) => s.reset)
  const resetBaseball = useBaseballStore((s) => s.reset)

  const resetAll = () => {
    if (confirm('일반·야구 점수를 모두 초기화할까요?')) {
      resetGeneral()
      resetBaseball()
    }
  }

  return (
    <div className="settings-panel">
      <div className="settings-grid">
        <TeamSettings team="a" />
        <TeamSettings team="b" />
        <TimerSettings />
        <BaseballSettings />
      </div>
      <div className="settings-card">
        <h3>점수</h3>
        <button className="danger-btn" onClick={resetAll}>
          점수 초기화
        </button>
      </div>
    </div>
  )
}
