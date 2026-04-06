<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Una ricevuta è un documento firmato, con timestamp, riproducibile che registra **ciò che è accaduto**:

- **Cosa è stato fatto** — azioni, input, output
- **Perché è stato fatto** — intento, politica, contesto
- **Chi/cosa lo ha fatto** — attore, esecutore, versioni degli strumenti
- **Prova che è successo** — hash, link, checksum, log
- **Come verificarlo** — comandi, istruzioni per la ripetizione

È possibile leggere una ricevuta in 30 secondi e verificarla in 2 minuti. Tutto è riproducibile. Se non lo è, non è una ricevuta.

## Pacchetti

| Pacchetto | Descrizione |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | Schema delle ricevute, canonicalizzazione, hashing SHA-256, API fluent builder |
| [`@receipt-factory/render`](packages/render) | Renderer Markdown e HTML standalone |
| [`@receipt-factory/verify`](packages/verify) | Validazione dello schema, integrità degli hash, verifica dei link, applicazione delle politiche |
| [`@receipt-factory/sign`](packages/sign) | Firme basate su Cosign — ricevute, politiche, bundle (sidecar separati) |
| [`@receipt-factory/evidence`](packages/evidence) | Pacchetti di prove — bundle di prove portabili e indirizzabili per contenuto |
| [`@receipt-factory/index`](packages/index) | Indice delle ricevute — scansione, ricerca e filtraggio di directory di ricevute |
| [`@receipt-factory/policy`](packages/policy) | Pacchetti di politiche — configurazione di lint portabile e con versioni |
| [`@receipt-factory/bundle`](packages/bundle) | Bundle di ricevute — capsule di verità auto-verificanti (zip) |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | Recupero dei dati di GitHub Actions tramite la CLI `gh` |
| [`@receipt-factory/cli`](apps/factory-cli) | Il comando `rf` — creazione, raccolta, rendering, verifica e firma delle ricevute |

## Pipeline

| Pipeline | Tipo di ricevuta | Cosa dimostra |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | È avvenuta una build/test CI con input e risultati specifici |
| [`release-receipts`](pipelines/release-receipts) | `release` | È stata pubblicata una release con asset e commit specifici |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | Cosa è stato pubblicato rispetto a ciò che è presente nel repository — classificazione della deriva |
| [`security-audit`](pipelines/security-audit) | `audit` | Cosa è stato scansionato, con quale strumento, quali vulnerabilità sono state rilevate |
| [`sbom`](pipelines/sbom) | `sbom` | Bill of materials software generato e attestato |

## Guida rapida

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## Livelli di fiducia

receipt-factory fornisce quattro livelli di fiducia sovrapponibili:

1. **Integrità della ricevuta** — ricevute indirizzabili tramite contenuto con hashing SHA-256 (resistenti alla manomissione)
2. **Integrità della governance** — regole di lint basate su politiche con file di politiche firmati
3. **Integrità del bundle** — bundle zip auto-verificanti con manifest di hash
4. **Autorità del bundle** — firme Cosign separate sui bundle (resistenti alla manomissione)

Ordine di verifica: firma → integrità del file → integrità semantica → governance.

## Cosa dimostra

- È avvenuta una build, un test, una release, un audit o la generazione di un SBOM in un momento specifico
- Gli input e gli output sono indirizzabili per contenuto e resistenti alla manomissione
- È possibile verificare nuovamente la ricevuta in qualsiasi momento con `rf verify`
- L'intera catena di provenienza è tracciabile con `rf graph`

## Cosa NON dimostra

- Che il codice sottostante sia corretto (le ricevute dimostrano il processo, non la qualità)
- Che l'ambiente CI stesso non sia stato compromesso (questo è un problema della catena di fornitura)
- Che gli artefatti non siano stati modificati dopo la creazione della ricevuta (utilizzare le firme per questo)

## Sicurezza

Consultare [SECURITY.md](SECURITY.md) per il modello di minaccia e le segnalazioni.

**Nessuna telemetria.** receipt-factory non invia mai dati, non traccia l'utilizzo né raccoglie analisi.

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
