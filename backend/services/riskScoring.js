function calculateRiskScore(intent, entities, isReturningCustomer = false, customerHistory = {}) {
    let risk = 20; // Base risk for all transactions
    
    // ============ 1. AMOUNT RISK (For Money Transfers) ============
    if (intent === 'send_money' && entities.amount) {
        if (entities.amount > 500000) risk += 40;      // Very large transfer
        else if (entities.amount > 200000) risk += 35; // Large transfer
        else if (entities.amount > 100000) risk += 30; // Significant transfer
        else if (entities.amount > 50000) risk += 20;  // Medium transfer
        else if (entities.amount > 10000) risk += 10;  // Small transfer
        // Amounts under 10,000 KES add no risk
    }
    
    // ============ 2. URGENCY RISK ============
    if (entities.urgency === 'high') {
        risk += 25;  // Urgent requests = higher fraud risk
    } else if (entities.urgency === 'medium') {
        risk += 10;
    }
    // Low urgency adds no risk
    
    // ============ 3. RECIPIENT VERIFICATION RISK (Diaspora Specific) ============
    if (intent === 'send_money') {
        if (!entities.recipient_verified) {
            risk += 35;  // Unverified recipient = high risk for diaspora sending home
        }
        if (entities.recipient_relationship === 'unknown') {
            risk += 15;  // Sending to unknown person
        }
        if (entities.recipient_relationship === 'family') {
            risk -= 10;  // Family members are lower risk
        }
    }
    
    // ============ 4. DOCUMENT VERIFICATION RISK (Kenya Specific) ============
    if (intent === 'verify_document') {
        if (entities.document_type === 'land_title') {
            risk += 45;  // Land title fraud is very common in Kenya
        } else if (entities.document_type === 'vehicle_logbook') {
            risk += 30;  // Vehicle document fraud
        } else if (entities.document_type === 'passport') {
            risk += 25;  // Passport verification
        } else if (entities.document_type === 'id_card') {
            risk += 15;  // National ID verification
        } else if (entities.document_type === 'birth_certificate') {
            risk += 10;
        } else if (entities.document_type === 'academic_certificate') {
            risk += 20;  // Certificate fraud is common
        } else {
            risk += 20;  // Unknown document type
        }
        
        // Document location risk (some registries have more fraud)
        const highRiskRegistries = ['kiambu', 'nakuru', 'machakos', 'kajiado'];
        if (entities.location && highRiskRegistries.includes(entities.location.toLowerCase())) {
            risk += 15;
        }
    }
    
    // ============ 5. SERVICE HIRING RISK ============
    if (intent === 'hire_service') {
        if (entities.service_type === 'lawyer') {
            risk += 15;  // Lawyers handling sensitive matters
        } else if (entities.service_type === 'real_estate_agent') {
            risk += 20;  // Real estate fraud risk
        } else if (entities.service_type === 'cleaner') {
            risk += 5;   // Low risk service
        } else if (entities.service_type === 'errand_runner') {
            risk += 10;
        } else if (entities.service_type === 'contractor') {
            risk += 15;  // Contractors require verification
        }
        
        // Service urgency risk
        if (entities.urgency === 'high' && entities.service_type === 'lawyer') {
            risk += 10;  // Urgent legal matters need extra scrutiny
        }
    }
    
    // ============ 6. LOCATION RISK (Diaspora Specific) ============
    const highRiskLocations = [
        'border', 'remote', 'refugee_camp',
        'kakuma', 'dadaab', 'lodwar', 'garissa', 'mandera'
    ];
    if (entities.location && highRiskLocations.includes(entities.location.toLowerCase())) {
        risk += 25;  // High-risk areas for fraud
    }
    
    // Medium risk locations
    const mediumRiskLocations = ['kisumu', 'eldoret', 'nakuru', 'mombasa_outskirts'];
    if (entities.location && mediumRiskLocations.includes(entities.location.toLowerCase())) {
        risk += 10;
    }
    
    // ============ 7. TIME-BASED RISK ============
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 22 || currentHour <= 5;
    if (isLateNight && entities.urgency === 'high') {
        risk += 15;  // Late night urgent requests = suspicious
    }
    
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    if (isWeekend && intent === 'verify_document') {
        risk += 10;  // Document verification on weekends = unusual
    }
    
    // ============ 8. CUSTOMER HISTORY (Risk Reduction) ============
    if (isReturningCustomer) {
        risk -= 20;  // Returning customer discount
    }
    
    // Successful past transactions reduce risk
    if (customerHistory.successfulTransactions > 10) {
        risk -= 15;
    } else if (customerHistory.successfulTransactions > 5) {
        risk -= 10;
    } else if (customerHistory.successfulTransactions > 0) {
        risk -= 5;
    }
    
    // Past fraud or disputes increase risk
    if (customerHistory.pastDisputes > 0) {
        risk += 20 * Math.min(3, customerHistory.pastDisputes);
    }
    
    if (customerHistory.chargebacks > 0) {
        risk += 30;
    }
    
    // ============ 9. COMBINATION RISKS (Synergy) ============
    // High urgency + Large amount + Unverified recipient = Extremely high risk
    if (intent === 'send_money' && 
        entities.urgency === 'high' && 
        entities.amount > 100000 && 
        !entities.recipient_verified) {
        risk += 25;  // Fraud triangle
    }
    
    // Land title + Urgent + Remote location = Very suspicious
    if (intent === 'verify_document' &&
        entities.document_type === 'land_title' &&
        entities.urgency === 'high' &&
        highRiskLocations.includes(entities.location?.toLowerCase())) {
        risk += 20;
    }
    
    // ============ 10. POSITIVE FACTORS (Risk Reduction) ============
    // Verified recipient reduces risk
    if (entities.recipient_verified === true) {
        risk -= 15;
    }
    
    // Known service provider reduces risk
    if (entities.provider_verified === true) {
        risk -= 10;
    }
    
    // Customer has completed ID verification
    if (customerHistory.idVerified === true) {
        risk -= 10;
    }
    
    // Premium customer
    if (customerHistory.isPremium === true) {
        risk -= 15;
    }
    
    // ============ FINAL: Cap at 0-100 ============
    return Math.min(100, Math.max(0, risk));
}

module.exports = { calculateRiskScore };