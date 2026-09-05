const pool = require("../config/database");

async function executeRecovery(payment, decision, guardrail) {

    // STEP 1: Check whether the guardrail allows the action
    if (!guardrail.allowed) {

        // Record blocked action in recovery_attempts
        await pool.query(
            `INSERT INTO recovery_attempts
            (payment_id, action_type, result, amount_recovered, failure_reason)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                payment.id,
                decision.action,
                "blocked",
                0,
                guardrail.errors.join(", ")
            ]
        );

        // Record blocked action in recovery_actions
        await pool.query(
            `INSERT INTO recovery_actions
            (payment_id, action_type, reason, status,
             recovery_probability, amount_recovered, executed_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
                payment.id,
                decision.action,
                guardrail.errors.join(", "),
                "blocked",
                decision.recoveryProbability,
                0
            ]
        );

        return {
            result: "blocked",
            amountRecovered: 0,
            failureReason: guardrail.errors.join(", ")
        };
    }

    // STEP 2: Default recovery result
    let result = "failed";
    let amountRecovered = 0;
    let failureReason = null;

    // TEST MODE ONLY
    // No real customer money is moved.

    // STEP 3: Retry payment
    if (decision.action === "retry_payment") {

        if (payment.id === 3 || payment.id === 5) {
            result = "success";
            amountRecovered = Number(payment.amount);
        } else {
            result = "failed";
            failureReason = "Retry did not succeed in test simulation.";
        }

    // STEP 4: Send payment reminder
    } else if (decision.action === "send_payment_reminder") {

        result = "pending";
        failureReason = "Customer action required before retry.";

    // STEP 5: Request alternate payment
    } else if (decision.action === "request_alternate_payment") {

        result = "pending";
        failureReason = "Waiting for alternate payment method.";

    // STEP 6: Request card update
    } else if (decision.action === "request_card_update") {

        result = "pending";
        failureReason = "Waiting for customer to update card.";

    // STEP 7: Anything else
    } else {

        result = "manual_review";
        failureReason = "Requires human review.";
    }

    // STEP 8: Record recovery attempt
    await pool.query(
        `INSERT INTO recovery_attempts
        (payment_id, action_type, result, amount_recovered, failure_reason)
        VALUES ($1, $2, $3, $4, $5)`,
        [
            payment.id,
            decision.action,
            result,
            amountRecovered,
            failureReason
        ]
    );

    // STEP 9: Record recovery action
    await pool.query(
        `INSERT INTO recovery_actions
        (payment_id, action_type, reason, status,
         recovery_probability, amount_recovered, executed_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
            payment.id,
            decision.action,
            failureReason || decision.reason,
            result,
            decision.recoveryProbability,
            amountRecovered
        ]
    );

    // STEP 10: Return execution result
    return {
        result,
        amountRecovered,
        failureReason
    };
}

module.exports = {
    executeRecovery
};