import type { ReactNode } from 'react'
import type { TextSpan } from '../types'

export function renderColoredText(
  text: string,
  spans: TextSpan[] | undefined
): ReactNode {
  if (!spans || spans.length === 0) return text

  const sorted = spans
    .filter(s => s.start < s.end && s.start >= 0 && s.end <= text.length)
    .sort((a, b) => a.start - b.start)

  if (sorted.length === 0) return text

  const parts: ReactNode[] = []
  let pos = 0

  for (let i = 0; i < sorted.length; i++) {
    const span = sorted[i]
    const start = Math.max(span.start, pos)
    const end = span.end

    if (start >= end) continue

    if (pos < start) {
      parts.push(text.slice(pos, start))
    }
    parts.push(
      <span key={`${start}-${end}`} style={{ color: span.color }}>
        {text.slice(start, end)}
      </span>
    )
    pos = end
  }

  if (pos < text.length) {
    parts.push(text.slice(pos))
  }

  return parts
}

export function applySpan(spans: TextSpan[], newSpan: TextSpan): TextSpan[] {
  const result: TextSpan[] = []
  for (const span of spans) {
    if (span.end <= newSpan.start || span.start >= newSpan.end) {
      result.push(span)
    } else {
      if (span.start < newSpan.start) {
        result.push({ ...span, end: newSpan.start })
      }
      if (span.end > newSpan.end) {
        result.push({ ...span, start: newSpan.end })
      }
    }
  }
  result.push(newSpan)
  return result.sort((a, b) => a.start - b.start)
}

export function clearSpanRange(
  spans: TextSpan[],
  start: number,
  end: number
): TextSpan[] {
  if (start >= end) return spans
  const result: TextSpan[] = []
  for (const span of spans) {
    if (span.end <= start || span.start >= end) {
      result.push(span)
    } else {
      if (span.start < start) {
        result.push({ ...span, end: start })
      }
      if (span.end > end) {
        result.push({ ...span, start: end })
      }
    }
  }
  return result
}

export function adjustSpansOnTextChange(
  oldText: string,
  newText: string,
  spans: TextSpan[]
): TextSpan[] {
  if (spans.length === 0) return spans

  const oldLen = oldText.length
  const newLen = newText.length

  let prefixLen = 0
  while (
    prefixLen < oldLen &&
    prefixLen < newLen &&
    oldText[prefixLen] === newText[prefixLen]
  ) {
    prefixLen++
  }

  let suffixLen = 0
  while (
    suffixLen < oldLen - prefixLen &&
    suffixLen < newLen - prefixLen &&
    oldText[oldLen - 1 - suffixLen] === newText[newLen - 1 - suffixLen]
  ) {
    suffixLen++
  }

  const oldChangeStart = prefixLen
  const oldChangeEnd = oldLen - suffixLen
  const delta = newLen - oldLen
  const isPureInsertion = oldChangeStart === oldChangeEnd

  return spans
    .map(span => {
      if (span.end <= oldChangeStart) {
        return span
      }
      if (span.start >= oldChangeEnd) {
        return { ...span, start: span.start + delta, end: span.end + delta }
      }
      if (isPureInsertion) {
        return { ...span, end: span.end + delta }
      }
      return null
    })
    .filter((s): s is TextSpan => s !== null)
    .filter(s => s.start < s.end)
}
