# Customer Reply Agent

[![Test](https://github.com/andrewzxlin/customer-reply-agent/actions/workflows/test.yml/badge.svg)](https://github.com/andrewzxlin/customer-reply-agent/actions/workflows/test.yml)

把客服對話、退款爭議、帳單問題整理成一份可以人工審核後送出的回覆包。

你貼上事件紀錄後，這個工具會幫你產出：

- 問題類型：退款、取消訂閱、帳單、物流或一般問題
- 事件摘要
- 證據時間線
- 缺少哪些資訊
- 安全檢查結果
- 溫和、強硬、最後通知三種回覆草稿
- 人工送出前的確認清單

## 這個作品完成的學習拼圖

- **Intent routing**：先判斷案件類型，再決定後續處理策略。
- **Evidence extraction**：把雜亂對話整理成時間線、證據與缺漏資訊。
- **Guardrails**：阻擋威脅、騷擾，並在法律/證據不足時要求人工審核。
- **Human-in-the-loop**：AI 只產生草稿與檢查清單，最後送出仍由人決定。
- **安全輸出設計**：同時產生不同語氣版本，但不讓語氣蓋過安全邊界。

## 為什麼這是 Agentic Workflow 的重要部分

客服與申訴場景不能只靠一段 prompt 直接產生回覆。它需要先理解意圖、整理證據、檢查風險，最後才生成草稿。

這個專案示範的是 **safe reply workflow**：

```text
Raw conversation / dispute notes
  -> Intent Router：判斷案件類型
  -> Evidence & Timeline Extractor：整理日期、訂單、收據、客服紀錄
  -> Guardrail Checks：阻擋威脅、騷擾、法律建議越界
  -> Draft Generator：產生不同語氣的回覆草稿
  -> Human Approval Package：送出前交給人確認
  -> Final Report
```

真正實用的 agentic workflow 不是把人排除，而是把 AI 放在「整理、檢查、草稿」的位置，讓人負責最後判斷。

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

## 範例輸入

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
