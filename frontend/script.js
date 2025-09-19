const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage('user', userMessage);
    input.value = '';

    // Add "Thinking..." message
    const thinkingMessage = appendMessage('bot', 'Thinking...');

    // Send message to backend
    sendMessageToBackend(userMessage, thinkingMessage);
});

async function sendMessageToBackend(message, thinkingMessage) {
    try {
        const response = await fetch('http://localhost:3000/api/chat', { // Use relative URL
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: [{
                    role: 'user',
                    message: message
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response:', data);


        if (data.success && data.data) {
            // Replace "Thinking..." message with actual response
            thinkingMessage.textContent = data.data;
        } else {
            // If no result, show "Sorry, no response received."
            thinkingMessage.textContent = 'Sorry, no response received.';
        }
    } catch (error) {
        console.error('Error:', error);
            // If error, show "Failed to get response from server."
        thinkingMessage.textContent = 'Failed to get response from server.';
    }
}

function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg
}