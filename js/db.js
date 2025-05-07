// Database configuration
const DB_NAME = 'subscription-tracker';
const DB_VERSION = 1;
const STORES = {
    subscriptions: { keyPath: 'id', autoIncrement: false },
    settings: { keyPath: 'key', autoIncrement: false }
};

// Initialize the database
export async function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            Object.entries(STORES).forEach(([storeName, config]) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, config);
                }
            });
        };
    });
}

// Open database connection
export async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

// Add a subscription
export async function addSubscription(subscription) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['subscriptions'], 'readwrite');
        const store = transaction.objectStore('subscriptions');
        const request = store.add(subscription);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to add subscription'));
    });
}

// Get all subscriptions
export async function getAllSubscriptions() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['subscriptions'], 'readonly');
        const store = transaction.objectStore('subscriptions');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get subscriptions'));
    });
}

// Get subscription by ID
export async function getSubscriptionById(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['subscriptions'], 'readonly');
        const store = transaction.objectStore('subscriptions');
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get subscription'));
    });
}

// Update subscription
export async function updateSubscription(subscription) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['subscriptions'], 'readwrite');
        const store = transaction.objectStore('subscriptions');
        const request = store.put(subscription);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to update subscription'));
    });
}

// Delete subscription
export async function deleteSubscription(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['subscriptions'], 'readwrite');
        const store = transaction.objectStore('subscriptions');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to delete subscription'));
    });
}

// Save settings
export async function saveSettings(settings) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put(settings);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to save settings'));
    });
}

// Get settings
export async function getSettings() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const settings = {};
            request.result.forEach(setting => {
                settings[setting.key] = setting.value;
            });
            resolve(settings);
        };
        request.onerror = () => reject(new Error('Failed to get settings'));
    });
}

// Export database instance
export const db = {
    addSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
    saveSettings,
    getSettings
}; 