// Analytics configuration
const CHART_COLORS = {
    primary: '#2196f3',
    secondary: '#1976d2',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    background: '#ffffff'
};

// Initialize analytics
export function initializeAnalytics(state) {
    // Initialize charts
    initializeCharts();
    
    // Update analytics with initial data
    updateAnalytics(state.subscriptions);
}

// Initialize charts
function initializeCharts() {
    // Monthly overview chart
    const monthlyChart = document.getElementById('monthly-chart');
    if (monthlyChart) {
        new Chart(monthlyChart, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Monthly Spending',
                    data: [],
                    borderColor: CHART_COLORS.primary,
                    backgroundColor: CHART_COLORS.primary + '20',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
    
    // Category breakdown chart
    const categoryChart = document.getElementById('category-chart');
    if (categoryChart) {
        new Chart(categoryChart, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: Object.values(CHART_COLORS)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

// Update analytics
export function updateAnalytics(subscriptions) {
    // Calculate analytics data
    const monthlyData = calculateMonthlyData(subscriptions);
    const categoryData = calculateCategoryData(subscriptions);
    const totalSpending = calculateTotalSpending(subscriptions);
    const averageSpending = calculateAverageSpending(subscriptions);
    
    // Update charts
    updateMonthlyChart(monthlyData);
    updateCategoryChart(categoryData);
    
    // Update summary statistics
    updateSummaryStatistics(totalSpending, averageSpending);
}

// Calculate monthly data
function calculateMonthlyData(subscriptions) {
    const monthlyData = {};
    const today = new Date();
    const months = 12;
    
    // Initialize last 12 months
    for (let i = 0; i < months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = date.toISOString().slice(0, 7);
        monthlyData[key] = 0;
    }
    
    // Calculate monthly totals
    subscriptions.forEach(subscription => {
        const date = new Date(subscription.dueDate);
        const key = date.toISOString().slice(0, 7);
        
        if (monthlyData[key] !== undefined) {
            monthlyData[key] += subscription.amount;
        }
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

// Calculate total spending
function calculateTotalSpending(subscriptions) {
    return subscriptions.reduce((total, subscription) => total + subscription.amount, 0);
}

// Calculate average spending
function calculateAverageSpending(subscriptions) {
    if (subscriptions.length === 0) return 0;
    return calculateTotalSpending(subscriptions) / subscriptions.length;
}

// Update monthly chart
function updateMonthlyChart(monthlyData) {
    const chart = Chart.getChart('monthly-chart');
    if (!chart) return;
    
    const labels = Object.keys(monthlyData).reverse();
    const data = labels.map(key => monthlyData[key]);
    
    chart.data.labels = labels.map(label => formatMonth(label));
    chart.data.datasets[0].data = data;
    chart.update();
}

// Update category chart
function updateCategoryChart(categoryData) {
    const chart = Chart.getChart('category-chart');
    if (!chart) return;
    
    const labels = Object.keys(categoryData);
    const data = labels.map(key => categoryData[key]);
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// Update summary statistics
function updateSummaryStatistics(totalSpending, averageSpending) {
    const totalElement = document.getElementById('total-spending');
    const averageElement = document.getElementById('average-spending');
    
    if (totalElement) {
        totalElement.textContent = formatCurrency(totalSpending);
    }
    
    if (averageElement) {
        averageElement.textContent = formatCurrency(averageSpending);
    }
}

// Format month
function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export analytics data
export function exportAnalyticsData(subscriptions) {
    const data = {
        monthlyData: calculateMonthlyData(subscriptions),
        categoryData: calculateCategoryData(subscriptions),
        totalSpending: calculateTotalSpending(subscriptions),
        averageSpending: calculateAverageSpending(subscriptions),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Generate spending report
export function generateSpendingReport(subscriptions) {
    const report = {
        title: 'Subscription Spending Report',
        date: new Date().toISOString(),
        summary: {
            totalSubscriptions: subscriptions.length,
            totalSpending: calculateTotalSpending(subscriptions),
            averageSpending: calculateAverageSpending(subscriptions)
        },
        monthlyBreakdown: calculateMonthlyData(subscriptions),
        categoryBreakdown: calculateCategoryData(subscriptions),
        subscriptions: subscriptions.map(sub => ({
            name: sub.name,
            amount: sub.amount,
            currency: sub.currency,
            billingCycle: sub.billingCycle,
            dueDate: sub.dueDate,
            category: sub.category
        }))
    };
    
    return report;
} 