// Import modules
import { initializeDB, openDB, addSubscription, getAllSubscriptions } from './db.js';
import { initializeUI, updateUI } from './ui.js';
import { initializeNotifications } from './notifications.js';
import { initializeAnalytics } from './analytics.js';
import { ErrorTypes, errorHandler } from './utils/error-handler.js';

// App state
const state = {
    subscriptions: [],
    theme: localStorage.getItem('theme') || 'light',
    currency: localStorage.getItem('currency') || 'USD'
};

// Initialize the application
async function initializeApp() {
    try {
        // Initialize IndexedDB
        await initializeDB();
        
        // Load subscriptions from IndexedDB
        state.subscriptions = await getAllSubscriptions();
        
        // Initialize UI components
        initializeUI(state);
        
        // Initialize notifications
        initializeNotifications(state);
        
        // Initialize analytics
        initializeAnalytics(state);
        
        // Set initial theme
        document.documentElement.setAttribute('data-theme', state.theme);
        
        // Add event listeners
        setupEventListeners();
        
        // Update UI with initial data
        updateSubscriptionList();
        
        console.log('Application initialized successfully');
    } catch (error) {
        errorHandler.handleError(error, ErrorTypes.DATABASE);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);
    
    // Add subscription button
    const addButton = document.getElementById('add-subscription');
    addButton.addEventListener('click', () => {
        document.getElementById('subscription-modal').classList.add('active');
    });
    
    // Cancel subscription button
    const cancelButton = document.getElementById('cancel-subscription');
    cancelButton.addEventListener('click', () => {
        document.getElementById('subscription-modal').classList.remove('active');
    });
    
    // Subscription form
    const subscriptionForm = document.getElementById('subscription-form');
    subscriptionForm.addEventListener('submit', handleSubscriptionSubmit);
}

// Toggle theme
function toggleTheme() {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    state.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update theme icon
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
}

// Handle subscription form submission
async function handleSubscriptionSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const subscription = {
            id: Date.now().toString(),
            name: formData.get('subscription-name'),
            amount: parseFloat(formData.get('subscription-amount')),
            currency: formData.get('subscription-currency'),
            billingCycle: formData.get('billing-cycle'),
            dueDate: formData.get('due-date'),
            category: formData.get('category'),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };
        
        // Validate required fields
        if (!subscription.name || !subscription.amount || !subscription.dueDate) {
            throw new Error('Please fill in all required fields');
        }
        
        // Save to IndexedDB
        await addSubscription(subscription);
        
        // Update state
        state.subscriptions.push(subscription);
        
        // Update UI
        updateSubscriptionList();
        
        // Close modal
        document.getElementById('subscription-modal').classList.remove('active');
        
        // Reset form
        event.target.reset();
        
        // Show success message
        showSuccess('Subscription added successfully');
    } catch (error) {
        errorHandler.handleError(error, ErrorTypes.VALIDATION);
    }
}

// Update subscription list in UI
function updateSubscriptionList() {
    const container = document.getElementById('subscriptions-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.subscriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No subscriptions yet. Click the "Add Subscription" button to get started.</p>
            </div>
        `;
        return;
    }
    
    state.subscriptions.forEach(subscription => {
        const card = createSubscriptionCard(subscription);
        container.appendChild(card);
    });
}

// Create subscription card element
function createSubscriptionCard(subscription) {
    const card = document.createElement('div');
    card.className = 'subscription-card';
    card.innerHTML = `
        <div class="subscription-header">
            <h3>${subscription.name}</h3>
            <span class="amount">${subscription.currency} ${subscription.amount.toFixed(2)}</span>
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
    card.querySelector('.edit-btn').addEventListener('click', () => editSubscription(subscription.id));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteSubscription(subscription.id));
    
    return card;
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show error message
function showError(message) {
    errorHandler.handleError(new Error(message), ErrorTypes.UNKNOWN);
}

// Show success message
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 