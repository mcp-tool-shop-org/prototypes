# Extraction Rules (v1)

Conservative v1 extraction:
- If file <= 4000 chars: whole file is one CodeItem.
- Else: split by blank lines into blocks.
  - Keep blocks 200..2000 chars.
- If no blocks qualify: fallback to whole file.
