export const COLOR_MAP: Record<string, string> = {
  빨강: '#e53935',
  파랑: '#1e88e5',
  초록: '#43a047',
  노랑: '#f9a825',
  보라: '#8e24aa',
  주황: '#fb8c00',
}

export const COLOR_NAMES = Object.keys(COLOR_MAP)

/** 색상명 → hex (없으면 회색 폴백) */
export function colorHex(name: string): string {
  return COLOR_MAP[name] ?? '#555555'
}

/** 색상 기반 자동 팀명: "빨강" → "빨강팀" */
export function autoTeamName(color: string): string {
  return `${color}팀`
}
