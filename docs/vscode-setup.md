# VS Code Setup Guide

Complete VS Code configuration for the Enterprise RBI Compliance Management Platform development environment.

## 🚀 Quick Setup

### 1. Install VS Code
Download and install VS Code from [https://code.visualstudio.com/](https://code.visualstudio.com/)

### 2. Install Recommended Extensions
Open the project in VS Code and install the recommended extensions:

```bash
# Open project in VS Code
code .

# VS Code will prompt to install recommended extensions
# Click "Install All" when prompted
```

Or install manually using the Command Palette (`Ctrl+Shift+P`):
```
ext install ms-vscode.vscode-typescript-next
ext install esbenp.prettier-vscode
ext install dbaeumer.vscode-eslint
ext install ms-python.python
ext install ms-azuretools.vscode-docker
```

## 📦 Essential Extensions

### TypeScript/JavaScript Development
- **TypeScript Importer** - Auto import TypeScript modules
- **Prettier** - Code formatter
- **ESLint** - JavaScript/TypeScript linter
- **Tailwind CSS IntelliSense** - Tailwind CSS class suggestions
- **Auto Rename Tag** - Automatically rename paired HTML/JSX tags
- **Path Intellisense** - File path autocompletion

### Python Development (AI Services)
- **Python** - Python language support
- **Black Formatter** - Python code formatter
- **Pylint** - Python linter
- **Jupyter** - Jupyter notebook support
- **Python Type Checker** - Type checking for Python

### Docker & Containers
- **Docker** - Docker support and management
- **Remote - Containers** - Develop inside containers
- **Kubernetes** - Kubernetes cluster management

### Database Tools
- **PostgreSQL** - PostgreSQL database client
- **MongoDB** - MongoDB database client
- **Redis** - Redis client and management

### Git & Version Control
- **GitLens** - Enhanced Git capabilities
- **GitHub Pull Requests** - GitHub integration
- **GitHub Copilot** - AI-powered code suggestions

### API Development
- **REST Client** - Test REST APIs directly in VS Code
- **OpenAPI (Swagger) Editor** - OpenAPI/Swagger support
- **YAML** - YAML language support

### Productivity
- **Material Icon Theme** - File and folder icons
- **Material Theme** - VS Code theme
- **Better Comments** - Enhanced comment highlighting
- **Todo Tree** - TODO/FIXME highlighting
- **Bookmarks** - Code bookmarking

## ⚙️ Configuration

### Workspace Settings
The project includes pre-configured workspace settings in `.vscode/settings.json`:

- **Auto-formatting** on save with Prettier
- **ESLint** auto-fix on save
- **Import organization** on save
- **Python** formatting with Black
- **File exclusions** for build artifacts
- **TypeScript** enhanced IntelliSense

### Debug Configuration
Pre-configured debug configurations in `.vscode/launch.json`:

- **Debug individual services** (Node.js/TypeScript)
- **Debug AI/ML services** (Python/FastAPI)
- **Debug frontend** (Next.js)
- **Debug tests** (Jest/Pytest)
- **Attach to Docker containers**

### Tasks
Automated tasks in `.vscode/tasks.json`:

- **Build all services**
- **Run tests**
- **Start development environment**
- **Lint and format code**
- **Database operations**

### Code Snippets
Custom code snippets in `.vscode/snippets.code-snippets`:

- **Express route handlers**
- **Service classes**
- **Database models**
- **React components**
- **FastAPI endpoints**
- **Test cases**

## 🔧 Keyboard Shortcuts

### Essential Shortcuts
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+P` - Quick Open File
- `Ctrl+Shift+F` - Search in Files
- `Ctrl+`` ` - Toggle Terminal
- `F5` - Start Debugging
- `Ctrl+Shift+D` - Debug View

### Custom Shortcuts
- `Ctrl+Shift+T` - Run All Tests
- `Ctrl+Shift+B` - Build All Services
- `Ctrl+Shift+R` - Restart Development Environment

## 🐛 Debugging

### Backend Services (Node.js)
1. Set breakpoints in TypeScript files
2. Press `F5` or use Debug view
3. Select service to debug
4. Debug session starts with hot reload

### AI/ML Services (Python)
1. Set breakpoints in Python files
2. Select "Debug AI/ML Services" configuration
3. FastAPI server starts in debug mode
4. Supports hot reload and breakpoint debugging

### Frontend (Next.js)
1. Set breakpoints in React components
2. Select "Debug Next.js Frontend" configuration
3. Browser opens with debugger attached
4. Debug both client and server-side code

### Docker Containers
1. Start services with `docker-compose up`
2. Use "Attach to Docker Container" configuration
3. Debug running containers

## 🧪 Testing Integration

### Running Tests
- **All tests**: `Ctrl+Shift+T` or use Test Explorer
- **Current file**: Right-click → "Run Tests"
- **Debug tests**: Use debug configurations

### Test Coverage
- Coverage reports generated automatically
- View coverage in editor gutters
- HTML reports in `coverage/` directory

## 📊 Performance Monitoring

### Built-in Tools
- **Performance profiler** for Node.js services
- **Memory usage** monitoring
- **CPU profiling** for optimization

### Extensions
- **Import Cost** - Show import sizes
- **Bundle Analyzer** - Webpack bundle analysis
- **Performance Monitor** - Real-time metrics

## 🔐 Security Features

### Code Security
- **Security vulnerability scanning** with Snyk
- **Dependency audit** integration
- **Secret detection** in code

### Best Practices
- **Auto-save** disabled for sensitive files
- **Git hooks** for pre-commit security checks
- **Environment variable** validation

## 🎨 Customization

### Themes
Recommended themes for development:
- **Material Theme Ocean High Contrast** (default)
- **One Dark Pro**
- **Dracula Official**

### Fonts
Recommended fonts:
- **Fira Code** (with ligatures)
- **JetBrains Mono**
- **Cascadia Code**

### Layout
- **Side Panel** for file explorer
- **Bottom Panel** for terminal and problems
- **Minimap** enabled for large files
- **Breadcrumbs** for navigation

## 🚨 Troubleshooting

### Common Issues

#### TypeScript Errors
```bash
# Restart TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

#### Python Environment
```bash
# Select correct Python interpreter
Ctrl+Shift+P → "Python: Select Interpreter"
# Choose: ./ai-services/venv/bin/python
```

#### Extension Conflicts
```bash
# Disable conflicting extensions
# Check Extensions view for conflicts
```

#### Performance Issues
```bash
# Exclude large directories from file watcher
# Update .vscode/settings.json "files.watcherExclude"
```

### Reset Configuration
```bash
# Remove VS Code settings
rm -rf .vscode/settings.json

# Reinstall extensions
code --list-extensions | xargs -L 1 echo code --uninstall-extension
```

## 📚 Additional Resources

### Documentation
- [VS Code Documentation](https://code.visualstudio.com/docs)
- [TypeScript in VS Code](https://code.visualstudio.com/docs/languages/typescript)
- [Python in VS Code](https://code.visualstudio.com/docs/languages/python)
- [Debugging in VS Code](https://code.visualstudio.com/docs/editor/debugging)

### Extensions Marketplace
- [VS Code Extensions](https://marketplace.visualstudio.com/vscode)
- [Extension Development](https://code.visualstudio.com/api)

### Community
- [VS Code GitHub](https://github.com/microsoft/vscode)
- [VS Code Discord](https://discord.gg/vscode)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/visual-studio-code)

---

**VS Code Setup Complete** ✅

Your development environment is now fully configured for the Enterprise RBI Compliance Management Platform with:
- ✅ All essential extensions installed
- ✅ Workspace settings optimized
- ✅ Debug configurations ready
- ✅ Code snippets available
- ✅ Tasks automated
- ✅ Testing integrated
- ✅ Security features enabled

Happy coding! 🚀
