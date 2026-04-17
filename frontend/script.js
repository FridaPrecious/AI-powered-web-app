const API_URL = 'http://localhost:3000/api';

// Create new task
async function createTask() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) {
        alert('Please describe what you need assistance with');
        return;
    }
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const submitBtn = document.getElementById('submitBtn');
    const resultPanel = document.getElementById('resultPanel');
    
    loadingIndicator.style.display = 'flex';
    submitBtn.disabled = true;
    resultPanel.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput, isReturningCustomer: false })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayResult(data);
            document.getElementById('userInput').value = '';
            loadTasks();
        } else {
            showError(data.error || 'Failed to create task');
        }
    } catch (error) {
        showError('Connection error: ' + error.message);
    } finally {
        loadingIndicator.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Display task result
function displayResult(data) {
    const resultPanel = document.getElementById('resultPanel');
    
    const riskClass = data.risk_score > 60 ? 'risk-high' : (data.risk_score > 30 ? 'risk-medium' : 'risk-low');
    
    resultPanel.innerHTML = `
        <div class="result-section">
            <h4>Task Information</h4>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="task-code">${data.task_code}</span>
                <span class="risk-badge ${riskClass}">Risk: ${data.risk_score}/100</span>
            </div>
            <p style="margin-top: 8px;"><strong>Assigned to:</strong> ${data.employee}</p>
            <p><strong>Status:</strong> ${data.status}</p>
        </div>
        
        <div class="result-section">
            <h4>Process Steps</h4>
            <ul class="steps-list">
                ${data.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
        </div>
        
        <div class="result-section">
            <h4>Messages</h4>
            <div class="message-box message-whatsapp">
                <strong>WhatsApp Style:</strong><br>
                ${escapeHtml(data.messages.whatsapp)}
            </div>
            <div class="message-box message-email">
                <strong>Email Style:</strong><br>
                ${escapeHtml(data.messages.email).replace(/\n/g, '<br>')}
            </div>
            <div class="message-box message-sms">
                <strong>SMS Style:</strong><br>
                ${escapeHtml(data.messages.sms)}
            </div>
        </div>
    `;
    
    resultPanel.style.display = 'block';
    setTimeout(() => {
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Load all tasks
async function loadTasks() {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = '<div class="loading-state">Loading tasks...</div>';
    
    try {
        const response = await fetch(`${API_URL}/tasks`);
        const tasks = await response.json();
        
        if (!tasks || tasks.length === 0) {
            dashboardContent.innerHTML = '<div class="empty-state">No tasks yet. Create your first request above.</div>';
            return;
        }
        
        dashboardContent.innerHTML = `
            <table class="task-table">
                <thead>
                    <tr>
                        <th>Task Code</th>
                        <th>Intent</th>
                        <th>Status</th>
                        <th>Risk</th>
                        <th>Assigned To</th>
                        <th>Created</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(task => `
                        <tr>
                            <td><strong>${task.task_code}</strong></td>
                            <td>${formatIntent(task.intent)}</td>
                            <td>
                                <select class="status-select" id="status-${task.task_code}" data-code="${task.task_code}">
                                    <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </td>
                            <td><span class="risk-badge ${getRiskClass(task.risk_score)}">${task.risk_score}</span></td>
                            <td>${task.employee_assignment}</td>
                            <td>${formatDate(task.created_at)}</td>
                            <td><button class="update-btn" onclick="updateStatus('${task.task_code}')">Update</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        dashboardContent.innerHTML = `<div class="empty-state">Error loading tasks: ${error.message}</div>`;
    }
}

// Update task status
async function updateStatus(taskCode) {
    const select = document.getElementById(`status-${taskCode}`);
    const newStatus = select.value;
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskCode}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadTasks();
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Helper functions
function formatIntent(intent) {
    return intent.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getRiskClass(score) {
    if (score > 60) return 'risk-high';
    if (score > 30) return 'risk-medium';
    return 'risk-low';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const resultPanel = document.getElementById('resultPanel');
    resultPanel.innerHTML = `
        <div class="result-section">
            <h4>Error</h4>
            <p style="color: #c62828;">${escapeHtml(message)}</p>
        </div>
    `;
    resultPanel.style.display = 'block';
}

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});