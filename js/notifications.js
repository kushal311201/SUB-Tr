// Notification settings
const DEFAULT_REMINDER_DAYS = 3;
const NOTIFICATION_TYPES = {
    PUSH: 'push',
    EMAIL: 'email'
};

// Initialize notifications
export async function initializeNotifications(state) {
    // Request notification permission
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted');
        }
    }
    
    // Check for upcoming payments
    checkUpcomingPayments(state.subscriptions);
}

// Check for upcoming payments
function checkUpcomingPayments(subscriptions) {
    const today = new Date();
    const reminderDays = parseInt(localStorage.getItem('reminderDays')) || DEFAULT_REMINDER_DAYS;
    
    subscriptions.forEach(subscription => {
        const dueDate = new Date(subscription.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= reminderDays && daysUntilDue > 0) {
            sendPaymentReminder(subscription, daysUntilDue);
        }
    });
}

// Send payment reminder
function sendPaymentReminder(subscription, daysUntilDue) {
    const message = `Payment of ${subscription.currency} ${subscription.amount} for ${subscription.name} is due in ${daysUntilDue} days.`;
    
    // Send push notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Payment Reminder', {
            body: message,
            icon: '/images/icon-192.png'
        });
    }
    
    // Send email notification if enabled
    if (localStorage.getItem('emailNotifications') === 'true') {
        sendEmailNotification(subscription, message);
    }
}

// Send email notification
async function sendEmailNotification(subscription, message) {
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: email,
                subject: 'Payment Reminder',
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send email notification');
        }
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
}

// Schedule notification
export function scheduleNotification(subscription) {
    const dueDate = new Date(subscription.dueDate);
    const reminderDays = parseInt(localStorage.getItem('reminderDays')) || DEFAULT_REMINDER_DAYS;
    const reminderDate = new Date(dueDate.getTime() - (reminderDays * 24 * 60 * 60 * 1000));
    
    // Store notification in IndexedDB
    const notification = {
        id: Date.now().toString(),
        subscriptionId: subscription.id,
        type: NOTIFICATION_TYPES.PUSH,
        message: `Payment of ${subscription.currency} ${subscription.amount} for ${subscription.name} is due in ${reminderDays} days.`,
        scheduledFor: reminderDate.toISOString()
    };
    
    return db.addNotification(notification);
}

// Cancel notification
export function cancelNotification(notificationId) {
    return db.deleteNotification(notificationId);
}

// Update notification settings
export function updateNotificationSettings(settings) {
    localStorage.setItem('reminderDays', settings.reminderDays);
    localStorage.setItem('emailNotifications', settings.emailNotifications);
    localStorage.setItem('pushNotifications', settings.pushNotifications);
    
    // Update existing notifications
    if (settings.reminderDays !== DEFAULT_REMINDER_DAYS) {
        updateExistingNotifications(settings.reminderDays);
    }
}

// Update existing notifications
async function updateExistingNotifications(newReminderDays) {
    const notifications = await db.getAllNotifications();
    
    notifications.forEach(async notification => {
        const subscription = await db.getSubscriptionById(notification.subscriptionId);
        if (subscription) {
            await cancelNotification(notification.id);
            await scheduleNotification(subscription);
        }
    });
}

// Show notification settings modal
export function showNotificationSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Notification Settings</h2>
            <form id="notification-settings-form">
                <div class="form-group">
                    <label for="reminder-days">Days before due date to send reminder</label>
                    <input type="number" id="reminder-days" min="1" max="30" value="${localStorage.getItem('reminderDays') || DEFAULT_REMINDER_DAYS}">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="email-notifications" ${localStorage.getItem('emailNotifications') === 'true' ? 'checked' : ''}>
                        Enable email notifications
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="push-notifications" ${localStorage.getItem('pushNotifications') === 'true' ? 'checked' : ''}>
                        Enable push notifications
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="cancel-settings">Cancel</button>
                    <button type="submit" class="btn-primary">Save Settings</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));
    
    // Add event listeners
    const form = modal.querySelector('#notification-settings-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const settings = {
            reminderDays: parseInt(form.elements['reminder-days'].value),
            emailNotifications: form.elements['email-notifications'].checked,
            pushNotifications: form.elements['push-notifications'].checked
        };
        
        updateNotificationSettings(settings);
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    });
    
    modal.querySelector('#cancel-settings').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    });
} 