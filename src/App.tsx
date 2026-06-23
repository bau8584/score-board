import { useState } from 'react'
import { GeneralBoard } from './components/general/GeneralBoard'
import { BaseballTab } from './components/baseball/BaseballTab'
import { SettingsPanel } from './components/settings/SettingsPanel'

type Tab = 'general' | 'baseball' | 'settings'

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: '일반' },
  { key: 'baseball', label: '야구' },
  { key: 'settings', label: '⚙ 설정' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('general')

  return (
    <div className="app">
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === 'general' && <GeneralBoard />}
        {tab === 'baseball' && <BaseballTab />}
        {tab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}
