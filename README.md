# Customer Reply Agent

[![Test](https://github.com/andrewzxlin/customer-reply-agent/actions/workflows/test.yml/badge.svg)](https://github.com/andrewzxlin/customer-reply-agent/actions/workflows/test.yml)

一個用來展示 **Agentic Workflow / LLM App Engineering** 能力的客服與申訴回覆專案。它會把使用者提供的客服對話、退款爭議或帳單問題整理成意圖分類、證據時間線、guardrail 檢查、回覆草稿與人工審核清單。

> 第一版不依賴外部 LLM API，使用 deterministic workflow，確保 clone 後能直接跑 demo 和 tests。之後可以把 routing、summary、draft generator 替換成真實 LLM provider。

## 這個專案展示什麼

- Intent routing
- Evidence timeline extraction
- Guardrails
- Tone-controlled reply drafts
- Human-in-the-loop approval package
- Failure modes
- Evals / regression tests
- 中文文件與架構說明

## Workflow

```text
Raw conversation / dispute notes
  -> Intent Router
  -> Evidence & Timeline Extractor
  -> Guardrail Checks
  -> Draft Generator
  -> Human Approval Package
  -> Final Report
```

## 快速開始

需要 Node.js 20+。

```bash
npm test
npm run demo
node src/cli.js --file examples/refund-case.txt --output outputs/report.md
```

輸出 JSON：

```bash
node src/cli.js --file examples/refund-case.txt --format json
```

測 unsafe guardrail：

```bash
node src/cli.js --file examples/unsafe-case.txt
```

## 測試

```bash
npm test
```

測試涵蓋：

- 空輸入防呆
- refund intent routing
- unsafe harassment block
- markdown report sections
- `evals/eval_cases.json` regression cases

## 範例輸出摘要

輸入：

```text
2026-04-12 I ordered a yearly subscription. Order #A-1933.
2026-04-13 I emailed customer support asking to cancel because I was charged twice.
Receipt shows two charges: invoice #INV-889 and invoice #INV-890.
Customer support replied that they could not find the second charge.
I want a refund for the duplicate charge and written confirmation that the subscription is cancelled.
```

輸出會包含：

- Intent: `refund`
- Timeline
- Evidence
- Missing info
- Guardrails
- polite / firm / finalNotice 三種草稿
- Human approval checklist
- Failure modes

## 目前限制

- 沒有直接呼叫 LLM API。
- 證據抽取使用簡單規則，不能保證完整理解語意。
- 此工具不是法律服務，不提供法律建議。
- 對外送出前仍需要人工確認事實、語氣與附件。

## 下一步

- 加入 PII redaction。
- 接 OpenAI Agents SDK / LangGraph。
- 加入 traces、latency、cost logging。
- 擴充 eval cases。
- 做一個 Web UI 比較不同語氣草稿。

## 履歷描述

可以放在履歷上的 bullet：

> Built a customer reply agent workflow that routes dispute intents, extracts evidence timelines, applies safety guardrails, generates tone-controlled response drafts, and prepares human approval packages with regression evals and documented failure modes.
