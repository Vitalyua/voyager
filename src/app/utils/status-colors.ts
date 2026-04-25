export function getBookingStatusColor(status: string): string {
    switch (status) {
        case 'Confirmed':
            return '#22c55e';
        case 'Pending':
            return '#f59e0b';
        case 'Under Review':
            return '#3b82f6';
        case 'Rejected':
            return '#ef4444';
        case 'Cancelled':
            return '#6b7280';
        default:
            return '#6b7280';
    }
}

export function getFlightStatusColor(status: string): string {
    switch (status) {
        case 'On Time':
            return '#22c55e';
        case 'Scheduled':
            return '#3b82f6';
        case 'Delayed':
            return '#f59e0b';
        case 'Departed':
            return '#8b5cf6';
        case 'Arrived':
            return '#6b7280';
        default:
            return '#6b7280';
    }
}

export function getUtilizationColor(percent: number): string {
    if (percent >= 85) return '#ef4444';
    if (percent >= 60) return '#f59e0b';
    return '#22c55e';
}
