# Gilded Ruin — Project Instructions

## File Editing: Prefer Python for Large Files

The Edit/Write tools can silently truncate files on the Windows/OneDrive mount — the file appears to save successfully but the tail is cut off, breaking JSX structure and causing cryptic tsc errors. This is most likely to happen on files longer than ~500 lines.

**Rules:**

1. **For files over ~500 lines, always use Python via bash.** This includes `ChatView.tsx` and `Stage.tsx`.

2. **For smaller files, Edit/Write tools are fine** — but always follow with `tsc --noEmit`.

3. **Always verify the replacement actually landed.** Silent `str.replace()` failures (no match found) are the main Python risk — the file gets written back unchanged with no error. Check explicitly:

```bash
python3 - << 'PYEOF'
path = "/sessions/ecstatic-friendly-faraday/mnt/Otome Game/rhino-mucus/src/path/to/File.tsx"
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

old = 'EXACT OLD STRING'
new = 'NEW STRING'

if old not in src:
    print("ERROR: old string not found — no changes made")
else:
    src = src.replace(old, new, 1)   # pass count=1 to avoid hitting duplicates
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src)
    print(f"Done. Lines: {src.count(chr(10)) + 1}")
PYEOF
```

4. **After every write, run tsc:**

```bash
cd "/sessions/ecstatic-friendly-faraday/mnt/Otome Game/rhino-mucus" && npx tsc --noEmit 2>&1
```

Silent exit = clean. Any output = stop and fix before proceeding.

## Bash Paths

- Repo root: `/sessions/ecstatic-friendly-faraday/mnt/Otome Game/rhino-mucus/`
- Public images: `/sessions/ecstatic-friendly-faraday/mnt/Otome Game/rhino-mucus/public/images/characters/`

## Project Overview

Cosmic horror otome dating sim built as a Chub.ai Stage extension. Adult-oriented; do not shy away from horror, body horror, violence, or mature themes.

Key files:
- `src/Stage.tsx` — StageBase subclass, beforePrompt / afterResponse hooks, arrival narration
- `src/components/ChatView.tsx` — full game UI, sprite panel, map overlay, message log (~930 lines)
- `src/components/MapView.tsx` — full-screen map overlay with room grid and presence portraits
- `src/data/locationRng.ts` — weighted RNG presence system, `buildMapPresence`
- `src/data/locationWeights.ts` — per-character per-room weights
- `src/types.ts` — all shared types including `LocationId`, `CharacterId`, `SaveType`
