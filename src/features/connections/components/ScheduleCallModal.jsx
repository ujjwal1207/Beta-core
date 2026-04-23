import React, { useState } from 'react';
import { X, Calendar, Loader } from 'lucide-react';
import Button from '../../../components/ui/Button';
import callsService from '../../../services/callsService';

const ScheduleCallModal = ({ isOpen, onClose, person, onSuccess }) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeSlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '7:00 PM'];

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
  const selectedDuration = 30;
  const [message, setMessage] = useState(`Hi ${person?.name || ''}, I'd love to chat about ${person?.tags?.[0] || 'your work'}!`);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const parseTimeSlotTo24h = (slot) => {
    const [hours, minutes] = slot.replace(/AM|PM/, '').trim().split(':');
    const isPM = slot.includes('PM');
    let hour24 = parseInt(hours, 10);
    if (isPM && hour24 !== 12) hour24 += 12;
    if (!isPM && hour24 === 12) hour24 = 0;
    return { hour24, minutes: parseInt(minutes, 10) };
  };

  const isPastPresetTime = (slot) => {
    if (selectedDate !== formatDate(today)) return false;
    const now = new Date();
    const { hour24, minutes } = parseTimeSlotTo24h(slot);
    const candidate = new Date();
    candidate.setHours(hour24, minutes, 0, 0);
    return candidate <= now;
  };

  const handleDraftIntro = () => {
    const focus = person?.tags?.[0] || person?.industry || 'your work';
    const name = person?.name || person?.full_name || 'there';
    setMessage(`Hi ${name}, your experience in ${focus} stood out to me. I would love to chat and learn from your journey.`);
  };

  const isSuperLinker = person?.is_super_linker || ((person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0);
  const payRatePerMin = person?.pay_rate_per_min || 0;
  const callPrice = isSuperLinker ? payRatePerMin : 0;

  if (!isOpen) return null;

  const handleSend = async () => {
    setErrorMessage('');
    if ((!selectedTime && !useCustomTime) || (useCustomTime && (!customDate || !customTime))) return;

    const hostId = person?.id || person?.user_id;
    if (!hostId) {
      setErrorMessage('Unable to schedule: missing recipient id. Please reopen this profile and try again.');
      return;
    }

    setIsLoading(true);
    try {
      let scheduledDate;

      if (useCustomTime) {
        const [year, month, day] = customDate.split('-').map(Number);
        const [hours, minutes] = customTime.split(':').map(Number);
        scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      } else {
        const { hour24, minutes } = parseTimeSlotTo24h(selectedTime);
        scheduledDate = new Date();
        if (selectedDate === formatDate(tomorrow)) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
        scheduledDate.setHours(hour24, minutes, 0, 0);
      }

      const now = new Date();
      if (scheduledDate <= now) {
        setErrorMessage('Please select a future time.');
        if (onSuccess) onSuccess('Please select a time in the future.');
        setIsLoading(false);
        return;
      }

      const bookingResponse = await callsService.createCallBooking(
        hostId,
        scheduledDate,
        'video',
        message,
        isSuperLinker ? callPrice : 0,
        selectedDuration
      );

      setSuccessData(bookingResponse);
      if (onSuccess) onSuccess('Call scheduled successfully! Waiting for confirmation.');
    } catch (error) {
      console.error('Failed to schedule call:', error);
      const serverError = error?.response?.data?.detail;
      setErrorMessage(typeof serverError === 'string' ? serverError : 'Failed to schedule call. Please try another slot.');
      if (onSuccess) onSuccess('Failed to schedule call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Animated success screen ─────────────────────────── */
  if (successData) {
    const CONFETTI_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'];
    const confettiPieces = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${(i * 5.5) % 100}%`,
      delay: `${(i * 0.07).toFixed(2)}s`,
      size: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
    }));

    setTimeout(() => { if (successData) onClose(); }, 5000);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <style>{`
          @keyframes confettiFloat { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(-100px) rotate(360deg); opacity: 0; } }
          @keyframes circleDraw { to { stroke-dashoffset: 0; } }
          @keyframes checkmarkDraw { to { stroke-dashoffset: 0; } }
          @keyframes successFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes countdownBar { from { width: 100%; } to { width: 0%; } }
        `}</style>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <h2 className="text-xl font-extrabold text-slate-800">Booking Sent</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {confettiPieces.map(p => (
                <span
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: p.left,
                    bottom: '30%',
                    width: p.size,
                    height: p.size,
                    borderRadius: p.id % 2 === 0 ? '50%' : '2px',
                    backgroundColor: p.color,
                    animation: `confettiFloat 1.1s ease-out ${p.delay} both`,
                  }}
                />
              ))}
            </div>

            <div className="relative mb-6">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
                  cx="40" cy="40" r="36"
                  stroke="#22c55e" strokeWidth="4.5" fill="none"
                  strokeDasharray="226" strokeDashoffset="226"
                  style={{ animation: 'circleDraw 0.55s cubic-bezier(0.65,0,0.45,1) 0.1s forwards' }}
                />
                <polyline
                  points="22,42 34,54 57,30"
                  stroke="#22c55e" strokeWidth="5" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="80" strokeDashoffset="80"
                  style={{ animation: 'checkmarkDraw 0.35s ease-out 0.55s forwards' }}
                />
              </svg>
            </div>

            <h3
              className="text-2xl font-bold text-slate-800 mb-2"
              style={{ animation: 'successFadeUp 0.4s ease 0.7s both' }}
            >
              Request Sent!
            </h3>
            <p
              className="text-slate-600 mb-8 max-w-sm"
              style={{ animation: 'successFadeUp 0.4s ease 0.85s both' }}
            >
              Your call request has been sent to <strong>{person?.name || person?.full_name || 'the host'}</strong>. They will review and confirm it soon.
            </p>

            <div className="w-full space-y-3" style={{ animation: 'successFadeUp 0.4s ease 0.95s both' }}>
              {successData.calendar_url && (
                <a
                  href={successData.calendar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Calendar className="w-5 h-5" />
                  Add to Google Calendar
                </a>
              )}
              <Button onClick={onClose} variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                Done
              </Button>
            </div>

            <div className="mt-6 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ animation: 'countdownBar 4s linear 1s forwards', width: '100%' }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Auto-closing in a few seconds…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Booking form ──────────────────────────────────────── */
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-800">
            {`Schedule a chat with ${person?.name}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {isSuperLinker && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-indigo-700">💰 Consultation Fee</h4>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">Super Listener</span>
              </div>
              <div className="bg-white border border-indigo-200 rounded-lg p-3 mb-2">
                <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                  <span>Rate per session:</span>
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
                  onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); setUseCustomTime(false); }}
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
              onClick={() => { setUseCustomTime(true); setSelectedTime(null); }}
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

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
              {errorMessage}
            </div>
          )}

          {!useCustomTime ? (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {timeSlots.map(time => {
                const isPast = isPastPresetTime(time);
                return (
                  <button
                    key={time}
                    onClick={() => { if (isPast) return; setErrorMessage(''); setSelectedTime(time); }}
                    disabled={isPast}
                    className={`py-2 rounded-lg border font-medium text-sm transition-colors active:scale-[0.98] ${
                      selectedTime === time
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isPast
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
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

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-slate-800">Write a Note (Optional)</h3>
            <button
              onClick={handleDraftIntro}
              className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Draft Intro
            </button>
          </div>
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
          <Button
            onClick={handleSend}
            disabled={(!selectedTime && !useCustomTime) || (useCustomTime && (!customDate || !customTime)) || isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Scheduling...
              </>
            ) : isSuperLinker ? (
              <span className="flex items-center justify-center gap-2">
                📅 Schedule Consultation
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
                  ₹{callPrice.toFixed(2)}
                </span>
              </span>
            ) : (
              'Schedule Call'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCallModal;
