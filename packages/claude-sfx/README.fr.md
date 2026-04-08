<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-sfx"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-sfx" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Retour audio pour [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Chaque appel de fonction, modification de fichier, recherche, envoi vers Git et exécution d'agent produit un son distinct, synthétisé à partir de formules mathématiques, et non à partir de fichiers audio.

## Démarrage rapide

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

Voilà. Claude Code émettra désormais des sons pendant son fonctionnement.

## Pourquoi un retour audio ?

Lorsqu'un agent d'IA lit, écrit, effectue des recherches et déploie des éléments en votre nom, vous perdez de la visibilité. Vous vous contentez de regarder le texte défiler. Le retour audio rétablit la conscience :

- **Accessibilité** : écoutez les changements d'état, les erreurs et les confirmations sans avoir à surveiller le terminal.
- **Fluidité** : sachez qu'un test a réussi ou qu'une modification a été intégrée sans avoir à changer de contexte.
- **Présence** : l'agent vous semble être un collaborateur, et non une boîte noire.

## Les 7 verbes

Chaque action de Claude Code correspond à l'un des 7 verbes principaux. Les modificateurs (état, portée, direction) modifient le son sans rompre la cohérence.

| Verbe | Déclencheurs | Son |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | Onde sinusoïdale ascendante : quelque chose arrive. |
| **transform** | `Edit` | Impulsion texturée par modulation de fréquence : remodelage. |
| **commit** | `Write`, `NotebookEdit`, `git commit` | Sonnet net : confirmation. |
| **navigate** | `Grep`, `Glob` | Impulsion sonar : analyse. |
| **execute** | `Bash`, `npm test`, `tsc` | Explosion de bruit + tonalité : action mécanique. |
| **move** | `mv`, `cp`, création de sous-agent. | Sifflement de vent : déplacement d'air. |
| **sync** | `git push`, `git pull` | Sifflement dramatique + ancre tonale. |

### Modificateurs

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### Détection intelligente de Bash

Le gestionnaire de hooks analyse les commandes Bash pour choisir le son approprié :

| Commande Bash | Verbe | État |
|---|---|---|
| `git push` | sync (montée) | code de sortie |
| `git pull` | sync (descente) | code de sortie |
| `npm test`, `pytest` | exécution | code de sortie |
| `tsc`, `npm run build` | exécution | code de sortie |
| `mv`, `cp` | déplacement | — |
| `rm` | déplacement | avertissement |
| tout le reste | exécution | code de sortie |

## Profils

Palettes de sons qui modifient l'ensemble du comportement avec un seul paramètre.

| Profil | Comportement |
|---|---|
| **minimal** (default) | Tons sinusoïdaux : subtils, professionnels, pour une utilisation quotidienne. |
| **retro** | Bruits de 8 bits en forme de carré : amusants mais contrôlés. |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Profils personnalisés

Copiez `profiles/minimal.json`, modifiez les paramètres de synthèse, puis chargez-le :

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Chaque nombre dans le fichier JSON correspond directement au moteur de synthèse : forme d'onde, fréquence, durée, enveloppe (ADSR), profondeur de modulation de fréquence (FM), bande passante, gain.

## Prévention des nuisances

Ce qui distingue un produit d'un simple jouet.

| Fonctionnalité | Comportement |
|---|---|
| **Debounce** | Même verbe dans un délai de 200 ms → un seul son. |
| **Rate limit** | Maximum de 8 sons par fenêtre de 10 secondes. |
| **Quiet hours** | Tous les sons sont désactivés pendant les heures configurées. |
| **Mute** | Activation/désactivation instantanée, persiste après le redémarrage de la session. |
| **Volume** | Contrôle du gain de 0 à 100. |
| **Per-verb disable** | Désactivez les verbes spécifiques que vous ne souhaitez pas utiliser. |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Ambiance (opérations de longue durée)

Pour les commandes qui prennent du temps (compilations, déploiements, suites de tests volumineuses) :

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Sons de session

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## Toutes les commandes

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## Fonctionnement

Aucun fichier audio. Chaque son est synthétisé en temps réel à partir de formules mathématiques :

- **Oscillateurs** : sinusoïdale, carrée, en dents de scie, triangulaire, bruit blanc.
- **Enveloppes ADSR** : attaque, décroissance, maintien, relâchement.
- **Synthèse FM** : modulation de fréquence pour la texture.
- **Filtre à état variable** : bruit filtré en bande passante pour les sifflements.
- **Balayages de fréquence** : interpolation linéaire pour le mouvement.
- **Limiteur de volume** : compression "soft-knee", seuil maximum.

L'ensemble du système est constitué d'environ 2 800 lignes de TypeScript, sans aucune dépendance de production. Les sons sont générés sous forme de tampons PCM, encodés en WAV en mémoire, puis lus via le lecteur audio natif du système d'exploitation (PowerShell sous Windows, afplay sous macOS, aplay sous Linux).

## Sécurité et confidentialité

**Données modifiées :** `~/.claude-sfx/config.json` (préférences), `.claude/settings.json` (enregistrement des extensions). Les tampons audio sont générés en mémoire et ne sont jamais écrits sur le disque, sauf si vous exécutez la commande `export`.

**Données non modifiées :** code source, historique Git, réseau, identifiants, variables d'environnement. Aucune donnée de télémétrie n'est collectée ni envoyée. Aucun fichier audio n'est téléchargé ; chaque son est synthétisé localement à partir de calculs mathématiques.

**Autorisations :** lecture/écriture du système de fichiers pour la configuration et les extensions, invocation du lecteur audio du système d'exploitation. Consultez le fichier [SECURITY.md](SECURITY.md) pour connaître la politique complète.

## Prérequis

- Node.js 18+
- Claude Code
- Sortie audio du système (haut-parleurs ou casque)

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
