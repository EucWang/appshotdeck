# Text Block Alignment Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix text alignment to be text-block-level alignment (shrink-to-fit + position) rather than per-line CSS textAlign on a full-width container.

**Architecture:** Two-layer CSS control — `alignItems` on flex container for block position, `textAlign` on each text div for line alignment within the block. Flex children auto shrink-to-fit when `alignItems` ≠ `stretch`.

**Tech Stack:** React, TypeScript, CSS Flexbox

**Scope:** Only `src/components/Canvas/SlideCanvas.tsx` — 7 edits, no other files.

---

## Problem Statement

Current implementation uses CSS `textAlign` on a **full-width** flex container. Each line of text is independently aligned within the container width. The text does NOT act as a cohesive visual block.

**Current (center, full-width container):**
```
        Line 1 short              ← independently centered
       Line 2 medium             ← independently centered
     Line 3 longest here         ← independently centered
```

**Expected (center, shrink-to-fit block):**
```
        Line 1 short
       Line 2 medium
     Line 3 longest here         ← all lines share edges, block centered
```

---

## Review Findings

### [严重] P0 — textAlign on full-width container is wrong

`SlideCanvas.tsx:623, 648` — `textAlign` on the flex column container has no effect on block positioning because the container is full-width and children stretch to fill it.

**Fix:** Use `alignItems` (flex cross-axis) for block positioning. When `alignItems` is not `stretch`, flex children auto shrink-to-fit to their content width (longest line). Then `textAlign` on each child div controls line alignment within that natural width.

Mapping:
| textAlign value | alignItems | Text div textAlign |
|----------------|------------|-------------------|
| `'left'` | `'flex-start'` | `'left'` |
| `'center'` | `'center'` | `'center'` |
| `'right'` | `'flex-end'` | `'right'` |

### [一般] P1 — Add `maxWidth: '100%'` as defensive measure

When `alignItems` changes from `stretch` to `flex-start/center/flex-end`, children are no longer forced to container width. While flex layout constrains children to container bounds, `maxWidth: '100%'` is a defensive safety net.

### [建议] P2 — headline/subtitle independent shrink-to-fit in center mode

In center mode, headline and subtitle each independently shrink-to-fit and center. If their widths differ significantly, their edges won't align vertically. This is acceptable for now (common in design tools). If needed later, add a `width: fit-content` wrapper around both.

---

## Consistency Check

| Check | Status |
|-------|--------|
| `TextAlign` type ↔ Slide interface `textAlign?: TextAlign` | ✅ Aligned |
| Slide field ↔ Store `defaultSlide: textAlign: 'center'` | ✅ Aligned |
| Store field ↔ `STYLE_FIELDS` includes `'textAlign'` | ✅ Aligned |
| Store fallback ↔ SlideCanvas `slide.textAlign ?? 'center'` | ✅ Aligned |
| TextPanel read ↔ `slide.textAlign ?? 'center'` | ✅ Aligned |
| i18n keys `text.align/align_left/align_center/align_right` ↔ en/es | ✅ Aligned |
| `applyStyleToAll` propagation | ✅ Included |
| Export path (relies on SlideCanvas DOM) | ✅ No separate text rendering |

## Omission Check

| Scenario | Assessment |
|----------|-----------|
| Fast clicks on alignment buttons | ✅ Zustand synchronous updates, no race condition |
| Old slides without `textAlign` field | ✅ `?? 'center'` fallback |
| Only headline shown, subtitle hidden | ✅ Flex single-child works normally |
| Rich text spans (colored highlights) | ✅ `renderColoredText` returns inline `<span>`, doesn't affect shrink-to-fit |
| `whiteSpace: 'pre-line'` multi-line | ✅ Wraps at newlines, shrink-to-fit uses longest line |
| Export PNG correctness | ✅ `export.ts` captures SlideCanvas DOM |
| 3D frame + WebGL composite export | ✅ Text is in DOM layer, WebGL only handles device frame |

## Over-Design Check

| Item | Assessment |
|------|-----------|
| No new types needed | ✅ Reuse existing `TextAlign` |
| No new store fields needed | ✅ Reuse existing `textAlign` |
| No new UI components needed | ✅ Reuse existing buttons |
| No headline/subtitle independent alignment | ✅ User confirmed shared |
| No wrapper div for headline+subtitle | ✅ P2 deferred |
| No extra defensive code beyond `maxWidth: '100%'` | ✅ Minimal |

---

## Change Impact Matrix

