export const Intents = Object.freeze({
  REFUND: "refund",
  CANCELLATION: "cancellation",
  BILLING: "billing",
  SHIPPING: "shipping",
  GENERAL: "general"
});

export const GuardrailStatus = Object.freeze({
  PASS: "pass",
  NEEDS_REVIEW: "needs_review",
  BLOCK: "block"
});

export class CustomerReplyWorkflow {
  run(input, options = {}) {
    if (!input || !input.trim()) {
      throw new Error("input must not be empty");
    }

    const state = {
      rawInput: input.trim(),
      tone: options.tone ?? "firm",
      intent: Intents.GENERAL,
      summary: "",
      timeline: [],
      evidence: [],
      missingInfo: [],
      guardrails: [],
      recommendedAction: "",
      drafts: {},
      approvalChecklist: [],
      failureModes: []
    };

    this.routeIntent(state);
    this.extractEvidence(state);
    this.runGuardrails(state);
    this.generateDrafts(state);
    this.prepareApprovalPackage(state);
    return state;
  }

  routeIntent(state) {
    const text = normalize(state.rawInput);
    if (hasAny(text, ["refund", "退費", "退款", "return", "chargeback"])) {
      state.intent = Intents.REFUND;
      state.recommendedAction = "要求退款或補償，並附上訂單、時間線與先前客服回覆。";
    } else if (hasAny(text, ["cancel", "subscription", "取消", "訂閱"])) {
      state.intent = Intents.CANCELLATION;
      state.recommendedAction = "要求取消續訂並確認停止後續扣款。";
    } else if (hasAny(text, ["bill", "invoice", "charged", "帳單", "扣款", "收費"])) {
      state.intent = Intents.BILLING;
      state.recommendedAction = "要求說明收費依據，並請對方更正或退回錯誤扣款。";
    } else if (hasAny(text, ["shipping", "delivery", "package", "物流", "寄送", "包裹"])) {
      state.intent = Intents.SHIPPING;
      state.recommendedAction = "要求查明物流狀態，並提供補寄、退款或補償方案。";
    } else {
      state.intent = Intents.GENERAL;
      state.recommendedAction = "先要求對方釐清處理狀態、責任歸屬與下一步。";
    }
  }

  extractEvidence(state) {
    const lines = state.rawInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    state.summary = summarize(lines);
    state.timeline = lines
      .filter((line) => /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\/\d{1,2}|day\s*\d+/i.test(line))
      .slice(0, 8);
    state.evidence = lines
      .filter((line) => /order|receipt|invoice|email|screenshot|訂單|收據|發票|截圖|客服|tracking/i.test(line))
      .slice(0, 8);

    if (!/order|訂單|invoice|receipt|收據/i.test(state.rawInput)) {
      state.missingInfo.push("訂單號碼或收據資訊");
    }
    if (!/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\/\d{1,2}/.test(state.rawInput)) {
      state.missingInfo.push("明確日期");
    }
    if (!/asked|requested|客服|email|回覆|聯絡/i.test(state.rawInput)) {
      state.missingInfo.push("已聯絡客服或對方的紀錄");
    }
  }

  runGuardrails(state) {
    const input = normalize(state.rawInput);

    if (hasAny(input, ["sue", "lawsuit", "legal advice", "告死", "起訴", "法律意見"])) {
      state.guardrails.push({
        name: "legal_advice_boundary",
        status: GuardrailStatus.NEEDS_REVIEW,
        reason: "內容涉及法律威脅或法律判斷，輸出只能做溝通草稿，不應聲稱法律建議。"
      });
    } else {
      state.guardrails.push({
        name: "legal_advice_boundary",
        status: GuardrailStatus.PASS,
        reason: "未偵測到需要法律建議的明確要求。"
      });
    }

    if (hasAny(input, ["threaten", "harass", "dox", "騷擾", "威脅", "人肉"])) {
      state.guardrails.push({
        name: "abuse_prevention",
        status: GuardrailStatus.BLOCK,
        reason: "輸入要求可能導向騷擾或威脅，不產生攻擊性回覆。"
      });
    } else {
      state.guardrails.push({
        name: "abuse_prevention",
        status: GuardrailStatus.PASS,
        reason: "未偵測到騷擾或威脅要求。"
      });
    }

    if (state.missingInfo.length > 0) {
      state.guardrails.push({
        name: "evidence_completeness",
        status: GuardrailStatus.NEEDS_REVIEW,
        reason: `缺少：${state.missingInfo.join("、")}。草稿需避免捏造。`
      });
    } else {
      state.guardrails.push({
        name: "evidence_completeness",
        status: GuardrailStatus.PASS,
        reason: "基本證據欄位足夠產出草稿。"
      });
    }
  }

