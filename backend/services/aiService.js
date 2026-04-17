const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function processRequest(userInput, retries = 2) {
    console.log('Processing with Groq AI:', userInput);
    
    const systemPrompt = `You are Vunoh AI assistant for Kenyans living abroad.

CRITICAL RULE: All messages (whatsapp_message, email_message, sms_message) must be addressed TO THE CUSTOMER who made the request. The customer is a Kenyan living abroad. Do NOT write messages to internal teams.

Extract from user input:
1. intent: exactly "send_money", "hire_service", or "verify_document"
2. entities: amount (number), recipient (string), service_type (string), location (string), document_type (string), urgency (string), recipient_verified (boolean), is_property_purchase (boolean)

Special cases:
- "buy apartment", "buy house", "purchase property" → intent: "verify_document", document_type: "land_title", service_type: "real_estate_lawyer", is_property_purchase: true

Rules:
- urgency: "high", "medium", "low" (default "medium")
- recipient_verified: false unless user says verified

Generate FOR THE CUSTOMER:
- risk_score: 0-100
- employee: "Finance" for send_money, "Operations" for hire_service, "Legal" for verify_document (internal use only)
- steps: 4-6 specific steps the company will take to help the customer
- whatsapp_message: Conversational update TO THE CUSTOMER. Use "your", "we", "you". Start with "Your". Example: "Your money transfer request has been received. We will process it shortly."
- email_message: Formal email TO THE CUSTOMER. Start with "Dear Customer". Include task code [TASK_CODE] and next steps.
- sms_message: Short text TO THE CUSTOMER under 160 chars. Start with "Vunoh: Your". Example: "Vunoh: Your transfer request [TASK_CODE] received."

Return ONLY valid JSON. No other text.`;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userInput }
                ],
                temperature: 0.3,
            });
            
            let aiResponse = response.choices[0].message.content;
            console.log('Raw AI Response:', aiResponse);
            
            aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const result = JSON.parse(aiResponse);
            
            return {
                intent: result.intent || 'hire_service',
                entities: result.entities || {},
                risk_score: result.risk_score || 50,
                employee_assignment: result.employee || result.employee_assignment || 'Operations',
                steps: result.steps || ['Receive request', 'Process', 'Complete', 'Confirm'],
                whatsapp_message: result.whatsapp_message || 'Your request has been received. We will process it shortly.',
                email_message: result.email_message || 'Dear Customer,\n\nYour request has been received.\n\nTask Code: [TASK_CODE]\n\nWe will update you once processing is complete.\n\nBest regards,\nVunoh Global',
                sms_message: result.sms_message || 'Vunoh: Your request received. Processing.'
            };
            
        } catch (error) {
            console.error(`Groq API Error (attempt ${attempt + 1}):`, error.message);
            if (attempt === retries) {
                console.log('Using fallback response');
                return getFallbackResponse(userInput);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function getFallbackResponse(userInput) {
    const lowerInput = userInput.toLowerCase();
    
    // Check for property purchase first
    const isPropertyPurchase = lowerInput.includes('buy') || lowerInput.includes('purchase') || 
                               lowerInput.includes('apartment') || lowerInput.includes('house') || 
                               lowerInput.includes('property');
    
    // Extract amount
    const amountMatch = userInput.match(/(\d+[,\d]*)/);
    const amount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : null;
    
    // Extract recipient
    let recipient = 'your recipient';
    if (lowerInput.includes('mother')) recipient = 'your mother';
    else if (lowerInput.includes('father')) recipient = 'your father';
    else if (lowerInput.includes('sister')) recipient = 'your sister';
    else if (lowerInput.includes('brother')) recipient = 'your brother';
    else if (lowerInput.includes('wife')) recipient = 'your wife';
    else if (lowerInput.includes('husband')) recipient = 'your husband';
    
    // Extract phone number
    const phoneMatch = userInput.match(/07\d{8}/);
    if (phoneMatch) recipient = phoneMatch[0];
    
    // Determine urgency
    const isUrgent = lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('quickly') || lowerInput.includes('immediately');
    
    // Determine location
    let location = 'your specified location';
    const locations = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'kiambu'];
    for (const loc of locations) {
        if (lowerInput.includes(loc)) {
            location = loc.charAt(0).toUpperCase() + loc.slice(1);
            break;
        }
    }
    
    let intent = 'hire_service';
    let document_type = null;
    let service_type = null;
    let steps = [];
    let whatsapp = '';
    let email = '';
    let sms = '';
    let risk_score = 30;
    
    // Property Purchase
    if (isPropertyPurchase) {
        intent = 'verify_document';
        document_type = 'land_title';
        service_type = 'real_estate_lawyer';
        risk_score = 65;
        steps = [
            'Verify the land title document with the Ministry of Lands',
            'Conduct an official search for any encumbrances or liens',
            'Connect you with a verified real estate lawyer',
            'Review the purchase agreement and terms with you',
            'Facilitate the legal transfer of ownership',
            'Confirm final registration in your name'
        ];
        whatsapp = `Your property purchase request has been received. We will verify the land title and connect you with a real estate lawyer. Task: [TASK_CODE]`;
        email = `Dear Customer,\n\nThank you for using Vunoh Global.\n\nYour property purchase request in Kenya has been received.\n\nTask Code: [TASK_CODE]\nLocation: ${location}\nRisk Score: ${risk_score}/100\n\nHere is what happens next:\n1. We will verify the land title with the Ministry of Lands\n2. We will check for any encumbrances or legal issues\n3. We will connect you with a verified real estate lawyer\n4. The lawyer will help review the purchase agreement\n5. We will facilitate the legal transfer of ownership\n\nWe will update you within 24 hours.\n\nBest regards,\nVunoh Global`;
        sms = `Vunoh: Your property request [TASK_CODE] received. Title verification in progress.`;
    }
    
    // Send Money
    else if (lowerInput.includes('send') || lowerInput.includes('money') || lowerInput.includes('transfer')) {
        intent = 'send_money';
        
        // Calculate risk score
        risk_score = 30;
        if (amount && amount > 100000) risk_score = 80;
        else if (amount && amount > 50000) risk_score = 60;
        else if (amount && amount > 10000) risk_score = 45;
        if (isUrgent) risk_score += 15;
        risk_score = Math.min(100, risk_score);
        
        steps = [
            'Verify your identity as the sender',
            `Confirm recipient details: ${recipient}`,
            `Process your transfer of ${amount ? `KES ${amount.toLocaleString()}` : 'funds'}`,
            'Send you a confirmation receipt once complete'
        ];
        
        const urgencyText = isUrgent ? ' urgent' : '';
        const amountText = amount ? ` of KES ${amount.toLocaleString()}` : '';
        
        whatsapp = `Your${urgencyText} money transfer request${amountText} to ${recipient} has been received. We will verify and process it shortly. Task: [TASK_CODE]`;
        email = `Dear Customer,\n\nYour${urgencyText} money transfer request has been received.\n\nTask Code: [TASK_CODE]\nAmount: ${amount ? `KES ${amount.toLocaleString()}` : 'To be confirmed'}\nRecipient: ${recipient}\nRisk Score: ${risk_score}/100\n\nWe will verify your identity and process the transfer. You will receive a confirmation once complete.\n\nBest regards,\nVunoh Global`;
        sms = `Vunoh: Your${urgencyText} transfer${amountText} to ${recipient} [TASK_CODE] received. Processing.`;
    }
    
    // Verify Document
    else if (lowerInput.includes('verify') || lowerInput.includes('document') || lowerInput.includes('land') || lowerInput.includes('title')) {
        intent = 'verify_document';
        
        if (lowerInput.includes('land') || lowerInput.includes('title')) {
            document_type = 'land_title';
            risk_score = 70;
        } else if (lowerInput.includes('id')) {
            document_type = 'id_card';
            risk_score = 45;
        } else {
            document_type = 'document';
            risk_score = 55;
        }
        
        steps = [
            'Receive your document copy',
            'Verify with the issuing authority',
            'Generate a verification report',
            'Send the results to you within 48 hours'
        ];
        whatsapp = `Your ${document_type.replace('_', ' ')} verification request has been received. We will verify and send results within 48 hours. Task: [TASK_CODE]`;
        email = `Dear Customer,\n\nYour ${document_type.replace('_', ' ')} verification request has been received.\n\nTask Code: [TASK_CODE]\nRisk Score: ${risk_score}/100\n\nWe will verify your document with the relevant authority and send you the results within 48 hours.\n\nBest regards,\nVunoh Global`;
        sms = `Vunoh: Your ${document_type.replace('_', ' ')} verification [TASK_CODE] received. Results in 48 hours.`;
    }
    
    // Hire Lawyer
    else if (lowerInput.includes('lawyer')) {
        intent = 'hire_service';
        service_type = 'lawyer';
        risk_score = 45;
        steps = [
            'Find a verified lawyer in your required location',
            'Check the lawyer credentials and specializations',
            'Schedule a consultation for you',
            'Confirm the appointment details with you'
        ];
        whatsapp = `Your request for a lawyer in ${location} has been received. We are finding the best match for you. Task: [TASK_CODE]`;
        email = `Dear Customer,\n\nYour request for a lawyer in ${location} has been received.\n\nTask Code: [TASK_CODE]\n\nWe will match you with a verified lawyer within 24 hours and send you their details.\n\nBest regards,\nVunoh Global`;
        sms = `Vunoh: Your lawyer request [TASK_CODE] received. Finding a match for you in ${location}.`;
    }
    
    // Hire Cleaner / General Service
    else if (lowerInput.includes('cleaner')) {
        intent = 'hire_service';
        service_type = 'cleaner';
        risk_score = 25;
        steps = [
            'Find a verified cleaner in your area',
            'Check their background and reviews',
            'Schedule a cleaning appointment for you',
            'Confirm the booking with you'
        ];
        whatsapp = `Your request for a cleaner in ${location} has been received. We are finding the best match for you. Task: [TASK_CODE]`;
        email = `Dear Customer,\n\nYour request for a cleaner in ${location} has been received.\n\nTask Code: [TASK_CODE]\n\nWe will match you with a verified cleaner within 24 hours.\n\nBest regards,\nVunoh Global`;
        sms = `Vunoh: Your cleaner request [TASK_CODE] received. Finding a match in ${location}.`;
    }
    
    // Default Hire Service
    else {
        intent = 'hire_service';
        service_type = 'general';
        risk_score = 35;
        steps = [
            'Find a matching service provider for you',
            'Verify provider credentials and background',
            'Schedule an appointment at your preferred time',
            'Confirm the booking with you',
            'Follow up after service completion'
        ];
        whatsapp = `Your service request in ${location} has been received. We are finding the best provider for you. Task: [TASK_CODE]`;
        email = `Dear Customer,\n\nYour service request in ${location} has been received.\n\nTask Code: [TASK_CODE]\n\nWe will match you with a verified service provider within 24 hours and send you the details.\n\nBest regards,\nVunoh Global`;
        sms = `Vunoh: Your service request [TASK_CODE] received. Finding a provider for you in ${location}.`;
    }
    
    const employee = intent === 'send_money' ? 'Finance' : (intent === 'verify_document' ? 'Legal' : 'Operations');
    
    return {
        intent: intent,
        entities: { 
            amount: amount, 
            recipient: recipient,
            location: location,
            document_type: document_type, 
            service_type: service_type,
            is_property_purchase: isPropertyPurchase,
            urgency: isUrgent ? 'high' : 'medium'
        },
        risk_score: risk_score,
        employee_assignment: employee,
        steps: steps,
        whatsapp_message: whatsapp,
        email_message: email,
        sms_message: sms
    };
}

module.exports = { processRequest };