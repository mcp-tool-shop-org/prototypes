<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/terminal-tutor/readme.png" width="400" alt="Terminal Tutor" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/terminal-tutor/actions"><img src="https://github.com/mcp-tool-shop-org/terminal-tutor/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/terminal-tutor/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

Apprenez les compétences liées au terminal en pratiquant directement dans le terminal, là où le travail se déroule réellement.

Terminal Tutor est un système de tutorat contextuel. Il crée un espace de travail sûr pour la pratique, vous propose une tâche réelle, surveille ce que vous tapez et vous explique ce qui s'est passé et pourquoi. Pas de bacs à sable, pas de quiz, pas de vidéos, juste un tuteur en direct dans votre terminal.

## Démarrage rapide

```bash
npx @mcptoolshop/terminal-tutor doctor    # Check what's ready
npx @mcptoolshop/terminal-tutor tracks    # See skill tracks
npx @mcptoolshop/terminal-tutor next      # Get your first lesson
npx @mcptoolshop/terminal-tutor start files-and-navigation
```

## Fonctionnement

1. **Vous choisissez une leçon.** Chaque leçon a un objectif concret, par exemple, "trouver tous les TODO dispersés dans ce code source", plutôt que simplement "apprendre grep".

2. **Le tuteur crée un espace de travail de pratique.** Fichiers réels, répertoires réels, dépôts Git réels. Vous travaillez sur une copie de sécurité, et non sur vos projets réels.

3. **Vous exécutez des commandes réelles.** Pas de simulation, pas de bac à sable. Des commandes `grep`, `git`, `sed`, `pip` réelles, selon les besoins de la leçon.

4. **Le tuteur évalue le résultat.** Les bons fichiers sont-ils apparus ? La sortie contient-elle les données attendues ? Il vérifie ce qui s'est passé, et non la commande exacte que vous avez tapée.

5. **S'il vous rencontrez des difficultés, il vous aide.** Les indications commencent par un conseil ("essayez de rechercher de manière récursive") et deviennent progressivement plus spécifiques ("essayez `grep -r 'TODO' src/`"). S'il détecte une erreur courante, il vous explique l'erreur spécifique.

6. **Votre progression est sauvegardée.** Vous pouvez revenir plus tard et reprendre là où vous vous étiez arrêté.

## Parcours de compétences

| Parcours | Leçons | Environnement d'exécution | Ce que vous apprendrez |
|-------|---------|---------|-------------------|
| **Shell Fundamentals** | 3 | shell | ls, cat, grep, find, sed, awk, diff, pipes |
| **Shell Triage** | 1 | shell | ps, tâches en arrière-plan, analyse des journaux |
| **Git Survival** | 1 | shell | init, commit, branch, switch |
| **Python Debugging** | 2 | venv | pytest, tracebacks, pip, imports, dépendances |
| **Service Debugging** | 1 | docker | logs, processus, configuration, points de terminaison |

## Environnements d'exécution

Terminal Tutor utilise trois environnements d'exécution, chacun choisi pour une raison spécifique :

- **shell** : Votre shell système. Pour la navigation dans les fichiers, le traitement de texte et Git. Démarrage instantané.
- **venv** : Un environnement virtuel Python réel. Pour pip, pytest et le débogage des importations. Crée un véritable environnement virtuel avec de vrais packages.
- **docker** : Un conteneur. Pour le dépannage des services, l'inspection des processus et tout ce qui nécessite un isolement complet. Le réseau est désactivé par défaut.

Exécutez la commande `terminal-tutor doctor` pour voir quels environnements d'exécution sont disponibles sur votre système.

## Référence de l'interface en ligne de commande (CLI)

```
terminal-tutor list                    Show available lessons
terminal-tutor start <lesson-id>       Start or resume a lesson
terminal-tutor tracks                  Show skill tracks and progress
terminal-tutor track <track-id>        Show detailed track progress
terminal-tutor next                    Suggest next lesson
terminal-tutor mastery <lesson-id>     Show fluency signal for completed lesson
terminal-tutor progress                Show all lesson progress
terminal-tutor doctor                  Check system readiness
terminal-tutor runtimes                Show runtime availability
terminal-tutor reset <lesson-id>       Reset a lesson
terminal-tutor help                    Show help
```

## Pour les utilisateurs de Claude Code

Terminal Tutor est conçu pour fonctionner avec Claude Code comme couche de conversation. Claude peut :
- Démarrer des leçons et présenter les étapes de manière naturelle.
- Exécuter des commandes et évaluer les résultats grâce au moteur du tuteur.
- Expliquer les erreurs dans le contexte, au-delà de ce que les indications fournies peuvent offrir.
- S'adapter aux questions ou aux approches inattendues.

L'interface en ligne de commande (CLI) produit une sortie JSON structurée, ce qui facilite la tâche pour Claude d'analyser l'état de la leçon, d'évaluer les résultats et de guider l'apprenant.

## Sécurité

Terminal Tutor fonctionne **uniquement localement**, sans télémétrie, sans appels réseau et sans gestion des identifiants.

- **Données consultées :** Répertoires de travail temporaires (répertoire temporaire du système d'exploitation), progression de la leçon (`~/.terminal-tutor/progress.json`).
- **Données NON consultées :** Vos projets, répertoire personnel, configurations système, données du navigateur, identifiants.
- **Aucune télémétrie** n'est collectée ou envoyée.
- **Isolement de l'espace de travail :** Les fichiers de pratique sont créés dans des répertoires temporaires isolés. L'indicateur de sécurité `workspace_only` empêche les commandes de s'échapper de l'espace de pratique. Les leçons Docker s'exécutent avec le réseau désactivé par défaut.
- **Permissions :** Lecture/écriture uniquement vers le répertoire temporaire du système d'exploitation et `~/.terminal-tutor/`. Aucun privilège élevés requis ou demandés.

Consultez le fichier [SECURITY.md](SECURITY.md) pour connaître la politique de signalement des vulnérabilités.

## Création de leçons

Consultez le fichier [AUTHORING.md](AUTHORING.md) pour connaître les principes de création des leçons. Règles essentielles :

- Un fichier YAML par leçon.
- Vérifications basées sur les résultats (vérifier ce qui s'est passé, et non quelle commande a été utilisée).
- Séquences d'indices allant de la direction vers la solution.
- Utilisez l'environnement d'exécution le plus léger qui répond aux besoins de la leçon.
- Chaque leçon doit avoir un "flavor" (une ambiance) : un scénario humain qui contextualise la leçon.

## Licence

MIT

---

Créé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
