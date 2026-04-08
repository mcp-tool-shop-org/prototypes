# The MCP Tool Shop Ecosystem

The MCP Tool Shop is a federated ecosystem of tools, registries, and clients designed to make LLM-tool integration safe, discoverable, and predictable. At the center is this Registry, which serves as the immutable source of truth for tool metadata.

## Navigation Hub

- **Client**: [mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt) (The definitive package manager)
- **Registry**: [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) (This repo)
- **Explorer**: [Public Tool Explorer](https://mcp-tool-shop-org.github.io/mcp-tool-registry/) (Web UI)
- **Contract**: [Registry Contract](docs/contract.md) (Stability guarantees)

## If you are a specific persona...

### 🛠️ For Tool Authors

You want to get your tool in front of users and agents.

1. **Build** your tool adhering to the [Model Context Protocol](https://modelcontextprotocol.io).
2. **Validate** it locally using `mcpt check`.
3. **Submit** it to the registry: [Submitting a Tool](docs/submitting-tools.md).
4. **Maintain** it by tagging releases; the registry auto-updates from your metadata.

### 🧑‍💻 For Tool Users

You want to give your agent capabilities (filesystem, github, brave search) safely.

1. **Install** `mcpt`: `pip install mcpt`
2. **Discover** tools: `mcpt list` or brows the [Explorer](https://mcp-tool-shop-org.github.io/mcp-tool-registry/).
3. **Trust**: Rely on the **Trust Tiers** (🛡️ Trusted vs 🧪 Experimental) and **Risk Badges** (NET, EXEC) defined in the registry bundles.
4. **Run**: `mcpt run <tool>` handles environment isolation and permission flagging.

### 🤖 For Agent Developers

You want a reliable supply chain of tools for your AI product.

- Consume the **canonical artifact** (`registry.index.json`) directly.
- Respect the **Trust Tiers** to filter out experimental tools.
- Use the **AI Native Context** (`dist/registry.llms.txt`) to let your model browse the registry autonomously.
