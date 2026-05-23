import { useState, useRef } from 'react'

function normalizeHex(raw: string): string | null {
  const s = raw.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase()
  }
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase()
  }
  return null
}

interface HexColorInputProps {
  value: string
  onChange: (hex: string) => void
  className?: string
}

export function HexColorInput({ value, onChange, className = '' }: HexColorInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = focused ? localValue : value

  const commit = () => {
    const normalized = normalizeHex(localValue)
    if (normalized && normalized !== value.toLowerCase()) {
      onChange(normalized)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => {
        setLocalValue(value)
        setFocused(true)
      }}
      onBlur={() => {
        setFocused(false)
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
          inputRef.current?.blur()
        }
      }}
      className={`font-mono text-xs text-dim bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded px-1.5 py-0.5 w-[4.5rem] focus:outline-none focus:border-indigo-400 transition-colors ${className}`}
    />
  )
}
