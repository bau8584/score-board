import { useState, useEffect, type ComponentType } from 'react'
import { GeneralBoard } from './components/general/GeneralBoard'
import { BaseballTab } from './components/baseball/BaseballTab'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useUiStore, MODES, type ModeKey } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'

const BOARDS: Record<ModeKey, ComponentType> = {
  general: GeneralBoard,
  baseball: BaseballTab,
}

export default function App() {
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const theme = useSettingsStore((s) => s.theme)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)

  // 테마를 document에 반영
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const Board = BOARDS[mode] ?? GeneralBoard

  return (
    <div className="app">
      <main className="content">
        <Board />
      </main>

      {/* 좌상단: 모드 드롭다운 */}
      <div className="mode-menu">
        <button
          type="button"
          className="float-btn mode-switch"
          onClick={() => setModeOpen((o) => !o)}
        >
          모드 ▾
        </button>
        {modeOpen && (
          <>
            <div className="mode-overlay" onClick={() => setModeOpen(false)} />
            <div className="mode-dropdown">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`mode-item ${mode === m.key ? 'active' : ''}`}
                  onClick={() => {
                    setMode(m.key)
                    setModeOpen(false)
                  }}
                >
                  {m.label}
                  {mode === m.key && <span className="mode-check">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 우상단: 설정 (톱니바퀴) */}
      <button
        type="button"
        className="float-btn gear"
        onClick={() => setSettingsOpen(true)}
        aria-label="설정"
        title="설정"
      >
        ⚙
      </button>

      {/* 설정 팝업 */}
      {settingsOpen && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setSettingsOpen(false)}
        >
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              <h2>설정</h2>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setSettingsOpen(false)}
              >
                닫기 ✕
              </button>
            </div>
            <div className="settings-modal-body">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
