import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 추가할 모드는 여기 한 줄만 등록하면 됨 (예: { key: 'basketball', label: '농구' }) */
export const MODES = [
  { key: 'general', label: '일반' },
  { key: 'baseball', label: '야구' },
  { key: 'kinball', label: '킨볼' },
] as const

export type ModeKey = (typeof MODES)[number]['key']

const isValidMode = (m: string): m is ModeKey =>
  MODES.some((x) => x.key === m)

interface UiState {
  mode: ModeKey
  setMode: (m: ModeKey) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mode: 'general',
      setMode: (m) => set({ mode: m }),
    }),
    {
      name: 'ui-store',
      // 저장된 모드가 더 이상 존재하지 않으면 일반으로 복귀
      merge: (persisted, current) => {
        const p = persisted as Partial<UiState> | undefined
        const mode = p?.mode && isValidMode(p.mode) ? p.mode : current.mode
        return { ...current, ...p, mode }
      },
    }
  )
)
