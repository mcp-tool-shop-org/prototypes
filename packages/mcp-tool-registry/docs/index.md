# MCP Tool Registry

The canonical metadata registry for all MCP Tool Shop tools.

## What is this?

`@mcptoolshop/mcp-tool-registry` is the single source of truth for tool metadata in the MCP Tool Shop ecosystem. It contains no executable code -- only JSON metadata describing every tool, validated against a strict schema and organized into installable bundles.

## Key resources

| Resource        | Link                                                                                                    |
| :-------------- | :------------------------------------------------------------------------------------------------------ |
| npm package     | [@mcptoolshop/mcp-tool-registry](https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry)          |
| Public Explorer | [mcp-tool-shop-org.github.io/mcp-tool-registry](https://mcp-tool-shop-org.github.io/mcp-tool-registry/) |
| Submit a Tool   | [Open an issue](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)               |
| mcpt CLI        | [mcp-tool-shop-org/mcpt](https://github.com/mcp-tool-shop-org/mcpt)                                     |
| MCP Tool Shop   | [mcp-tool-shop.github.io](https://mcp-tool-shop.github.io/)                                             |

## Documentation

- [Registry Guidelines](registry-guidelines.md) -- rules for adding tools
- [Submitting Tools](submitting-tools.md) -- step-by-step submission guide
- [Bundles](bundles.md) -- how tools are grouped into installable collections
- [Search](search.md) -- how the search index works
- [Versioning](versioning.md) -- SemVer policy and compatibility contract
- [Compatibility](compatibility.md) -- consumer compatibility matrix
- [Lifecycle](lifecycle.md) -- tool lifecycle and deprecation policy
- [Releasing](releasing.md) -- how releases are published
- [Contract](contract.md) -- the v1 stability contract

## Quick install

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
console.log(`${registry.tools.length} tools registered`)
```
