// UI state
let currentView = 'list';
let selectedSubscription = null;

// Initialize UI components
export function initializeUI(state) {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', state.theme);
    
    // Initialize subscription list
    updateSubscriptionList(state.subscriptions);
    
    // Initialize analytics
    updateAnalytics(state.subscriptions);
    
    // Add event listeners
    setupUIEventListeners();
}

// Setup UI event listeners
function setupUIEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.querySelector('.theme-icon').textContent = newTheme === 'light' ? '🌙' : '☀️';
    });
    
    // Add subscription button
    const addButton = document.getElementById('add-subscription');
    addButton.addEventListener('click', showAddSubscriptionModal);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', hideModal);
    });
    
    // Modal backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideModal();
            }
        });
    });
}

// Show add subscription modal
function showAddSubscriptionModal() {
    const modal = document.getElementById('subscription-modal');
    modal.classList.add('active');
    
    // Reset form
    document.getElementById('subscription-form').reset();
    
    // Set focus to first input
    document.getElementById('subscription-name').focus();
}

// Hide modal
function hideModal() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Update subscription list
export function updateSubscriptionList(subscriptions) {
    const container = document.getElementById('subscriptions-container');
    container.innerHTML = '';
    
    if (subscriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No subscriptions yet. Click the "Add Subscription" button to get started.</p>
            </div>
        `;
        return;
    }
    
    subscriptions.forEach(subscription => {
        const card = createSubscriptionCard(subscription);
        container.appendChild(card);
    });
}

// Create subscription card
function createSubscriptionCard(subscription) {
    const card = document.createElement('div');
    card.className = 'subscription-card';
    card.innerHTML = `
        <div class="subscription-header">
            <h3>${subscription.name}</h3>
            <span class="amount">${subscription.currency} ${subscription.amount}</span>
        </div>
        <div class="subscription-details">
            <p><strong>Billing Cycle:</strong> ${subscription.billingCycle}</p>
            <p><strong>Due Date:</strong> ${formatDate(subscription.dueDate)}</p>
            <p><strong>Category:</strong> ${subscription.category}</p>
            ${subscription.notes ? `<p><strong>Notes:</strong> ${subscription.notes}</p>` : ''}
        </div>
        <div class="subscription-actions">
            <button class="btn-secondary edit-btn" data-id="${subscription.id}">Edit</button>
            <button class="btn-secondary delete-btn" data-id="${subscription.id}">Delete</button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.edit-btn').addEventListener('click', () => editSubscription(subscription));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteSubscription(subscription.id));
    
    return card;
}

// Edit subscription
function editSubscription(subscription) {
    selectedSubscription = subscription;
    const modal = document.getElementById('subscription-modal');
    const form = document.getElementById('subscription-form');
    
    // Fill form with subscription data
    form.elements['subscription-name'].value = subscription.name;
    form.elements['subscription-amount'].value = subscription.amount;
    form.elements['subscription-currency'].value = subscription.currency;
    form.elements['billing-cycle'].value = subscription.billingCycle;
    form.elements['due-date'].value = subscription.dueDate;
    form.elements['category'].value = subscription.category;
    form.elements['notes'].value = subscription.notes || '';
    
    // Show modal
    modal.classList.add('active');
}

// Delete subscription
async function deleteSubscription(id) {
    if (confirm('Are you sure you want to delete this subscription?')) {
        try {
            await db.deleteSubscription(id);
            updateSubscriptionList(state.subscriptions.filter(sub => sub.id !== id));
            showNotification('Subscription deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting subscription:', error);
            showNotification('Failed to delete subscription', 'error');
        }
    }
}

// Update analytics
export function updateAnalytics(subscriptions) {
    // Monthly overview
    updateMonthlyChart(subscriptions);
    
    // Category breakdown
    updateCategoryChart(subscriptions);
}

// Update monthly chart
function updateMonthlyChart(subscriptions) {
    const monthlyData = calculateMonthlyData(subscriptions);
    // Implement chart update logic here
}

// Update category chart
function updateCategoryChart(subscriptions) {
    const categoryData = calculateCategoryData(subscriptions);
    // Implement chart update logic here
}

// Calculate monthly data
function calculateMonthlyData(subscriptions) {
    const monthlyData = {};
    subscriptions.forEach(subscription => {
        const date = new Date(subscription.dueDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        
        monthlyData[monthKey] += subscription.amount;
    });
    
    return monthlyData;
}

// Calculate category data
function calculateCategoryData(subscriptions) {
    const categoryData = {};
    subscriptions.forEach(subscription => {
        if (!categoryData[subscription.category]) {
            categoryData[subscription.category] = 0;
        }
        
        categoryData[subscription.category] += subscription.amount;
    });
    
    return categoryData;
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    });
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
} 