import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CustomerReplyWorkflow, GuardrailStatus, Intents, renderMarkdown } from "../src/workflow.js";

const tests = [
  ["empty input is rejected", testEmptyInputIsRejected],
  ["refund case routes and drafts", testRefundCaseRoutesAndDrafts],
  ["unsafe case is blocked", testUnsafeCaseIsBlocked],
  ["markdown report includes approval and guardrails", testMarkdownReport],
  ["eval cases pass", testEvalCasesPass]
];

let failed = 0;

for (const [name, test] of tests) {
  try {
    test();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error.stack ?? error.message);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} tests passed`);
}

function testEmptyInputIsRejected() {
  assert.throws(() => new CustomerReplyWorkflow().run(""), /must not be empty/);
}

function testRefundCaseRoutesAndDrafts() {
  const input = readFileSync("examples/refund-case.txt", "utf8");
  const state = new CustomerReplyWorkflow().run(input);
  assert.equal(state.intent, Intents.REFUND);
  assert.ok(state.timeline.length >= 2);
  assert.ok(state.evidence.length >= 2);
  assert.ok(state.drafts.firm.includes("3 個工作天"));
}

function testUnsafeCaseIsBlocked() {
  const input = readFileSync("examples/unsafe-case.txt", "utf8");
  const state = new CustomerReplyWorkflow().run(input);
  assert.ok(state.guardrails.some((item) => item.status === GuardrailStatus.BLOCK));
  assert.ok(state.drafts.blocked);
}

function testMarkdownReport() {
  const state = new CustomerReplyWorkflow().run(readFileSync("examples/refund-case.txt", "utf8"));
  const report = renderMarkdown(state);
  assert.match(report, /## Guardrails/);
  assert.match(report, /## Human Approval Checklist/);
  assert.match(report, /## Failure Modes/);
}

function testEvalCasesPass() {
  const cases = JSON.parse(readFileSync("evals/eval_cases.json", "utf8"));
  const workflow = new CustomerReplyWorkflow();

  for (const evalCase of cases) {
    const state = workflow.run(evalCase.input);
    assert.equal(state.intent, evalCase.expected_intent, evalCase.name);
    const blocked = state.guardrails.some((item) => item.status === GuardrailStatus.BLOCK);
    assert.equal(blocked, evalCase.expected_blocked, evalCase.name);
  }
}
