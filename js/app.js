// Import modules
import { initializeDB } from './db.js';
import { initializeUI } from './ui.js';
import { initializeNotifications } from './notifications.js';
import { initializeAnalytics } from './analytics.js';

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
        state.subscriptions = await loadSubscriptions();
        
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
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
}

// Load subscriptions from IndexedDB
async function loadSubscriptions() {
    try {
        const db = await openDB();
        const subscriptions = await db.getAll('subscriptions');
        return subscriptions;
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        return [];
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
    
    try {
        // Save to IndexedDB
        const db = await openDB();
        await db.add('subscriptions', subscription);
        
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
        console.error('Error adding subscription:', error);
        showError('Failed to add subscription. Please try again.');
    }
}

// Update subscription list in UI
function updateSubscriptionList() {
    const container = document.getElementById('subscriptions-container');
    container.innerHTML = '';
    
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
            <span class="amount">${subscription.currency} ${subscription.amount}</span>
        </div>
        <div class="subscription-details">
            <p><strong>Billing Cycle:</strong> ${subscription.billingCycle}</p>
            <p><strong>Due Date:</strong> ${formatDate(subscription.dueDate)}</p>
            <p><strong>Category:</strong> ${subscription.category}</p>
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
    // Implement error notification
    console.error(message);
}

// Show success message
function showSuccess(message) {
    // Implement success notification
    console.log(message);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 