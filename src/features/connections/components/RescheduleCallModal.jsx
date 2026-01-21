import React, { useState } from 'react';
import { X, Calendar, Loader, Clock } from 'lucide-react';
import callsService from '../../../services/callsService';

const RescheduleCallModal = ({ isOpen, onClose, call, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState(call?.note || '');
  const [isLoading, setIsLoading] = useState(false);

  // Get current scheduled date/time for display
  const currentScheduledDate = call ? new Date(call.scheduled_at * 1000) : new Date();
  const formatCurrentDateTime = (date) => {
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen || !call) return null;

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      // Parse the selected date and time
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hours, minutes] = selectedTime.split(':').map(Number);

      const newScheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // Validate that the new time is in the future
      const now = new Date();
      if (newScheduledDate <= now) {
        if (onSuccess) {
          onSuccess('Please select a time in the future.');
        }
        setIsLoading(false);
        return;
      }

      // Create reschedule request instead of directly updating
      await callsService.createRescheduleRequest({
        booking_id: call.id,
        new_scheduled_at: Math.floor(newScheduledDate.getTime() / 1000),
        new_note: message
      });

      onClose();
      // Call onSuccess callback to show notification
      if (onSuccess) {
        onSuccess('Reschedule request sent! Waiting for approval.');
      }
    } catch (error) {
      console.error('Failed to reschedule call:', error);
      if (onSuccess) {
        onSuccess('Failed to reschedule call. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reschedule Call</h2>
              <p className="text-sm text-gray-600">Request a new time for your call</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Schedule Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Current Schedule</span>
            </div>
            <p className="text-sm text-blue-800 font-medium">
              {formatCurrentDateTime(currentScheduledDate)}
            </p>
            <div className="mt-2 text-xs text-blue-600">
              This request will need approval from the other party
            </div>
          </div>

          {/* New Date Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 New Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* New Time Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🕐 New Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Note/Message */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💬 Note (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note explaining why you need to reschedule..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 text-amber-600 mt-0.5">ℹ️</div>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Reschedule Request</p>
                <p>Your request will be sent to the other party for approval. You'll be notified once they respond.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-100 transition-all duration-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !selectedDate || !selectedTime}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin inline" />
                Sending Request...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2 inline" />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleCallModal;