const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function processRequest(userInput) {
    const systemPrompt = `You are Vunoh AI assistant for Kenyans living abroad.
    
    Extract from user input:
    1. intent: exactly "send_money", "hire_service", or "verify_document"
    2. entities: amount, recipient, service_type, location, document_type, urgency, recipient_verified
    
    Urgency: "high", "medium", or "low"
    recipient_verified: true/false (assume false unless specified)
    
    Generate:
    - risk_score: 0-100 based on amount>50k(+20), urgency high(+25), unverified recipient(+30), land title(+40)
    - employee: "Finance" for money, "Operations" for service, "Legal" for documents
    - steps: 3-5 specific steps
    - whatsapp_message: conversational, no emojis, under 200 chars
    - email_message: formal, includes [TASK_CODE], full details
    - sms_message: under 160 chars, only essentials
    
    Return ONLY valid JSON. Do not include any other text.`;
    
    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.1-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userInput }
            ],
            temperature: 0.3,
        });
        
        let aiResponse = response.choices[0].message.content;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        return JSON.parse(aiResponse);
    } catch (error) {
        console.error('AI Error:', error.message);
        // Fallback response
        return {
            intent: 'hire_service',
            entities: { service_type: 'general', urgency: 'medium' },
            risk_score: 50,
            employee_assignment: 'Operations',
            steps: ['Receive request', 'Assign team', 'Execute task', 'Confirm completion'],
            whatsapp_message: 'Request received. We will process it shortly.',
            email_message: 'Dear Customer,\n\nYour request has been received.\n\nBest regards,\nVunoh Global',
            sms_message: 'Request received. Processing...'
        };
    }
}

module.exports = { processRequest };