| Scenario | Before | After | Changed? |
|----------|--------|-------|----------|
| New slide center (portrait) | `textAlign: center` on full-width | `alignItems: center` + shrink + `textAlign: center` | Visual: tighter block |
| New slide center (landscape) | No textAlign (default left) on full-width | `alignItems: center` + shrink + `textAlign: center` | **Behavior change**: left → center |
| Old slide no field (portrait) | `?? 'center'` → textAlign center full-width | `?? 'center'` → alignItems center + shrink | Visual: tighter block |
| Old slide no field (landscape) | `?? 'center'` → textAlign center full-width | `?? 'center'` → alignItems center + shrink | **Behavior change**: left → center |
| Left alignment | textAlign left on full-width | alignItems flex-start + shrink + textAlign left | Nearly identical |
| Right alignment | textAlign right on full-width | alignItems flex-end + shrink + textAlign right | Nearly identical |
| Export PNG | Captures SlideCanvas DOM | Same, no extra logic | No change |

---

## Execution Steps

### Task 1: Add `alignItems` computed variable

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** After line 594 (`const textAlign = slide.textAlign ?? 'center'`)

**Change:**
```typescript
const textAlign = slide.textAlign ?? 'center'
const alignItems = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'
```

### Task 2: Landscape container — replace `textAlign` with `alignItems`

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** Line 623

**Change:**
```typescript
// Before:
textAlign,

// After:
alignItems,
```

### Task 3: Portrait container — replace `textAlign` with `alignItems`

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** Line 648

**Change:**
```typescript
// Before:
textAlign,

// After:
alignItems,
```

### Task 4: Landscape headline div — add `textAlign` + `maxWidth`

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** Line 627

**Change:**
```typescript
// Before:
<div style={{ fontSize: headlineSize, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal', lineHeight: 1.2, marginBottom: 24, color: slide.textColor, fontFamily: textFont, whiteSpace: 'pre-line' }}>

// After:
<div style={{ fontSize: headlineSize, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal', lineHeight: 1.2, marginBottom: 24, color: slide.textColor, fontFamily: textFont, textAlign, maxWidth: '100%', whiteSpace: 'pre-line' }}>
```

### Task 5: Landscape subtitle div — add `textAlign` + `maxWidth`

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** Line 632

**Change:**
```typescript
// Before:
<div style={{ fontSize: subtitleSize, fontWeight: subtitleWeight, fontStyle: subtitleItalic ? 'italic' : 'normal', lineHeight: 1.5, color: slide.subtitleColor, fontFamily: textFont, whiteSpace: 'pre-line' }}>

// After:
<div style={{ fontSize: subtitleSize, fontWeight: subtitleWeight, fontStyle: subtitleItalic ? 'italic' : 'normal', lineHeight: 1.5, color: slide.subtitleColor, fontFamily: textFont, textAlign, maxWidth: '100%', whiteSpace: 'pre-line' }}>
```

### Task 6: Portrait headline div — add `textAlign` + `maxWidth`

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** Line 653

**Change:**
```typescript
// Before:
<div style={{ fontSize: headlineSize, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: Math.round(H * 0.012), color: slide.textColor, fontFamily: textFont, whiteSpace: 'pre-line' }}>

// After:
<div style={{ fontSize: headlineSize, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: Math.round(H * 0.012), color: slide.textColor, fontFamily: textFont, textAlign, maxWidth: '100%', whiteSpace: 'pre-line' }}>
```

### Task 7: Portrait subtitle div — add `textAlign` + `maxWidth`

**File:** `src/components/Canvas/SlideCanvas.tsx`
**Location:** Line 658

**Change:**
```typescript
// Before:
<div style={{ fontSize: subtitleSize, fontWeight: subtitleWeight, fontStyle: subtitleItalic ? 'italic' : 'normal', lineHeight: 1.45, color: slide.subtitleColor, fontFamily: textFont, whiteSpace: 'pre-line' }}>

// After:
<div style={{ fontSize: subtitleSize, fontWeight: subtitleWeight, fontStyle: subtitleItalic ? 'italic' : 'normal', lineHeight: 1.45, color: slide.subtitleColor, fontFamily: textFont, textAlign, maxWidth: '100%', whiteSpace: 'pre-line' }}>
```

### Task 8: Verification

```bash
npm run build
npm run lint
```

Expected: Both pass with zero errors.

### Task 9: Visual verification checklist

- [ ] New slide, center alignment — text block centered as a cohesive unit
- [ ] Switch to left — block shifts left, lines share left edge
- [ ] Switch to right — block shifts right, lines share right edge
- [ ] Multi-line headline — shorter lines align to longest line's edge
- [ ] Rich text highlights — colored spans don't break block alignment
- [ ] Portrait format — alignment works with 7% margins
- [ ] Landscape format — alignment works with 5% margins
- [ ] Export PNG — alignment renders correctly in exported image
- [ ] Old saved slides without textAlign field — fallback to center
- [ ] Apply Style to All — alignment propagates correctly
