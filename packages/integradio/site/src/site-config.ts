import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Integradio',
  description: 'Vector-embedded Gradio components for semantic codebase navigation',
  logoBadge: 'IR',
  brandName: 'Integradio',
  repoUrl: 'https://github.com/mcp-tool-shop-org/integradio',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Semantic UI',
    headline: 'Integradio',
    headlineAccent: 'semantic Gradio components.',
    description: 'Extend Gradio with vector embeddings. Components carry semantic intents — discoverable by meaning, not just IDs. Powered by Ollama and nomic-embed-text.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install integradio' },
      { label: 'Wrap', code: 'semantic(gr.Textbox(), intent="user enters search terms")' },
      { label: 'Search', code: 'demo.search("user input")' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Semantic intelligence for every Gradio component.',
      features: [
        { title: 'Semantic Search', desc: 'Find components by intent, not by ID or label. Vector embeddings via Ollama make every widget discoverable.' },
        { title: 'Non-Invasive', desc: 'Wrap any Gradio component with one function call. No subclassing, no forking — just semantic().' },
        { title: 'Page Templates', desc: '10 pre-built templates: Chat, Dashboard, Hero, Gallery, Analytics, DataTable, Form, Upload, Settings, Help.' },
        { title: 'Visualization', desc: 'Export component graphs as Mermaid diagrams, interactive D3.js, or ASCII art. See your dataflow at a glance.' },
        { title: 'FastAPI Routes', desc: 'One call to add_api_routes() gives you /search, /component, /graph, /trace, and /summary endpoints.' },
        { title: 'Local-First', desc: 'Embeddings via Ollama + nomic-embed-text on your GPU. No cloud APIs, no tokens, no latency.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install',
          code: 'pip install integradio\n\n# Pull embedding model\nollama pull nomic-embed-text\nollama serve',
        },
        {
          title: 'Wrap & search',
          code: 'from integradio import SemanticBlocks, semantic\nimport gradio as gr\n\nwith SemanticBlocks() as demo:\n    query = semantic(\n        gr.Textbox(label="Search"),\n        intent="user enters search terms"\n    )\n    demo.search("user input")  # Finds it!\n    demo.launch()',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'why',
      title: 'Why Integradio?',
      columns: ['Problem', 'Solution'],
      rows: [
        ['Gradio components are opaque to AI agents', 'Semantic intents make every widget discoverable'],
        ['Building dashboards from scratch every time', '10 pre-built page templates, ready to customize'],
        ['No programmatic access to component graphs', 'FastAPI routes + D3.js / Mermaid visualization'],
        ['Embedding logic scattered across your app', 'One wrapper, automatic vector storage'],
      ],
    },
    {
      kind: 'data-table',
      id: 'wrappers',
      title: 'Specialized Wrappers',
      subtitle: 'Rich semantic metadata for complex components.',
      columns: ['Wrapper', 'Component', 'Auto-Tags'],
      rows: [
        ['semantic_chatbot', 'Chatbot', 'conversation, ai, streaming, persona'],
        ['semantic_image_editor', 'ImageEditor', 'media, editor, inpainting, masking'],
        ['semantic_annotated_image', 'AnnotatedImage', 'annotation, bbox, detection'],
        ['semantic_highlighted_text', 'HighlightedText', 'nlp, ner, entity types'],
        ['semantic_multimodal', 'MultimodalTextbox', 'vision, multimodal, vlm'],
        ['semantic_plot', 'LinePlot/BarPlot', 'visualization, chart, timeseries'],
      ],
    },
    {
      kind: 'data-table',
      id: 'templates',
      title: 'Page Templates',
      subtitle: '10 ready-to-use layouts.',
      columns: ['Template', 'Use Case'],
      rows: [
        ['ChatPage', 'Conversational AI interface'],
        ['DashboardPage', 'KPI cards and activity feed'],
        ['HeroPage', 'Landing page with CTAs'],
        ['GalleryPage', 'Image grid with filtering'],
        ['AnalyticsPage', 'Charts and metrics'],
        ['DataTablePage', 'Editable data grid'],
        ['FormPage', 'Multi-step form wizard'],
        ['UploadPage', 'File upload with preview'],
        ['SettingsPage', 'Configuration panels'],
        ['HelpPage', 'FAQ accordion'],
      ],
    },
  ],
};
