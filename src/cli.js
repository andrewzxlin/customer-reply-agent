#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CustomerReplyWorkflow, renderMarkdown } from "./workflow.js";

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = loadInput(args);
  const state = new CustomerReplyWorkflow().run(input, { tone: args.tone });
  const report = args.format === "json" ? JSON.stringify(state, null, 2) : renderMarkdown(state);

  if (args.output) {
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, report, "utf8");
  } else {
    process.stdout.write(`${report}\n`);
  }
}

function parseArgs(argv) {
  const args = { input: "", file: "", format: "markdown", output: "", tone: "firm" };
  const rest = [];

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--file") {
      args.file = argv[++index];
    } else if (item === "--format") {
      args.format = argv[++index];
    } else if (item === "--output") {
      args.output = argv[++index];
    } else if (item === "--tone") {
      args.tone = argv[++index];
    } else {
      rest.push(item);
    }
  }

  if (!["markdown", "json"].includes(args.format)) {
    throw new Error("--format must be markdown or json");
  }
  args.input = rest.join(" ");
  return args;
}

function loadInput(args) {
  if (args.input && args.file) {
    throw new Error("Use either positional input or --file, not both.");
  }
  if (args.file) {
    return readFileSync(args.file, "utf8");
  }
  if (args.input) {
    return args.input;
  }
  throw new Error("Missing input. Pass text or --file.");
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
