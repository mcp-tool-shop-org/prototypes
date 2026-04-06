# WebSketch Extension

Chrome extension for one-click web page capture in [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) format.

## What it does

WebSketch Extension captures the DOM tree of any web page -- structure, styles, bounds, and metadata -- and copies the result to your clipboard as a single JSON document. The output conforms to the WebSketch IR specification, so it can be validated, rendered, or fed into downstream tools without manual cleanup.

## Quick start

1. Build and load the extension from source (see the [README](https://github.com/mcp-tool-shop-org/websketch-extension#installation))
2. Navigate to any web page and click the WebSketch icon in the toolbar
3. Click **Capture Current Page** -- the JSON is copied to your clipboard
4. Validate with `websketch validate capture.json` or paste into the [demo site](https://mcptoolshop.com)

## Key features

- One-click capture of full DOM trees with computed styles and element bounds
- Automatic clipboard copy for fast integration with other tools
- Configurable limits for depth, node count, and string length
- Warning banners when a capture is truncated
- Lightweight build with no runtime dependencies beyond the Chrome extension APIs

## Links

- [Source code](https://github.com/mcp-tool-shop-org/websketch-extension)
- [WebSketch IR specification](https://github.com/mcp-tool-shop-org/websketch-ir)
- [Issue tracker](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
