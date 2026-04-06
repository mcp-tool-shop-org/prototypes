# Language Detection (Deterministic)

Detection MUST be deterministic and match across Windows/Linux.

## Priority order
1. Explicit override (user-selected language) always wins.
2. File extension mapping (imported files).
3. Heuristics fallback (only when extension is unknown).
4. Otherwise: `language = "text"`.

## Extension mapping (minimum set)
- .py -> python
- .cs -> csharp
- .java -> java
- .js -> javascript
- .ts -> typescript
- .sql -> sql
- .sh, .bash -> bash
- .rs -> rust
- .go -> go
- .kt -> kotlin
- .cpp, .cc, .cxx, .hpp -> cpp
- .c, .h -> c
- .json -> json
- .yml, .yaml -> yaml
- .md -> markdown

Apps may extend this list, but MUST NOT change existing mappings.

## Heuristics fallback (minimal + stable)
Used only when extension mapping fails. Order:
python, csharp, java, rust, sql, javascript, bash.
