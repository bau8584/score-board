import { useEffect } from 'react'

/** 앱이 화면에 보이는 동안 화면 꺼짐(절전)을 막는다. 미지원 브라우저에서는 조용히 무시. */
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen')
        if (cancelled) void l.release()
        else lock = l
      } catch {
        // 배터리 절약 모드 등으로 거부될 수 있음 — 무시
      }
    }
    // 탭이 다시 보이면 잠금이 풀려 있으므로 재요청
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [])
}
