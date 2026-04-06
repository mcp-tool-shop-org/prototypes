# Contributing to Claude Collaborate

Thank you for your interest in contributing! This project provides collaborative web-based interfaces for working with Claude.

## Development Setup

```bash
git clone https://github.com/mcp-tool-shop-org/claude-collaborate.git
cd claude-collaborate
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
```

## Running Locally

Start the development server:

```bash
python server.py
```

Then open your browser to `http://localhost:8877`

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check existing [issues](https://github.com/mcp-tool-shop-org/claude-collaborate/issues)
2. If not found, create a new issue with:
   - Clear description of the problem or feature
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior
   - Browser and OS information
   - Screenshots if relevant

### Contributing Code

1. **Fork the repository** and create a branch from `main`
2. **Make your changes**
   - Follow existing HTML/CSS/JavaScript conventions
   - Ensure Python code follows PEP 8
   - Test in multiple browsers
3. **Test your changes**
   - Test all interactive features
   - Verify WebSocket connections work
   - Check responsive layouts
4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issue numbers when applicable
5. **Submit a pull request**
   - Describe what your PR does and why
   - Include screenshots for UI changes
   - Link to related issues

## Project Structure

```
claude-collaborate/
├── server.py              # Main aiohttp server
├── ws_bridge.py           # WebSocket bridge
├── index.html             # Landing page
├── adventures/            # Adventure mode files
├── tests/                 # Test suite
├── .github/               # GitHub workflows
├── whiteboard.html        # Collaborative whiteboard
├── chess.html             # Chess interface
├── code-playground.html   # Code editor
├── github-toolkit.html    # GitHub integration
├── capture-viewer.html    # Screen capture viewer
└── template.html          # Base template
```

## Adding New Features

### Adding a New Interface

1. Create a new HTML file based on `template.html`
2. Implement the interface logic in JavaScript
3. Add WebSocket communication if needed
4. Style with CSS (maintain consistency)
5. Add to navigation in `index.html`
6. Update README with feature description
7. Add tests in `tests/`

### Extending WebSocket Bridge

1. Add new message types in `ws_bridge.py`
2. Implement handler functions
3. Update client-side JavaScript
4. Test message flow end-to-end
5. Document new message format

### Adding Server Endpoints

1. Add route in `server.py`
2. Implement handler function
3. Add error handling
4. Test endpoint thoroughly
5. Update API documentation

## Testing

Run tests with:

```bash
python -m pytest tests/
```

Or use the Makefile to run lint, typecheck, and tests together:

```bash
make verify
```

### Manual Testing Checklist

- [ ] All interfaces load without errors
- [ ] WebSocket connections establish properly
- [ ] Real-time collaboration works
- [ ] Responsive design on mobile/tablet
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Error handling displays user-friendly messages

## Code Quality

### Python Code
- Follow PEP 8 style guide
- Use type hints where appropriate
- Add docstrings to functions and classes
- Handle exceptions gracefully

### JavaScript Code
- Use modern ES6+ syntax
- Keep functions focused and small
- Add comments for complex logic
- Handle async operations properly

### HTML/CSS
- Use semantic HTML
- Maintain consistent styling
- Ensure accessibility (ARIA labels, keyboard navigation)
- Optimize for performance

## Design Principles

- **Real-time collaboration**: Minimize latency, ensure synchronization
- **User-friendly**: Intuitive interfaces, clear feedback
- **Responsive**: Work on all screen sizes
- **Reliable**: Handle errors gracefully, maintain connection
- **Extensible**: Easy to add new interfaces and features

## Common Tasks

### Adding WebSocket Communication

```javascript
// Client-side
const ws = new WebSocket('ws://localhost:8877/ws');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle message
};
```

```python
# Server-side (ws_bridge.py)
async def handle_message(ws: web.WebSocketResponse, data: dict):
    # Process message
    await ws.send_json(response)
```

### Styling Consistency

Use existing CSS variables and classes:
- Color scheme: Maintain brand colors
- Typography: Consistent font families and sizes
- Spacing: Use standardized margins/padding
- Components: Reuse existing button/input styles

## Browser Compatibility

Ensure compatibility with:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Minimize bundle sizes
- Lazy load images and resources
- Optimize WebSocket message frequency
- Use efficient DOM manipulation
- Profile and optimize slow operations

## Security

- Validate all user input
- Sanitize HTML to prevent XSS
- Use secure WebSocket connections (wss://) in production
- Implement rate limiting
- Handle authentication/authorization properly

## Deployment

The application can be deployed to various platforms:

### Local Deployment
```bash
python server.py
```

### A Note on Deployment
Claude Collaborate is a **local-first tool** designed for localhost use with Claude Code. Production deployment is not a supported use case, but if you experiment with it, consider a production WSGI server and reverse proxy.

## Documentation

When adding features:
- Update README.md
- Add inline code comments
- Update this CONTRIBUTING.md
- Create examples if needed

## Questions?

Open an issue or start a discussion in the [MCP Tool Shop](https://github.com/mcp-tool-shop-org) organization.
