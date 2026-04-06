<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

Gioco di strategia marittima incentrato sul commercio. Costruisci una carriera commerciale in cinque regioni attraverso l'arbitraggio delle rotte, i contratti, le infrastrutture, la finanza e la reputazione, il tutto direttamente dalla console. Non è richiesta alcuna conoscenza di Python.

## Installazione

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

Oppure, installate globalmente:

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

Disponibile anche tramite pip: `pip install portlight`

## Perché Portlight

La maggior parte dei giochi di commercio semplificano il commercio riducendolo a un numero che aumenta. Portlight considera il commercio come una disciplina commerciale:

- **I prezzi reagiscono alle tue transazioni.** Se scarichi grandi quantità di grano in un porto, il prezzo crolla. Ogni vendita modifica il mercato locale.
- **I porti hanno vere e proprie identità economiche.** Porto Novo produce grano a basso costo. Silk Haven esporta seta in grandi quantità. Queste sono caratteristiche strutturali, non casuali.
- **I viaggi comportano dei rischi.** Tempeste, pirati, ispezioni, pericoli stagionali. Le tue provviste, lo scafo e l'equipaggio sono importanti.
- **I contratti richiedono prove.** Consegna le merci giuste al porto giusto entro la scadenza. La provenienza viene tracciata.
- **Le infrastrutture cambiano il modo in cui fai commercio.** I magazzini stoccano le merci. I broker migliorano i contratti. Le licenze sbloccano l'accesso a servizi premium.
- **La reputazione apre e chiude le porte.** Fiducia commerciale, controlli doganali, posizione regionale e contatti nel sottobosco: quattro fattori che influenzano ciò che puoi fare e dove.
- **Il gioco tiene conto di ciò che hai costruito.** La tua storia commerciale, le infrastrutture, la reputazione e le rotte formano un profilo di carriera. Quattro percorsi di vittoria distinti, basati sul tipo di commerciante che sei diventato.

## Il Mondo

Cinque regioni. Venti porti. Quaranta-tre rotte. Un'economia vivente.

| Regione | Porti | Personaggio |
|--------|-------|-----------|
| **Mediterranean** | Porto Novo, Al-Manar, Silva Bay, Corsair's Rest | Grano, legname, mercati delle spezie. Acque iniziali sicure. |
| **North Atlantic** | Ironhaven, Stormwall, Thornport | Ferro, armi, commercio militare. Controlli rigorosi. |
| **West Africa** | Sun Harbor, Palm Cove, Iron Point, Pearl Shallows | Cotone, rum, perle. Provviste più economiche. |
| **East Indies** | Jade Port, Monsoon Reach, Silk Haven, Crosswind Isle, Dragon's Gate, Spice Narrows | Seta, spezie, porcellana, tè. Margini più alti. Rischio dei monsoni. |
| **South Seas** | Ember Isle, Typhoon Anchorage, Coral Throne | Perle, medicinali. Acque di fine gioco più remote. |

134 PNG (personaggi non giocanti) nominati in ogni porto. Quattro fazioni pirata che controllano diverse aree. Condizioni meteorologiche stagionali che modificano i pericoli e la domanda. Un livello culturale con feste, superstizioni e morale dell'equipaggio.

## Nove Capitani

| Capitano | Base | Vantaggio | Compromesso |
|---------|------|------|-----------|
| **Merchant** | Porto Novo | Prezzi migliori, la fiducia cresce rapidamente | Penalità di "calore" raddoppiate |
| **Smuggler** | Corsair's Rest | Mercato nero, commercio di contrabbando | Maggiore "calore", più ispezioni |
| **Navigator** | Monsoon Reach | Navi più veloci, maggiore autonomia | Posizione iniziale più debole |
| **Privateer** | Ironhaven | Combattimento navale, vantaggio negli abbordaggi | Scarsa reputazione commerciale |
| **Corsair** | Corsair's Rest | Equilibrio tra combattimento e commercio | Maestro di nulla |
| **Scholar** | Jade Port | Vantaggio informativo, contratti migliori | Capitale iniziale basso, fragile |
| **Merchant Prince** | Porto Novo | Alto capitale iniziale, accesso premium | Tariffe più alte, bersaglio dei pirati |
| **Dockhand** | Crosswind Isle | Equipaggio più economico, tenace | Capitale iniziale più basso |
| **Bounty Hunter** | Stormwall | Maestria nel combattimento, posizione nella fazione | Prezzi bassi, diffidenza |

