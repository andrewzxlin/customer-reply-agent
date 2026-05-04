# 架構說明

`customer-reply-agent` 是一個客服/申訴回覆 workflow demo。它不追求讓模型完全自主，而是展示企業 LLM workflow 常見的工程邊界：intent routing、證據抽取、guardrails、草稿產生與 human-in-the-loop approval。

## Workflow

```text
Raw conversation / dispute notes
  -> Intent Router
  -> Evidence & Timeline Extractor
  -> Guardrail Checks
  -> Draft Generator
  -> Human Approval Package
  -> Markdown / JSON Report
```

## 為什麼這對求職有用

這個專案對應許多 AI Engineer / LLM App Engineer 職缺會看的能力：

- routing：不同客服情境走不同策略。
- tool/step boundaries：每個步驟可被測試與替換。
- guardrails：阻擋騷擾、威脅，避免法律建議越界。
- human-in-the-loop：對外送出前必須人工確認。
- evals：用固定案例測 routing 與 guardrail regression。
- failure modes：明確說明系統不能保證事實正確，也不是法律服務。

## Guardrails

目前有三個 deterministic guardrails：

1. `legal_advice_boundary`：涉及法律威脅或法律判斷時標記人工審核。
2. `abuse_prevention`：偵測威脅、騷擾、人肉等要求並 block。
3. `evidence_completeness`：缺少訂單、日期、客服紀錄時要求審核，避免捏造。

## 可延伸方向

1. 接入 OpenAI Agents SDK 或 LangGraph。
2. 用真實 LLM 做摘要、語氣改寫與證據抽取。
3. 加入 PII redaction。
4. 加入 OpenTelemetry / AgentOps traces。
5. 做一個 Web UI，讓人可以比較 polite / firm / final notice 三種草稿。
