// Error types
export const ErrorTypes = {
    DATABASE: 'DATABASE_ERROR',
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
};

// Error handler class
export class ErrorHandler {
    static async handleError(error, type = ErrorTypes.UNKNOWN) {
        console.error(`[${type}]`, error);

        // Log error to analytics if available
        if (window.analytics) {
            window.analytics.logError({
                type,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }

        // Show user-friendly error message
        this.showErrorMessage(error, type);

        // Handle specific error types
        switch (type) {
            case ErrorTypes.DATABASE:
                await this.handleDatabaseError(error);
                break;
            case ErrorTypes.NETWORK:
                await this.handleNetworkError(error);
                break;
            case ErrorTypes.VALIDATION:
                this.handleValidationError(error);
                break;
            case ErrorTypes.AUTH:
                this.handleAuthError(error);
                break;
            default:
                this.handleUnknownError(error);
        }
    }

    static showErrorMessage(error, type) {
        const message = this.getUserFriendlyMessage(error, type);
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    static getUserFriendlyMessage(error, type) {
        const messages = {
            [ErrorTypes.DATABASE]: 'Unable to save your data. Please try again.',
            [ErrorTypes.NETWORK]: 'Network connection issue. Please check your internet connection.',
            [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
            [ErrorTypes.AUTH]: 'Authentication error. Please log in again.',
            [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
        };

        return messages[type] || messages[ErrorTypes.UNKNOWN];
    }

    static async handleDatabaseError(error) {
        // Attempt to recover from database errors
        try {
            // Check if IndexedDB is available
            if (!window.indexedDB) {
                throw new Error('IndexedDB is not supported');
            }

            // Try to reinitialize the database
            await window.db.initialize();
        } catch (recoveryError) {
            console.error('Database recovery failed:', recoveryError);
        }
    }

    static async handleNetworkError(error) {
        // Handle offline mode
        if (!navigator.onLine) {
            // Enable offline features
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('sync-subscriptions');
                } catch (syncError) {
                    console.error('Background sync registration failed:', syncError);
                }
            }
        }
    }

    static handleValidationError(error) {
        // Highlight invalid form fields
        const form = document.querySelector('form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.validationMessage) {
                    input.classList.add('invalid');
                }
            });
        }
    }

    static handleAuthError(error) {
        // Redirect to login if needed
        if (error.message.includes('unauthorized')) {
            window.location.href = '/login';
        }
    }

    static handleUnknownError(error) {
        // Log to error tracking service if available
        if (window.errorTracking) {
            window.errorTracking.captureException(error);
        }
    }
}

// Export error handler instance
export const errorHandler = new ErrorHandler(); 