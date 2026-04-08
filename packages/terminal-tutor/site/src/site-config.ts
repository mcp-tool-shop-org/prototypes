import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Terminal Tutor',
  description: 'Learn terminal skills by doing — inside the terminal where the work actually happens.',
  logoBadge: 'TT',
  brandName: 'Terminal Tutor',
  repoUrl: 'https://github.com/mcp-tool-shop-org/terminal-tutor',
  npmUrl: 'https://www.npmjs.com/package/terminal-tutor',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Situated terminal coaching',
    headline: 'Terminal Tutor',
    headlineAccent: 'Learn by doing.',
    description: 'A live mentor in your shell. Real commands, real outcomes, real progression. No sandboxes, no quizzes, no videos.',
    primaryCta: { href: '#tracks', label: 'See the tracks' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Start', code: 'npx terminal-tutor doctor' },
      { label: 'Learn', code: 'npx terminal-tutor start files-and-navigation' },
      { label: 'Play', code: 'npx terminal-tutor start filesystem-salvage' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why Terminal Tutor',
      subtitle: 'Learn where the work happens.',
      features: [
        { title: 'Real Commands', desc: 'Every lesson runs actual grep, git, sed, pip, and docker commands. Not simulated, not sandboxed.' },
        { title: 'Outcome-Based', desc: 'Checks verify what happened, not which command you typed. Multiple valid solutions always work.' },
        { title: '3 Runtimes', desc: 'Shell for speed, venv for Python fidelity, Docker for containment. Each one truthful about what it provides.' },
        { title: 'Games', desc: 'Playable missions with win conditions, scoring, and replay. The terminal actions ARE the game mechanics.' },
        { title: '172 Tests', desc: 'End-to-end dogfood tests run real commands through real lessons. If a check is brittle, the tests catch it.' },
        { title: 'Mastery Signals', desc: 'Fluency ratings based on actual performance: clean, solid, or guided. Not badges — truth.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'tracks',
      title: 'Skill Tracks',
      cards: [
        { title: 'Shell Fundamentals', code: '# 3 lessons + 1 game\nfiles-and-navigation\npipes-and-search\nfile-surgery\nfilesystem-salvage  # game' },
        { title: 'Python Debugging', code: '# 2 lessons + 1 game\npython-debugging\ndependency-detective\ndependency-lab  # game' },
        { title: 'Service Debugging', code: '# 1 lesson + 1 game (Docker)\nservice-triage\nservice-siege  # game' },
        { title: 'Git Survival', code: '# 1 lesson\ngit-basics' },
      ],
    },
  ],
};
