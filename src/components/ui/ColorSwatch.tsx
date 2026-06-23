import { COLOR_NAMES, colorHex } from '../../lib/colors'

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
  /** 다른 팀이 이미 쓰는 색 (비활성 표시용, 선택은 허용) */
  disabledColor?: string
}

export function ColorSwatch({ value, onChange, disabledColor }: ColorSwatchProps) {
  return (
    <div className="swatch-row">
      {COLOR_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          className={`swatch ${value === name ? 'selected' : ''} ${
            disabledColor === name ? 'taken' : ''
          }`}
          style={{ background: colorHex(name) }}
          onClick={() => onChange(name)}
          aria-label={name}
          title={name}
        />
      ))}
    </div>
  )
}
