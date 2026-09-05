import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [runningRecovery, setRunningRecovery] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);

  const [metrics, setMetrics] = useState({
    totalAttempts: 0,
    totalRecovered: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    blockedActions: 0,
    pendingActions: 0
  });

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [
        paymentsResponse,
        metricsResponse,
        historyResponse
      ] = await Promise.all([
        fetch("http://localhost:5000/api/recovery/analyze"),
        fetch("http://localhost:5000/api/recovery/metrics"),
        fetch("http://localhost:5000/api/recovery/history")
      ]);

      const paymentsData = await paymentsResponse.json();
      const metricsData = await metricsResponse.json();
      const historyData = await historyResponse.json();

      setPayments(paymentsData.payments || []);

      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }

      if (historyData.success) {
        setHistory(historyData.history || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RUN RECOVERY
  // =========================

  const runRecovery = async () => {
    setRunningRecovery(true);
    setRecoveryResult(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/recovery/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!data.success) {
        setRecoveryResult({
          success: false,
          message: "Recovery execution failed."
        });

        return;
      }

      const results = data.results || [];

      const successful = results.filter(
        (item) => item.execution?.result === "success"
      ).length;

      const pending = results.filter(
        (item) => item.execution?.result === "pending"
      ).length;

      const failed = results.filter(
        (item) => item.execution?.result === "failed"
      ).length;

      const blocked = results.filter(
        (item) => item.execution?.result === "blocked"
      ).length;

      setRecoveryResult({
        success: true,
        totalRecovered: Number(data.totalRecovered || 0),
        successful,
        pending,
        failed,
        blocked
      });

      await loadDashboardData();
    } catch (error) {
      console.error("Recovery execution error:", error);

      setRecoveryResult({
        success: false,
        message:
          "Unable to execute recovery. Please check whether the backend is running."
      });
    } finally {
      setRunningRecovery(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadDashboardData();
  }, []);

  // =========================
  // CALCULATE METRICS
  // =========================

  const totalAtRisk = payments.reduce(
    (sum, item) => sum + Number(item.payment?.amount || 0),
    0
  );

  const totalRecovered = Number(metrics.totalRecovered || 0);

  const recoveryRate =
    totalAtRisk > 0
      ? ((totalRecovered / totalAtRisk) * 100).toFixed(1)
      : "0.0";

  const recoveryProgress = Math.min(Number(recoveryRate), 100);

  return (
    <div className="app">

      {/* =========================
          HEADER
      ========================= */}

      <header className="header">

        <div>
          <h1>RecoverIQ</h1>

          <p>
            AI-Powered Revenue Recovery
          </p>
        </div>

        <div className="status">
          <span></span>
          System Online
        </div>

      </header>

      <main>

        {/* =========================
            HERO
        ========================= */}

        <section className="hero">

          <div>

            <h2>
              Revenue Recovery Command Center
            </h2>

            <p>
              Detect failed payments, choose the
              right recovery action, and recover
              revenue automatically with bounded
              AI decisions.
            </p>

          </div>

          <div className="hero-actions">

            <button
              type="button"
              onClick={runRecovery}
              className="run-recovery"
              disabled={loading || runningRecovery}
            >
              {runningRecovery
                ? "Running Recovery..."
                : "⚡ Run Recovery"}
            </button>

            <button
              type="button"
              onClick={loadDashboardData}
              className="refresh"
              disabled={loading || runningRecovery}
            >
              {loading
                ? "Refreshing..."
                : "🔄 Refresh Data"}
            </button>

          </div>

        </section>

        {/* =========================
            LATEST RECOVERY RUN RESULT
        ========================= */}

        {recoveryResult && (

          <section
            className={`recovery-result ${
              recoveryResult.success
                ? "result-success"
                : "result-error"
            }`}
          >

            {recoveryResult.success ? (

              <>
                <div className="result-header">

                  <div>

                    <h2>
                      ✓ Latest Recovery Run Completed
                    </h2>

                    <p>
                      RecoverIQ completed the latest
                      automated recovery process.
                    </p>

                  </div>

                  <div className="result-amount">

                    <span>
                      Recovered Revenue
                    </span>

                    <strong>
                      ₹
                      {recoveryResult.totalRecovered.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                </div>

                <div className="result-stats">

                  <div className="result-stat success-stat">

                    <strong>
                      {recoveryResult.successful}
                    </strong>

                    <span>
                      Successful
                    </span>

                  </div>

                  <div className="result-stat pending-stat">

                    <strong>
                      {recoveryResult.pending}
                    </strong>

                    <span>
                      Pending
                    </span>

                  </div>

                  <div className="result-stat failed-stat">

                    <strong>
                      {recoveryResult.failed}
                    </strong>

                    <span>
                      Failed
                    </span>

                  </div>

                  <div className="result-stat blocked-stat">

                    <strong>
                      {recoveryResult.blocked}
                    </strong>

                    <span>
                      Blocked
                    </span>

                  </div>

                </div>
              </>

            ) : (

              <div className="result-error-message">

                <h2>
                  ✕ Recovery Execution Failed
                </h2>

                <p>
                  {recoveryResult.message}
                </p>

              </div>

            )}

          </section>

        )}

        {/* =========================
            MAIN METRICS
        ========================= */}

        <section className="metrics">

          <div className="card">

            <p>
              Revenue at Risk
            </p>

            <h2>
              ₹
              {totalAtRisk.toLocaleString(
                "en-IN"
              )}
            </h2>

          </div>

          <div className="card">

            <p>
              Recovered Revenue
            </p>

            <h2>
              ₹
              {totalRecovered.toLocaleString(
                "en-IN"
              )}
            </h2>

          </div>

          <div className="card recovery-rate-card">

            <p>
              Recovery Rate
            </p>

            <h2>
              {recoveryRate}%
            </h2>

            <div className="recovery-progress">

              <div
                className="recovery-progress-bar"
                style={{
                  width: `${recoveryProgress}%`
                }}
              ></div>

            </div>

            <span className="recovery-progress-text">
              Revenue successfully recovered
            </span>

          </div>

          <div className="card">

            <p>
              Payments Analyzed
            </p>

            <h2>
              {payments.length}
            </h2>

          </div>

        </section>

        {/* =========================
            CUMULATIVE RECOVERY SUMMARY
        ========================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Cumulative Recovery Summary
              </h2>

              <p>
                Overall recovery statistics across
                all recovery attempts
              </p>

            </div>

          </div>

          <div className="metrics">

            <div className="card">

              <p>
                Total Attempts
              </p>

              <h2>
                {metrics.totalAttempts}
              </h2>

            </div>

            <div className="card">

              <p>
                Successful
              </p>

              <h2>
                {metrics.successfulRecoveries}
              </h2>

            </div>

            <div className="card">

              <p>
                Failed
              </p>

              <h2>
                {metrics.failedRecoveries}
              </h2>

            </div>

            <div className="card">

              <p>
                Pending
              </p>

              <h2>
                {metrics.pendingActions}
              </h2>

            </div>

            <div className="card">

              <p>
                Blocked
              </p>

              <h2>
                {metrics.blockedActions}
              </h2>

            </div>

            <div className="card">

              <p>
                Amount Recovered
              </p>

              <h2>
                ₹
                {totalRecovered.toLocaleString(
                  "en-IN"
                )}
              </h2>

            </div>

          </div>

        </section>

        {/* =========================
            AI DECISION EXPLANATION
        ========================= */}

        {selectedPayment && (

          <section className="panel">

            <div className="panel-header">

              <div>

                <h2>
                  AI Decision Explanation
                </h2>

                <p>
                  Explainable recovery
                  recommendation for Payment #
                  {selectedPayment.payment.id}
                </p>

              </div>

            </div>

            <div className="decision-grid">

              <div className="decision-card">

                <span>
                  Payment Amount
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedPayment.payment.amount
                  ).toLocaleString("en-IN")}
                </strong>

              </div>

              <div className="decision-card">

                <span>
                  Failure Reason
                </span>

                <strong>
                  {
                    selectedPayment.payment
                      .failure_reason
                  }
                </strong>

              </div>

              <div className="decision-card">

                <span>
                  Recovery Probability
                </span>

                <strong>
                  {
                    selectedPayment.decision
                      .recoveryProbability
                  }%
                </strong>

              </div>

              <div className="decision-card">

                <span>
                  Recommended Action
                </span>

                <strong>
                  {
                    selectedPayment.decision
                      .action
                  }
                </strong>

              </div>

            </div>

            <div className="decision-reason">

              <h3>
                Why this action?
              </h3>

              <p>
                {
                  selectedPayment.decision
                    .reason
                }
              </p>

            </div>

            <div className="decision-guardrail">

              <h3>
                Guardrail Decision
              </h3>

              <p>
                {selectedPayment.guardrail?.allowed
                  ? "This recovery action is allowed by the system guardrails."
                  : "This recovery action has been blocked by the system guardrails."}
              </p>

            </div>

          </section>

        )}

        {/* =========================
            RECOVERY PERFORMANCE
        ========================= */}

        <section className="panel performance-panel">

          <div className="panel-header">

            <div>

              <h2>
                Recovery Performance
              </h2>

              <p>
                Cumulative recovery performance
                across all attempts
              </p>

            </div>

          </div>

          <div className="performance-grid">

            <div className="performance-item">

              <div className="performance-number">
                {metrics.successfulRecoveries}
              </div>

              <div>

                <strong>
                  Successful
                </strong>

                <p>
                  Payments recovered
                  successfully
                </p>

              </div>

            </div>

            <div className="performance-item">

              <div className="performance-number">
                {metrics.failedRecoveries}
              </div>

              <div>

                <strong>
                  Failed
                </strong>

                <p>
                  Recovery attempts that
                  failed
                </p>

              </div>

            </div>

            <div className="performance-item">

              <div className="performance-number">
                {metrics.blockedActions}
              </div>

              <div>

                <strong>
                  Blocked
                </strong>

                <p>
                  Actions stopped by
                  guardrails
                </p>

              </div>

            </div>

            <div className="performance-item">

              <div className="performance-number">
                {metrics.pendingActions}
              </div>

              <div>

                <strong>
                  Pending
                </strong>

                <p>
                  Waiting for customer
                  action
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            RECOVERY ACTION HISTORY
        ========================= */}

        <section className="panel history-panel">

          <div className="panel-header">

            <div>

              <h2>
                Recovery Action History
              </h2>

              <p>
                Recent recovery actions
                executed by RecoverIQ
              </p>

            </div>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Payment
                  </th>

                  <th>
                    Action
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Probability
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Recovered
                  </th>

                </tr>

              </thead>

              <tbody>

                {history.length === 0 ? (

                  <tr>

                    <td colSpan="6">
                      No recovery actions
                      available.
                    </td>

                  </tr>

                ) : (

                  history.map((item) => (

                    <tr key={item.id}>

                      <td>
                        #{item.payment_id}
                      </td>

                      <td>
                        {item.action_type}
                      </td>

                      <td>
                        {item.reason || "—"}
                      </td>

                      <td>
                        {item.recovery_probability}%
                      </td>

                      <td>

                        <span
                          className={`badge status-${String(
                            item.status
                          ).toLowerCase()}`}
                        >
                          {item.status}
                        </span>

                      </td>

                      <td>
                        ₹
                        {Number(
                          item.amount_recovered || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* =========================
            FAILED PAYMENTS
        ========================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Failed Payments
              </h2>

              <p>
                AI-generated recovery
                recommendations
              </p>

            </div>

          </div>

          {loading ? (

            <div className="loading">
              Loading recovery
              intelligence...
            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Payment
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Failure Reason
                    </th>

                    <th>
                      AI Action
                    </th>

                    <th>
                      Probability
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Explain
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {payments.map((item) => (

                    <tr
                      key={item.payment.id}
                    >

                      <td>
                        #{item.payment.id}
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.payment.amount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {
                          item.payment
                            .failure_reason
                        }
                      </td>

                      <td>
                        {
                          item.decision
                            .action
                        }
                      </td>

                      <td>
                        {
                          item.decision
                            .recoveryProbability
                        }%
                      </td>

                      <td>

                        <span
                          className={`badge ${
                            item.guardrail?.allowed
                              ? "status-allowed"
                              : "status-blocked"
                          }`}
                        >
                          {item.guardrail?.allowed
                            ? "Allowed"
                            : "Blocked"}
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="explain-button"
                          onClick={() =>
                            setSelectedPayment(item)
                          }
                        >
                          Explain
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default App;