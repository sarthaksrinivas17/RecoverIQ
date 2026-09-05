function analyzePayment(payment) {
    let recoveryProbability = 0;
    let action = "no_action";
    let reason = "";

    switch (payment.failure_reason) {
        case "timeout":
            recoveryProbability = 85;
            action = "retry_payment";
            reason = "Temporary payment timeout may succeed on retry.";
            break;

        case "bank_server_error":
            recoveryProbability = 80;
            action = "retry_payment";
            reason = "Bank-side technical failure may be temporary.";
            break;

        case "insufficient_funds":
            recoveryProbability = 55;
            action = "send_payment_reminder";
            reason = "Customer may need to add funds before retrying.";
            break;

        case "card_declined":
            recoveryProbability = 40;
            action = "request_alternate_payment";
            reason = "Current card was declined; alternate payment method recommended.";
            break;

        case "expired_card":
            recoveryProbability = 20;
            action = "request_card_update";
            reason = "The payment method appears to be expired.";
            break;

        default:
            recoveryProbability = 10;
            action = "manual_review";
            reason = "Unknown failure reason requires manual review.";
    }

    return {
        recoveryProbability,
        action,
        reason
    };
}

module.exports = {
    analyzePayment
};