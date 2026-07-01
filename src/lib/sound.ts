// Web Audio 기반 효과음 — 외부 파일 없이 즉시 재생
let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function blip(freqs: number[], duration: number, type: OscillatorType) {
  const ac = getCtx()
  const now = ac.currentTime
  const gain = ac.createGain()
  gain.connect(ac.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freqs[0], now)
  freqs.slice(1).forEach((f, i) => {
    osc.frequency.exponentialRampToValueAtTime(
      f,
      now + (duration * (i + 1)) / freqs.length
    )
  })
  osc.connect(gain)
  osc.start(now)
  osc.stop(now + duration)
}

/** 단일 음 (시작 시각 오프셋·게인·길이 지정) */
function note(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType,
  peak = 0.3
) {
  const ac = getCtx()
  const now = ac.currentTime + at
  const gain = ac.createGain()
  gain.connect(ac.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  osc.connect(gain)
  osc.start(now)
  osc.stop(now + dur)
}

/** 득점: 밝게 올라가는 음 */
export function playScore() {
  blip([523.25, 783.99], 0.18, 'triangle') // C5 → G5
}

/** 감점: 낮게 내려가는 음 */
export function playMinus() {
  blip([392, 261.63], 0.22, 'sawtooth') // G4 → C4
}

/** 스트라이크: 짧고 날카로운 고음 틱 */
export function playStrike() {
  note(1318.51, 0, 0.09, 'square', 0.22) // E6 짧게
}

/** 볼: 부드럽고 낮은 단음 */
export function playBall() {
  note(329.63, 0, 0.16, 'sine', 0.3) // E4 둥글게
}

/** 파울: 빠른 2연타(삐빅) */
export function playFoul() {
  note(880, 0, 0.06, 'triangle', 0.22) // A5
  note(660, 0.07, 0.07, 'triangle', 0.22) // E5
}

/** 공수 전환: 좌우로 휙 도는 듯한 2음 (낮음→높음→낮음 느낌의 스윕) */
export function playSwitch() {
  blip([392, 659.25, 440], 0.32, 'triangle') // G4 → E5 → A4
}

/** 볼넷(출루): 가볍게 올라가는 2음 (타자에게 유리한 결과) */
export function playWalk() {
  note(587.33, 0, 0.12, 'sine', 0.28) // D5
  note(880, 0.12, 0.18, 'sine', 0.3) // A5
}

/** 타이머 종료: 주의를 끄는 반복 알람 (삐- 삐- 삐-) */
export function playTimeUp() {
  for (let i = 0; i < 4; i++) {
    note(988, i * 0.32, 0.18, 'square', 0.3) // B5
    note(988, i * 0.32 + 0.16, 0.001, 'square', 0.0001) // 짧은 간격
  }
}

/** 카운트다운 경고(30초~): 짧은 중간 톤 비프 */
export function playWarn() {
  note(660, 0, 0.12, 'sine', 0.22) // E5
}

/** 카운트다운 긴박(10초~): 높고 날카로운 더블 비프 */
export function playUrgent() {
  note(1046.5, 0, 0.09, 'square', 0.28) // C6
  note(1046.5, 0.12, 0.09, 'square', 0.28)
}

/** 아웃: 묵직하게 내려가는 3음 모티프 (가장 강조) */
export function playOut() {
  note(440, 0, 0.14, 'sawtooth', 0.32) // A4
  note(349.23, 0.13, 0.14, 'sawtooth', 0.32) // F4
  note(261.63, 0.26, 0.3, 'sawtooth', 0.36) // C4 길게
}
