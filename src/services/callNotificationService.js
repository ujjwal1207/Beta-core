import callsService from './callsService.js';

class CallNotificationService {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 30000; // Check every 30 seconds
    this.onIncomingCall = null;
  }

  /**
   * Start polling for upcoming scheduled calls
   * @param {Function} onIncomingCall - Callback function when a call is starting soon
   */
  startPolling(onIncomingCall) {
    this.onIncomingCall = onIncomingCall;
    this.stopPolling(); // Clear any existing interval

    this.intervalId = setInterval(async () => {
      try {
        const upcomingCalls = await callsService.getUpcomingScheduledCalls();

        if (upcomingCalls && upcomingCalls.length > 0) {
          // For each upcoming call, trigger the notification
          upcomingCalls.forEach(call => {
            if (this.onIncomingCall) {
              this.onIncomingCall(call);
            }
          });
        }
      } catch (error) {
        console.error('Error checking for upcoming calls:', error);
      }
    }, this.checkInterval);

    console.log('Call notification polling started');
  }

  /**
   * Stop polling for upcoming calls
   */
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Call notification polling stopped');
    }
  }

  /**
   * Check if polling is currently active
   * @returns {boolean} True if polling is active
   */
  isPolling() {
    return this.intervalId !== null;
  }
}

// Create a singleton instance
const callNotificationService = new CallNotificationService();

export default callNotificationService;