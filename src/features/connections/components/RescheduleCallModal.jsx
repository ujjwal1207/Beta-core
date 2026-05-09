import React, { useState } from 'react';
import { X, Calendar, Loader, Clock, Video, RotateCcw } from 'lucide-react';
import callsService from '../../../services/callsService';
import { getAvatarUrlWithSize } from '../../../lib/avatarUtils';

/* ── Scoped keyframes ────────────────────────────────────── */
const MODAL_CSS = `
  @keyframes _rBdIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes _rSlide { from { opacity:0; transform:translateY(28px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes _rDot   { 0%,100%{opacity:0.4} 50%{opacity:1} }
`;

/* ═══════════════════════════════════════════════════════════ */
const RescheduleCallModal = ({ isOpen, onClose, call, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message,      setMessage]      = useState(call?.note || '');
  const [isLoading,    setIsLoading]    = useState(false);
  const [errMsg,       setErrMsg]       = useState('');

  if (!isOpen || !call) return null;

  /* helpers */
  const currentScheduledDate = new Date(call.scheduled_at * 1000);
  const formatCurrentDateTime = (date) => {
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short',
      day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const otherParty = call.booker || call.host || null;
  const personName = otherParty?.full_name || otherParty?.name || 'Other Party';
  const hasSelection = selectedDate && selectedTime;

  /* format picked date/time nicely */
  const formatPickedDate = () => {
    if (!selectedDate) return '';
    return new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };

  const handleReschedule = async () => {
    setErrMsg('');
    if (!hasSelection) return;
    setIsLoading(true);
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hours, minutes]   = selectedTime.split(':').map(Number);
      const newDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      if (newDate <= new Date()) {
        setErrMsg('Please select a time in the future.');
        setIsLoading(false);
        return;
      }

      await callsService.createRescheduleRequest({
        booking_id:       call.id,
        new_scheduled_at: Math.floor(newDate.getTime() / 1000),
        new_note:         message,
      });

      onClose();
      if (onSuccess) onSuccess('Reschedule request sent! Waiting for approval.');
    } catch (error) {
      console.error('Failed to reschedule call:', error);
      setErrMsg('Failed to send reschedule request. Please try again.');
      if (onSuccess) onSuccess('Failed to reschedule call. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ animation: '_rBdIn 0.2s ease both' }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
      <style>{MODAL_CSS}</style>

      <div style={{ animation: '_rSlide 0.32s cubic-bezier(0.22,1,0.36,1) both', maxHeight: '92vh' }}
        className="bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        {/* ── HEADER ── */}
        <div className="shrink-0 relative px-5 pt-5 pb-4 border-b border-slate-100 overflow-hidden">
          {/* top gradient stripe */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 rounded-bl-full -z-0 pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative">
            <div className="flex items-center gap-3">
              {/* avatar */}
              {otherParty && (
                <div className="relative shrink-0">
                  <img
                    src={getAvatarUrlWithSize(otherParty, 90)}
                    alt={personName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-0.5">
                  Reschedule Call
                </p>
                <h2 className="text-[15px] font-bold text-slate-800 leading-tight">
                  Request new time with {personName}
                </h2>
              </div>
            </div>
            <button onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors mt-0.5">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* meta pills */}
          <div className="flex gap-2 mt-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-full">
              <Video className="w-3 h-3 text-indigo-500" />
              {call.call_type === 'voice' ? 'Voice Call' : 'Video Call'}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" />
              Currently: {formatCurrentDateTime(currentScheduledDate)}
            </span>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>

          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <RotateCcw className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-indigo-700 leading-relaxed">
              Your request will be sent to <span className="font-semibold">{personName}</span> for approval. You'll be notified once they respond.
            </p>
          </div>

          {/* Error message */}
          {errMsg && (
            <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
              {errMsg}
            </div>
          )}

          {/* New Date */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">New Date</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
            />
          </div>

          {/* New Time */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">New Time</p>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
            />
          </div>

          {/* Note */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Note <span className="normal-case font-normal">(optional)</span>
            </p>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain why you need to reschedule…"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-slate-300 bg-white leading-relaxed"
            />
          </div>

          {/* Selection summary */}
          {hasSelection && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"
                style={{ animation: '_rDot 1.5s ease-in-out infinite' }} />
              <p className="text-sm text-green-700 font-semibold">
                {formatPickedDate()} at {selectedTime}
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER CTA ── */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={!hasSelection || isLoading}
              className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                !hasSelection || isLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_6px_18px_rgba(99,102,241,0.35)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.45)]'
              }`}>
              {isLoading ? (
                <><Loader className="w-4 h-4 animate-spin" />Sending…</>
              ) : (
                <><Calendar className="w-4 h-4" />Send Reschedule Request</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleCallModal;