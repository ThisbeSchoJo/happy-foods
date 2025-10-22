# happy-foods

MCP (Model Context Protocol) server for nutrition-to-mood analysis. Analyzes food items and predicts their effects on neurotransmitters (serotonin, dopamine, GABA, acetylcholine).

## Usage

### 1. **Command Line Interface (Easiest)**

```bash
# Analyze a food item
node cli.js analyze "matcha latte"
node cli.js analyze "chicken salad"
node cli.js analyze "dark chocolate"

# Predict neurochemistry from nutrients
node cli.js predict '{"protein_g": 20, "tryptophan_mg": 240}'

# Explain neurotransmitter effects
node cli.js explain '{"serotonin": 0.8, "dopamine": 0.6, "gaba": 0.4}'
```

### 2. **With AI Models (MCP Integration)**

For Claude Desktop, add to `~/.config/claude-desktop/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "happy-foods": {
      "command": "node",
      "args": ["/path/to/happy-foods/src/mcp-server.js"]
    }
  }
}
```

### 3. **Direct MCP Server**

```bash
npm start
```

The server runs on stdio and can be used by AI models that support MCP.

## Available Tools

- **analyze_meal**: Extract nutritional data from OpenFoodFacts
- **predict_neurochemistry**: Convert nutrients to neurotransmitter scores
- **explain_effects**: Generate human-friendly mood explanations
