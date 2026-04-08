## Settings

| Setting | Default | What it does |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | Where Ollama is running |
| `polyglot.model` | `translategemma:12b` | Which model to use (12b = best quality, 2b = faster) |
| `polyglot.defaultSourceLanguage` | `en` | Source language for file translation |
| `polyglot.defaultLanguages` | 7 languages | Which languages to include in README translation |

### Tips

- If you have less than 12GB VRAM, try `translategemma:2b` — it's faster and lighter
- The model is downloaded automatically the first time you translate
- All translation happens locally — nothing leaves your machine
