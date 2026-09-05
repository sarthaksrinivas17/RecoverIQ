const express = require("express");
const pool = require("../config/database");
const { analyzePayment } = require("../agents/recoveryAgent");
const { validateRecoveryAction } = require("../guardrails/recoveryGuardrails");
const { executeRecovery } = require("../services/recoveryExecutor");
const router = express.Router();

router.get("/analyze", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM payments
            WHERE status = 'failed'
            ORDER BY created_at DESC
        `);

        const analyzedPayments = result.rows.map(payment => {
    const decision = analyzePayment(payment);

    const guardrail = validateRecoveryAction(
        payment,
        decision
    );

    return {
        payment,
        decision,
        guardrail
    };
});

        res.json({
            success: true,
            count: analyzedPayments.length,
            payments: analyzedPayments
        });

    } catch (error) {
        console.error("Recovery analysis error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to analyze payments"
        });
    }
});
router.post("/execute", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM payments
            WHERE status = 'failed'
            ORDER BY created_at DESC
        `);

        const executionResults = [];

        for (const payment of result.rows) {

            const decision = analyzePayment(payment);

            const guardrail = validateRecoveryAction(
                payment,
                decision
            );

            const execution = await executeRecovery(
                payment,
                decision,
                guardrail
            );

            executionResults.push({
                payment,
                decision,
                guardrail,
                execution
            });
        }

        const totalRecovered = executionResults.reduce(
            (total, item) => total + item.execution.amountRecovered,
            0
        );

        res.json({
            success: true,
            count: executionResults.length,
            totalRecovered,
            results: executionResults
        });

    } catch (error) {
        console.error("Recovery execution error:", error.message);

        res.status(500).json({
            success: false,
            message: "Recovery execution failed"
        });
    }
});

module.exports = router;