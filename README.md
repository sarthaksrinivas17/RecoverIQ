# RecoverIQ – AI-Powered Payment Recovery System

> *Detect. Decide. Recover.*

RecoverIQ is an AI-powered payment recovery system built for the *AI Revenue Recovery* track of the *Razorpay AI Buildathon 2026*.

The system analyzes failed payments, recommends an appropriate recovery action, validates the recommendation using safety guardrails, executes allowed recovery workflows, and tracks the recovery results through a dashboard.

---

## 🚀 Problem

Failed payments can result in significant revenue leakage for merchants.

However, not every failed payment should be handled in the same way.

For example:

- A temporary payment timeout may be suitable for a retry.
- An insufficient-funds failure may require a payment reminder.
- An expired card may require the customer to update their card.
- Some high-value transactions may require additional safety controls before automatic recovery.

A simple "retry every failed payment" strategy can therefore be inefficient and potentially risky.

RecoverIQ addresses this problem by combining *AI-based recovery decisions with deterministic guardrails and controlled execution*.

---

## 💡 Solution

RecoverIQ follows a complete payment recovery workflow:

```text
Failed Payment
      ↓
Payment Analysis
      ↓
AI Recovery Decision
      ↓
Recovery Probability
      ↓
Guardrail Check
      ↓
Recovery Action
      ↓
Execution Result
      ↓
Dashboard Monitoring
```
<img width="2306" height="1140" alt="Screenshot 2026-09-05 191804" src="https://github.com/user-attachments/assets/294e7884-f990-4e64-bfb0-24d3b8e0344a" />

<img width="2228" height="1094" alt="Screenshot 2026-09-05 191850" src="https://github.com/user-attachments/assets/d2e6211a-e49a-48f2-93cd-14f02f008d45" />

<img width="2248" height="1008" alt="Screenshot 2026-09-05 191901" src="https://github.com/user-attachments/assets/30cb8520-e1d6-4813-a8a5-bddcb67e6b12" />