## Avvio rapido

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## Sistemi

**Economia** — Prezzi guidati dalla scarsità in 20 porti, 18 merci, 43 rotte. Le penalità per l'eccesso di offerta puniscono lo "scarico" di grandi quantità. I modificatori regionali della domanda significano che ogni porto ha una chiara identità di importazione/esportazione.

**Viaggi** — Viaggi di più giorni che includono condizioni meteorologiche, incontri con pirati e ispezioni. Le provviste si consumano quotidianamente. Lo scafo subisce danni. Le zone pericolose stagionali modificano le rotte sicure.

**Contratti** — Sei famiglie legate da fiducia e prestigio. Approvvigionamento, rimedi alla carenza, beni di lusso discreti, trasporto di ritorno, circuiti e commissioni di fazioni. Scadenze reali, conseguenze reali.

**Reputazione** — Quattro aspetti: prestigio regionale, fiducia commerciale, attenzione delle autorità doganali e legami con il sottobosco. Diversi capitani adottano diverse "economie" morali.

**Combattimento** — Combattimento personale (triangolo delle posizioni) con 7 armi da mischia, 7 armi a distanza e stili di combattimento regionali. Combattimento navale con abbordaggi e cannoni.

**Fazioni Pirata** — Crimson Tide, Iron Wolves, Deep Reef Brotherhood, Monsoon Syndicate. Ognuna con il proprio territorio, capitani nominati e atteggiamento nei vostri confronti.

**Infrastrutture** — Magazzini, uffici di broker, licenze. Manutenzione reale. Ognuna modifica i tempi, la portata o l'accesso al commercio.

**Finanza** — Assicurazioni e credito. Leva finanziaria con conseguenze.

**Compagni** — Cinque ruoli di ufficiale con personalità, morale e fattori scatenanti per la partenza.

**Carriera** — 27 tappe fondamentali. 13 etichette di profilo. Quattro percorsi di vittoria: Casa Commerciale Legale, Rete Ombra, Portata Oceanica, Impero Commerciale.

## Percorsi di Vittoria

- **Casa Commerciale Legale** — Alta fiducia, contratti premium, reputazione impeccabile, vasta infrastruttura.
- **Rete Ombra** — Margini di lusso sotto controllo, gestione del rischio, operazioni resilienti.
- **Portata Oceanica** — Accesso alle Indie Orientali, infrastrutture distanti, padronanza delle rotte.
- **Impero Commerciale** — Infrastrutture ovunque, diversificazione delle entrate, leva finanziaria.

## Come Funziona Questo Pacchetto

Questo pacchetto scarica il file binario precompilato di Portlight per la vostra piattaforma da GitHub Releases e lo memorizza localmente. Non è necessaria l'installazione di Python.

| Considerazioni | Dettagli |
|---------|--------|
| **Network** | Solo HTTPS verso il CDN di `github.com` |
| **Filesystem** | Solo cache utente (`~/.cache/mcptoolshop/portlight/`) |
| **Verification** | Controllo del checksum SHA256 ad ogni download |
| **Telemetry** | Nessuno |
| **Platforms** | Windows (x64), macOS (x64/arm64), Linux (x64) |

## Sicurezza

- Scarica i file binari esclusivamente da `github.com` tramite HTTPS
- Verifica del checksum SHA256 ad ogni download
- Scrive solo nella directory di cache specifica dell'utente: non tocca mai le directory di sistema
- Nessuna telemetria, nessun segreto, nessuna credenziale memorizzata
- Nessun accesso alla rete oltre al download iniziale del file binario

Consultare [SECURITY.md](SECURITY.md) per la politica completa.

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
