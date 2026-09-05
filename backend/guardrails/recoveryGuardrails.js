const MAX_RETRY_ATTEMPTS = 2;
const MAX_RECOVERY_AMOUNT = 10000;

function validateRecoveryAction(payment, decision) {
    const errors = [];

    // Rule 1: Never retry an already successful payment
    if (payment.status === "success") {
        errors.push("Payment is already successful.");
    }

    // Rule 2: Never retry more than twice
    if (
        decision.action === "retry_payment" &&
        payment.attempt_number >= MAX_RETRY_ATTEMPTS
    ) {
        errors.push("Maximum retry limit reached.");
    }

    // Rule 3: High-value payments require review
    if (
        decision.action === "retry_payment" &&
        Number(payment.amount) > MAX_RECOVERY_AMOUNT
    ) {
        errors.push("Payment exceeds automatic recovery amount limit.");
    }

    return {
        allowed: errors.length === 0,
        errors
    };
}

module.exports = {
    validateRecoveryAction
};