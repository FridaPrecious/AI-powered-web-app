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
    const emptyResult = document.getElementById('emptyResult');
    
    loadingIndicator.style.display = 'flex';
    submitBtn.disabled = true;
    resultPanel.style.display = 'none';
    
    // HIDE the empty result message
    if (emptyResult) {
        emptyResult.style.display = 'none';
    }
    
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput, isReturningCustomer: false })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayCustomerMessages(data);
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

// Display customer messages
function displayCustomerMessages(data) {
    const resultPanel = document.getElementById('resultPanel');
    const emptyResult = document.getElementById('emptyResult');
    
    // Hide empty result
    if (emptyResult) {
        emptyResult.style.display = 'none';
    }
    
    resultPanel.innerHTML = `
        <div class="customer-messages">
            <div class="message-box message-whatsapp">
                <strong>WhatsApp Message</strong>
                <p>${escapeHtml(data.messages.whatsapp)}</p>
            </div>
            <div class="message-box message-email">
                <strong>Email Message</strong>
                <p>${escapeHtml(data.messages.email).replace(/\n/g, '<br>')}</p>
            </div>
            <div class="message-box message-sms">
                <strong>SMS Message</strong>
                <p>${escapeHtml(data.messages.sms)}</p>
            </div>
            <div class="task-reference">
                Reference: Task Code ${data.task_code}
            </div>
        </div>
    `;
    
    resultPanel.style.display = 'block';
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
                                <select class="status-select" id="status-${task.task_code}" onchange="updateStatus('${task.task_code}')">
                                    <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                </select>
                            </td>
                            <td><span class="risk-badge ${getRiskClass(task.risk_score)}">${task.risk_score}</span></td>
                            <td>${task.employee_assignment}</td>
                            <td>${formatDate(task.created_at)}</td>
                            <td>
                                <button class="details-btn" onclick="viewFullDetails('${task.task_code}')">View Details</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        dashboardContent.innerHTML = `<div class="empty-state">Error loading tasks: ${error.message}</div>`;
    }
}

// View full task details
async function viewFullDetails(taskCode) {
    try {
        const response = await fetch(`${API_URL}/tasks/full/${taskCode}`);
        
        if (!response.ok) {
            alert('Failed to load task details');
            return;
        }
        
        const task = await response.json();
        
        const modalHtml = `
            <div id="taskModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Task Details - Employee View</h3>
                        <span class="modal-close" onclick="closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <p><strong>Task Code:</strong> ${task.task_code}</p>
                            <p><strong>Intent:</strong> ${formatIntent(task.intent)}</p>
                            <p><strong>Status:</strong> ${task.status}</p>
                            <p><strong>Risk Score:</strong> ${task.risk_score}/100</p>
                            <p><strong>Assigned To:</strong> ${task.employee_assignment}</p>
                            <p><strong>Created:</strong> ${formatDate(task.created_at)}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Process Steps</h4>
                            <ol class="steps-list">
                                ${task.steps ? task.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('') : '<li>No steps available</li>'}
                            </ol>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Extracted Entities</h4>
                            <pre class="entities-json">${JSON.stringify(task.entities, null, 2)}</pre>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Messages Sent to Customer</h4>
                            <div class="message-box message-whatsapp">
                                <strong>WhatsApp:</strong>
                                <p>${task.messages?.whatsapp || 'N/A'}</p>
                            </div>
                            <div class="message-box message-email">
                                <strong>Email:</strong>
                                <p>${task.messages?.email ? task.messages.email.replace(/\n/g, '<br>') : 'N/A'}</p>
                            </div>
                            <div class="message-box message-sms">
                                <strong>SMS:</strong>
                                <p>${task.messages?.sms || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="closeModal()" class="btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('taskModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        if (!document.getElementById('modalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'modalStyles';
            styles.textContent = `
                .modal {
                    display: flex;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    justify-content: center;
                    align-items: center;
                }
                .modal-content {
                    background-color: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 90%;
                    overflow-y: auto;
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                }
                .modal-header h3 {
                    margin: 0;
                }
                .modal-close {
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .modal-body {
                    padding: 20px;
                }
                .modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #e9ecef;
                    text-align: right;
                    background: #f8f9fa;
                }
                .detail-section {
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e9ecef;
                }
                .detail-section h4 {
                    color: #1b5e3f;
                    margin-bottom: 12px;
                }
                .entities-json {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    overflow-x: auto;
                }
                .steps-list {
                    margin: 0;
                    padding-left: 20px;
                }
                .steps-list li {
                    margin: 8px 0;
                }
                .details-btn {
                    padding: 6px 12px;
                    background: #2196f3;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .details-btn:hover {
                    background: #1976d2;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(styles);
        }
        
    } catch (error) {
        alert('Error fetching task details: ' + error.message);
    }
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.remove();
}

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

function formatIntent(intent) {
    if (!intent) return 'Unknown';
    return intent.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getRiskClass(score) {
    if (score > 60) return 'risk-high';
    if (score > 30) return 'risk-medium';
    return 'risk-low';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const resultPanel = document.getElementById('resultPanel');
    const emptyResult = document.getElementById('emptyResult');
    
    if (emptyResult) {
        emptyResult.style.display = 'none';
    }
    
    resultPanel.innerHTML = `
        <div class="message-box" style="background: #fde8e8; border-left-color: #c62828;">
            <strong>Error</strong>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    resultPanel.style.display = 'block';
}

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});