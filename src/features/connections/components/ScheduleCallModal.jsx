import React, { useState } from 'react';
import { X, Calendar, Loader, Clock, CheckCircle } from 'lucide-react';
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
  const [selectedDuration, setSelectedDuration] = useState(30); // Default to 30 minutes
  const [message, setMessage] = useState(`Hi ${person?.name || ''}, I'd love to chat about ${person?.tags?.[0] || 'your work'}!`);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null); // Will store booking response including calendar_url

  const isSuperLinker = person?.is_super_linker || ((person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0);
  const payRatePerMin = person?.pay_rate_per_min || 0;
  const callPrice = isSuperLinker ? selectedDuration * payRatePerMin : 0;

  // Common duration options in minutes
  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

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
      const bookingResponse = await callsService.createCallBooking(
        person.id,
        scheduledDate,
        'video', // Default to video call
        message,
        isSuperLinker ? callPrice : 0,
        selectedDuration // Pass duration to backend
      );

      // Show success screen inside modal instead of closing immediately
      setSuccessData(bookingResponse);
      
      // Call onSuccess callback to show notification (optional now since modal stays open)
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
          <h2 className="text-xl font-extrabold text-slate-800">
            {successData ? 'Booking Sent' : `Schedule a chat with ${person?.name}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {successData ? (
          <div className="p-8 flex flex-col items-center justify-center text-center flex-grow">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Request Sent!</h3>
            <p className="text-slate-600 mb-8 max-w-sm">
              Your call request has been sent to {person?.name || 'the host'}. They will review and confirm it soon.
            </p>
            
            {successData.calendar_url && (
               <a 
                href={successData.calendar_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Calendar className="w-5 h-5" />
                Add to Google Calendar
              </a>
            )}
            
            <Button onClick={onClose} variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="p-6 overflow-y-auto flex-grow">
              {isSuperLinker && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-indigo-700">💰 Consultation Fee</h4>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">Super Listener</span>
              </div>
              
              {/* Duration Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-indigo-700 mb-2">Call Duration</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                  className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Calculation Display */}
              <div className="bg-white border border-indigo-200 rounded-lg p-3 mb-2">
                <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                  <span>Rate per minute:</span>
                  <span>₹{payRatePerMin}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                  <span>Duration:</span>
                  <span>{selectedDuration} minutes</span>
                </div>
                <hr className="border-slate-200 mb-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-700">Total Fee:</span>
                  <span className="font-bold text-lg text-indigo-700">₹{callPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <p className="text-xs text-indigo-600 text-center">
                💡 Payment required after Super Listener accepts your request
              </p>
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
              isSuperLinker ? (
                <span className="flex items-center justify-center gap-2">
                  📅 Schedule Consultation
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
                    ₹{callPrice.toFixed(2)}
                  </span>
                </span>
              ) : (
                'Schedule Call'
              )
            )}
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ScheduleCallModal;
