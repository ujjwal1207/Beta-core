import React, { useState } from 'react';
import { X, Calendar, Loader, Clock } from 'lucide-react';
import Button from '../../../components/ui/Button';
import callsService from '../../../services/callsService';

const ScheduleCallModal = ({ isOpen, onClose, person, onSuccess }) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeSlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '7:00 PM'];
  
  // Helper function to format custom date for display
  const formatCustomDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [selectedTime, setSelectedTime] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [message, setMessage] = useState(`Hi ${person?.name || ''}, I'd love to chat about ${person?.tags?.[0] || 'your work'}!`);
  const [isLoading, setIsLoading] = useState(false);

  const isSuperLinker = (person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0;
  const callPrice = 500;

  if (!isOpen) return null;

  const handleSend = async () => {
    if ((!selectedTime && !useCustomTime) || (useCustomTime && (!customDate || !customTime))) return;

    setIsLoading(true);
    try {
      let scheduledDate;

      if (useCustomTime) {
        // Parse custom date and time
        const [year, month, day] = customDate.split('-').map(Number);
        const [hours, minutes] = customTime.split(':').map(Number);
        
        scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      } else {
        // Parse the selected date and time from predefined slots
        const [hours, minutes] = selectedTime.replace(/AM|PM/, '').trim().split(':');
        const isPM = selectedTime.includes('PM');
        let hour24 = parseInt(hours);
        
        if (isPM && hour24 !== 12) hour24 += 12;
        if (!isPM && hour24 === 12) hour24 = 0;

        // Create the scheduled date/time
        scheduledDate = new Date();
        if (selectedDate === formatDate(tomorrow)) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
        scheduledDate.setHours(hour24, parseInt(minutes), 0, 0);
      }

      // Validate that the scheduled time is in the future
      const now = new Date();
      if (scheduledDate <= now) {
        if (onSuccess) {
          onSuccess('Please select a time in the future.');
        }
        setIsLoading(false);
        return;
      }

      // Create the call booking
      await callsService.createCallBooking(
        person.id,
        scheduledDate,
        'video', // Default to video call
        message,
        isSuperLinker ? callPrice : 0
      );

      onClose();
      // Call onSuccess callback to show notification
      if (onSuccess) {
        onSuccess('Call scheduled successfully! Waiting for confirmation.');
      }
    } catch (error) {
      console.error('Failed to schedule call:', error);
      // You could add error handling here, maybe show an error message
      if (onSuccess) {
        onSuccess('Failed to schedule call. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"> 
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-800">Schedule a chat with {person.name}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {isSuperLinker && (
            <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg mb-6">
              <p className="text-lg font-bold text-indigo-700">₹{callPrice} per call</p>
              <p className="text-sm text-indigo-600">This is a Super ListenLinker. Payment is processed *after* the call is completed.</p>
            </div>
          )}

          <h3 className="text-base font-bold text-slate-800 mb-3">Choose a Day</h3>
          <div className="flex space-x-3 mb-6">
            {[today, tomorrow].map(date => {
              const dateStr = formatDate(date);
              return (
                <button 
                  key={dateStr} 
                  onClick={() => { 
                    setSelectedDate(dateStr); 
                    setSelectedTime(null); 
                    setUseCustomTime(false);
                  }} 
                  className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-colors active:scale-[0.98] ${
                    selectedDate === dateStr && !useCustomTime
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {dateStr}
                </button>
              );
            })}
            <button 
              onClick={() => {
                setUseCustomTime(true);
                setSelectedTime(null);
              }}
              className={`px-4 py-2 rounded-xl border font-semibold text-sm transition-colors active:scale-[0.98] ${
                useCustomTime
                  ? 'bg-rose-500 text-white border-rose-500' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Custom Date
            </button>
          </div>
          
          <h3 className="text-base font-bold text-slate-800 mb-3">Choose the Time</h3>
          
          {!useCustomTime ? (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {timeSlots.map(time => (
                <button 
                  key={time} 
                  onClick={() => setSelectedTime(time)} 
                  className={`py-2 rounded-lg border font-medium text-sm transition-colors active:scale-[0.98] ${
                    selectedTime === time 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={today.toISOString().split('T')[0]}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Time</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          )}
          
          <h3 className="text-base font-bold text-slate-800 mb-3">Write a Note (Optional)</h3>
          <textarea 
            className="w-full p-3 border border-slate-300 rounded-xl resize-none focus:ring-indigo-500 focus:border-indigo-500 text-sm" 
            rows="3" 
            placeholder="Say hello!" 
            value={message} 
            onChange={e => setMessage(e.target.value)}
          />
          {(selectedTime || (useCustomTime && customDate && customTime)) && (
            <p className="mt-3 text-sm font-semibold text-green-600">
              You picked: {useCustomTime ? `${formatCustomDate(customDate)} at ${customTime}` : `${selectedDate} at ${selectedTime}`}
            </p>
          )}
        </div>
        <div className="p-6 border-t border-slate-200">
          <Button onClick={handleSend} disabled={(!selectedTime && !useCustomTime) || (useCustomTime && (!customDate || !customTime)) || isLoading}>
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Scheduling...
              </>
            ) : (
              isSuperLinker ? `Schedule Call (₹${callPrice})` : 'Schedule Call'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCallModal;
