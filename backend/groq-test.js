require('dotenv').config();

console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);

async function testGroq() {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'user', content: 'Say hello world' }
                ],
                temperature: 0.3
            })
        });
        
        const data = await response.json();
        console.log('Response status:', response.status);
        
        if (response.ok) {
            console.log('SUCCESS! Groq API is working!');
            console.log('Response:', data.choices[0].message.content);
        } else {
            console.log('ERROR:', data.error?.message);
        }
    } catch (error) {
        console.log('FAILED:', error.message);
    }
}

testGroq();