  generateDrafts(state) {
    if (state.guardrails.some((guardrail) => guardrail.status === GuardrailStatus.BLOCK)) {
      state.drafts = {
        blocked: "此案例包含威脅、騷擾或不安全要求，系統不產生對外訊息。請改用中性事實描述。"
      };
      return;
    }

    const evidenceLine = state.evidence.length
      ? `我已附上相關證據：${state.evidence.join("；")}。`
      : "我可以補上訂單、收據、截圖或先前客服紀錄。";
    const timelineLine = state.timeline.length
      ? `事件時間線如下：${state.timeline.join("；")}。`
      : "目前仍需補上完整事件日期。";

    state.drafts = {
      polite: `您好，我想請貴方協助處理此案件。${timelineLine}${evidenceLine}我的訴求是：${state.recommendedAction} 請協助確認處理時程，謝謝。`,
      firm: `您好，針對此案件我需要貴方給出明確處理。${timelineLine}${evidenceLine}基於上述紀錄，請於 3 個工作天內回覆：處理結果、依據，以及退款/補償/更正時程。`,
      finalNotice: `您好，這是我針對此案件的再次確認。${timelineLine}${evidenceLine}請於 3 個工作天內提出明確方案；若仍無法處理，我將依平台申訴、付款爭議或消費者保護流程提交完整紀錄。`
    };
  }

  prepareApprovalPackage(state) {
    state.approvalChecklist = [
      "確認草稿中的日期、金額、訂單號碼都來自使用者提供資料。",
      "刪除任何無證據支持的指控。",
      "確認語氣符合品牌或個人策略。",
      "若涉及法律、醫療、金融判斷，先交由專業人士或人工審核。",
      "送出前確認附件與截圖已去除敏感個資。"
    ];
    state.failureModes = [
      "輸入資訊不足時，系統可能只能產生保守草稿。",
      "若使用者提供的事實錯誤，workflow 不會知道真相。",
      "此工具不是法律服務，不應取代專業法律建議。",
      "過度強硬語氣可能降低對方合作意願，需要人工選擇。"
    ];
  }
}

export function renderMarkdown(state) {
  const guardrails = state.guardrails
    .map((guardrail) => `- ${guardrail.name}: **${guardrail.status}** — ${guardrail.reason}`)
    .join("\n");
  const drafts = Object.entries(state.drafts)
    .map(([name, draft]) => `### ${name}\n\n${draft}`)
    .join("\n\n");

  return `# Customer Reply Agent Report

## Intent

- Intent: ${state.intent}
- Recommended action: ${state.recommendedAction}
- Tone: ${state.tone}

## Summary

${state.summary}

## Timeline

${bullets(state.timeline)}

## Evidence

${bullets(state.evidence)}

## Missing Info

${bullets(state.missingInfo)}

## Guardrails

${guardrails}

## Drafts

${drafts}

## Human Approval Checklist

${bullets(state.approvalChecklist)}

## Failure Modes

${bullets(state.failureModes)}
`;
}

function summarize(lines) {
  const first = lines[0] ?? "";
  const last = lines.length > 1 ? lines[lines.length - 1] : "";
  if (!last || first === last) {
    return first || "尚無摘要。";
  }
  return `${first} / ${last}`;
}

function normalize(text) {
  return text.toLowerCase();
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function bullets(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 無";
}
