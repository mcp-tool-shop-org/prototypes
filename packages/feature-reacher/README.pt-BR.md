<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/feature-reacher/readme.png" alt="Feature-Reacher" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/feature-reacher/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Identifique recursos subutilizados antes que se tornem dívida técnica.**

O Feature-Reacher analisa os artefatos do seu produto (notas de lançamento, documentação, perguntas frequentes) e gera uma **Análise de Risco de Adoção**—uma lista classificada e baseada em evidências de recursos que os usuários podem nunca descobrir.

---

## O que é isso

Uma ferramenta de diagnóstico que:
- Importa documentação de produtos e notas de lançamento.
- Extrai menções de recursos com evidências.
- Avalia os recursos com base na novidade, visibilidade e densidade da documentação.
- Gera diagnósticos de risco de adoção acionáveis.

## O que isso NÃO é

- Uma plataforma de análise (não importa dados de uso).
- Um sistema de flags de recursos.
- Um painel conectado ao seu código-fonte.
- Uma inteligência artificial que adivinha o que os usuários querem.

Esta é uma **inteligência explicável**—cada diagnóstico vem com evidências citadas e um raciocínio claro.

---

## O que a Fase 1 oferece

- **Upload de Artefatos**: Cole texto ou carregue arquivos .txt/.md.
- **Extração de Recursos**: Títulos, listas de marcadores, frases repetidas.
- **Heurísticas de Pontuação**: Decaimento da novidade, sinais de visibilidade, densidade da documentação.
- **Motor de Diagnóstico**: 6 tipos de diagnóstico com sinais de gatilho e evidências.
- **Auditoria Classificada**: Recursos ordenados por risco de adoção.
- **Recomendações de Ação**: Ações copiáveis para cada diagnóstico.
- **Exportação**: Relatórios em texto simples e HTML imprimíveis.

## O que a Fase 2 adiciona (Repetibilidade e Retenção)

- **Histórico de Auditorias**: Todas as auditorias são salvas no IndexedDB, com opções de visualização, renomeação e exclusão.
- **Alternância de Salvamento Automático**: Execute auditorias uma vez e salve automaticamente (ou manualmente).
- **Conjuntos de Artefatos**: Coleções nomeadas para fluxos de trabalho de auditoria repetíveis.
- **Comparação de Auditorias**: Comparação lado a lado mostrando novos riscos resolvidos, alterações no diagnóstico.
- **Tendências de Recursos**: Visualização de gráfico de barras da trajetória de risco ao longo do tempo.
- **Relatório Executivo**: Resumo baseado em modelos para compartilhamento com parceiros (sem IA).
- **Pacote de Testes**: Jest + ts-jest com testes de proteção.

## O que a Fase 3 adiciona (Pronto para o Marketplace)

- **Página de Abertura Pública**: `/landing` com propostas de valor e chamadas para ação.
- **Modo de Demonstração**: `/demo` carrega automaticamente dados de amostra para uma experiência instantânea.
- **Páginas Legais**: Política de privacidade, termos de serviço, contato de suporte.
- **Painel de Tratamento de Dados**: Transparência sobre o armazenamento local com opção de exclusão.
- **Tour de Integração**: Tour guiado de 4 etapas para novos usuários.
- **Página de Metodologia**: `/methodology` explica a pontuação (sem exageros de IA).
- **Limites de Erro**: Experiência do usuário resistente a falhas com exportação de diagnóstico.
- **Utilitários de Acessibilidade**: Navegação por teclado, auxiliares ARIA, suporte para leitores de tela.
- **Recursos para o Marketplace**: Texto para listagem, documentos PDF, lista de verificação de envio.

## O que esta ferramenta INTENCIONALMENTE NÃO faz

- Conectar-se a plataformas de análise.
- Integrar-se com GitHub, Jira ou outras ferramentas.
- Usar modelos de ML para detecção de recursos.
- Fornecer monitoramento em tempo real.
- Requer autenticação ou contas.
- Usar IA para geração de texto (apenas modelos determinísticos).

Isso é por design. A Fase 3 comprova a prontidão para o marketplace antes de adicionar integrações.

---

## Como começar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Teste rápido

1. Cole algumas notas de lançamento ou documentação.
2. Clique em "Executar Auditoria".
3. Revise a lista de recursos classificada.
4. Expanda os recursos para ver as evidências e recomendações.
5. Exporte o relatório.

### Fluxos de trabalho da Fase 2

**Fluxo de Repetibilidade:**
1. Execute a auditoria → salva automaticamente no Histórico.
2. Vá para `/history` para visualizar as auditorias salvas.
3. Salve a coleção de artefatos para execuções repetidas.
4. Compare duas auditorias em `/compare`.
5. Visualize as tendências em `/trends`.

**Fluxo de Compartilhamento com Parceiros:**
1. Execute a auditoria → clique em "Exportar" → "Resumo Executivo".
2. Ou compare duas auditorias → "Exportar Relatório de Comparação".

---

## Estrutura do Projeto

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### Arquivos Principais

- `src/domain/feature.ts` - Modelo canônico de "feature" (característica).
- `src/domain/diagnosis.ts` - Tipos de diagnóstico e severidade.
- `src/analysis/extractor.ts` - Heurísticas de extração de "features".
- `src/analysis/scoring.ts` - Pontuação de relevância/visibilidade.
- `src/analysis/diagnose.ts` - Motor de diagnóstico.
- `src/analysis/ranking.ts` - Classificação de risco e geração de relatórios.
- `src/analysis/actions.ts` - Recomendações de ações.
- `src/analysis/export.ts` - Geração de relatórios e resumo executivo.
- `src/analysis/diff.ts` - Motor de comparação de relatórios.
- `src/analysis/trend.ts` - Análise de tendências de "features".
- `src/storage/types.ts` - Tipos de persistência.
- `src/storage/indexeddb.ts` - Implementação do IndexedDB.

---

## Arquitetura

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report + Actions
```

### Princípios de Design

1. **Sem "magia"**: Cada diagnóstico é explicável com evidências citadas.
2. **Heurísticas primeiro**: Nenhuma utilização de aprendizado de máquina (ML) até que as heurísticas se mostrem insuficientes.
3. **Determinístico**: A mesma entrada sempre produz a mesma saída.
4. **Transparente**: Os usuários podem rastrear qualquer conclusão até a fonte original.

---

## Licença

MIT

---

## Tags de Lançamento

```bash
git checkout phase-1-foundation    # Phase 1: Core diagnostic engine
git checkout phase-2-repeatability # Phase 2: Persistence, compare, trends
git checkout phase-3-marketplace   # Phase 3: Marketplace-ready packaging
git checkout phase-3.5-teams-tab   # Phase 3.5: Teams tab integration
```

## Executando Testes

```bash
npm test
```

Os testes verificam as restrições: pontuações de risco limitadas de 0 a 1, IDs de relatórios formatados corretamente, tratamento adequado de casos extremos.
