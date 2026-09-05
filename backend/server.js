const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/recovery", recoveryRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "RecoverIQ API is running",
        status: "OK"
    });
});

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Database connected successfully");
    }
});

const PORT = process.env.PORT || 5000;


// ===============================
// RECOVERY METRICS API
// ===============================

app.get("/api/recovery/metrics", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_attempts,
                COALESCE(SUM(amount_recovered), 0) AS total_recovered,
                COUNT(*) FILTER (WHERE result = 'success') AS successful_recoveries,
                COUNT(*) FILTER (WHERE result = 'failed') AS failed_recoveries,
                COUNT(*) FILTER (WHERE result = 'blocked') AS blocked_actions,
                COUNT(*) FILTER (WHERE result = 'pending') AS pending_actions
            FROM recovery_attempts
        `);

        const data = result.rows[0];

        res.json({
            success: true,
            metrics: {
                totalAttempts: Number(data.total_attempts),
                totalRecovered: Number(data.total_recovered),
                successfulRecoveries: Number(data.successful_recoveries),
                failedRecoveries: Number(data.failed_recoveries),
                blockedActions: Number(data.blocked_actions),
                pendingActions: Number(data.pending_actions)
            }
        });

    } catch (error) {
        console.error("Metrics error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to load recovery metrics"
        });
    }
});


// ===============================
// RECOVERY HISTORY API
// ===============================

app.get("/api/recovery/history", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ra.id,
                ra.payment_id,
                ra.action_type,
                ra.reason,
                ra.status,
                ra.recovery_probability,
                ra.amount_recovered,
                ra.executed_at,
                ra.created_at
            FROM recovery_actions ra
            ORDER BY ra.created_at DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            history: result.rows
        });

    } catch (error) {
        console.error("Recovery history error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to load recovery history"
        });
    }
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`RecoverIQ backend running on port ${PORT}`);
});