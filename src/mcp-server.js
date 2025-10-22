// =============================================================================
// REAL MCP SERVER - Happy Foods Nutrition Analysis
// =============================================================================
// This is a real MCP (Model Context Protocol) server that AI models can discover and use
// It uses the MCP SDK to implement the full MCP specification with JSON-RPC over stdio
// =============================================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import our existing business logic functions
import { analyzeMeal } from "./tools/analyzeMeal.js";
import { predictNeurochemistry } from "./tools/predictNeuro.js";
import { explainEffects } from "./tools/explainEffects.js";

// Create MCP server instance with server info
const server = new Server(
  {
    name: "happy-foods",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // This server provides tools
    },
  }
);

// Define our tools with proper MCP schemas
const tools = [
  {
    name: "analyze_meal",
    description:
      "Analyze a meal and extract nutritional data from OpenFoodFacts",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Food item to analyze (e.g., 'matcha latte', 'chicken salad')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "predict_neurochemistry",
    description: "Predict neurotransmitter effects based on nutritional data",
    inputSchema: {
      type: "object",
      properties: {
        nutrients: {
          type: "object",
          description: "Nutritional data object with various nutrients",
        },
      },
      required: ["nutrients"],
    },
  },
  {
    name: "explain_effects",
    description: "Explain neurotransmitter effects in human-friendly text",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          description:
            "Neurotransmitter profile with serotonin, dopamine, gaba, acetylcholine scores",
        },
      },
      required: ["profile"],
    },
  },
];

// Handle tool listing requests (MCP discovery)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

// Handle tool execution requests (MCP tool calls)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze_meal") {
    try {
      const result = await analyzeMeal(args.query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze meal: ${error.message}`);
    }
  }

  if (name === "predict_neurochemistry") {
    try {
      const profile = predictNeurochemistry(args.nutrients);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(profile, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to predict neurochemistry: ${error.message}`);
    }
  }

  if (name === "explain_effects") {
    try {
      const explanation = explainEffects(args.profile);
      return {
        content: [
          {
            type: "text",
            text: explanation,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to explain effects: ${error.message}`);
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the MCP server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Happy Foods MCP server running on stdio");
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exit(1);
});
