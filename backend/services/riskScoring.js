function calculateRiskScore(intent, entities, isReturningCustomer = false) {
    let risk = 20;
    
    if (intent === 'send_money' && entities.amount) {
        if (entities.amount > 100000) risk += 30;
        else if (entities.amount > 50000) risk += 20;
        else if (entities.amount > 10000) risk += 10;
    }
    
    if (entities.urgency === 'high') risk += 25;
    else if (entities.urgency === 'medium') risk += 10;
    
    if (intent === 'send_money' && !entities.recipient_verified) risk += 30;
    
    if (intent === 'verify_document') {
        if (entities.document_type === 'land_title') risk += 40;
        else if (entities.document_type === 'id_card') risk += 15;
        else risk += 20;
    }
    
    if (isReturningCustomer) risk -= 20;
    
    return Math.min(100, Math.max(0, risk));
}

module.exports = { calculateRiskScore };