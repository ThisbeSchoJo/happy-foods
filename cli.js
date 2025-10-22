#!/usr/bin/env node
// Simple CLI wrapper for the MCP server
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
🍽️ Happy Foods CLI

Usage:
  node cli.js analyze "matcha latte"           # Analyze a food item
  node cli.js predict '{"protein_g": 20}'     # Predict neurochemistry from nutrients
  node cli.js explain '{"serotonin": 0.8}'    # Explain neurotransmitter effects

Examples:
  node cli.js analyze "chicken salad"
  node cli.js analyze "dark chocolate"
  `);
  process.exit(1);
}

const [command, ...commandArgs] = args;

if (command === "analyze") {
  const query = commandArgs.join(" ");
  if (!query) {
    console.error("❌ Please provide a food item to analyze");
    process.exit(1);
  }

  console.log(`🔍 Analyzing: ${query}`);

  // Step 1: Analyze the meal
  const analysisResult = await callTool("analyze_meal", { query });
  if (!analysisResult || !analysisResult.result) {
    console.error("❌ Failed to analyze meal");
    process.exit(1);
  }

  const nutrients = JSON.parse(analysisResult.result.content[0].text).nutrients;
  console.log(`\n🧠 Predicting neurochemistry...`);

  // Step 2: Predict neurochemistry
  const predictionResult = await callTool("predict_neurochemistry", {
    nutrients,
  });
  if (!predictionResult || !predictionResult.result) {
    console.error("❌ Failed to predict neurochemistry");
    process.exit(1);
  }

  const profile = JSON.parse(predictionResult.result.content[0].text);
  console.log(`\n💭 Explaining effects...`);

  // Step 3: Explain effects
  const explanationResult = await callTool("explain_effects", { profile });
  if (!explanationResult || !explanationResult.result) {
    console.error("❌ Failed to explain effects");
    process.exit(1);
  }

  const explanation = explanationResult.result.content[0].text;
  console.log(`\n🎯 Mood Analysis:`);
  console.log(explanation);
} else if (command === "predict") {
  const nutrientsJson = commandArgs.join(" ");
  if (!nutrientsJson) {
    console.error("❌ Please provide nutrients JSON");
    process.exit(1);
  }

  let nutrients;
  try {
    nutrients = JSON.parse(nutrientsJson);
  } catch (e) {
    console.error("❌ Invalid JSON for nutrients");
    process.exit(1);
  }

  console.log(`🧠 Predicting neurochemistry...`);
  await callTool("predict_neurochemistry", { nutrients });
} else if (command === "explain") {
  const profileJson = commandArgs.join(" ");
  if (!profileJson) {
    console.error("❌ Please provide profile JSON");
    process.exit(1);
  }

  let profile;
  try {
    profile = JSON.parse(profileJson);
  } catch (e) {
    console.error("❌ Invalid JSON for profile");
    process.exit(1);
  }

  console.log(`💭 Explaining effects...`);
  await callTool("explain_effects", { profile });
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.log("Available commands: analyze, predict, explain");
  process.exit(1);
}

async function callTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const server = spawn("node", ["src/mcp-server.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    server.stdin.write(JSON.stringify(request) + "\n");

    server.stdout.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => line.trim());
      lines.forEach((line) => {
        try {
          const response = JSON.parse(line);
          if (response.result) {
            resolve(response);
          }
        } catch (e) {
          // Ignore non-JSON output
        }
      });
    });

    server.stderr.on("data", (data) => {
      // Ignore server startup messages
    });

    server.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Clean up after 10 seconds
    setTimeout(() => {
      server.kill();
      resolve();
    }, 10000);
  });
}
