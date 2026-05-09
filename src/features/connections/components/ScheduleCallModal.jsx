import React, { useState } from 'react';
import { X, Calendar, Loader, Clock, Video, Zap, Star } from 'lucide-react';
import callsService from '../../../services/callsService';
import { getAvatarUrlWithSize } from '../../../lib/avatarUtils';

/* ── Scoped keyframes ──────────────────────────────────────── */
const MODAL_CSS = `
  @keyframes _backdropIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes _slideUp     { from { opacity:0; transform:translateY(28px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  @keyframes _confettiUp  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-100px) rotate(540deg);opacity:0} }
  @keyframes _circleDraw  { to { stroke-dashoffset:0 } }
  @keyframes _checkDraw   { to { stroke-dashoffset:0 } }
  @keyframes _fadeUp      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes _countdown   { from{width:100%} to{width:0%} }
  @keyframes _dotPulse    { 0%,100%{opacity:0.4} 50%{opacity:1} }
`;

const CONFETTI_COLORS = ['#6366f1','#f43f5e','#f59e0b','#10b981','#3b82f6','#a855f7'];

/* ── Helpers ───────────────────────────────────────────────── */
const fmt    = (d) => d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'});
const fmtCus = (s) => { if(!s) return ''; return new Date(s).toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'}); };
const TIME_SLOTS = ['9:00 AM','11:00 AM','2:00 PM','4:00 PM','7:00 PM'];

/* ═══════════════════════════════════════════════════════════ */
const ScheduleCallModal = ({ isOpen, onClose, person, onSuccess }) => {
  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [selDate,     setSelDate]     = useState(fmt(today));
  const [selTime,     setSelTime]     = useState(null);
  const [cusDate,     setCusDate]     = useState('');
  const [cusTime,     setCusTime]     = useState('');
  const [useCustom,   setUseCustom]   = useState(false);
  const [message,     setMessage]     = useState(`Hi ${person?.name || person?.full_name || ''}, I'd love to chat about ${person?.tags?.[0] || 'your work'}!`);
  const [loading,     setLoading]     = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errMsg,      setErrMsg]      = useState('');

  const isSuperLinker = person?.is_super_linker || ((person?.connections||0)>200 && (person?.trustScore||0)>=3.0);
  const payRate       = person?.pay_rate_per_min || 0;
  const callPrice     = isSuperLinker ? payRate : 0;
  const personName    = person?.name || person?.full_name || 'them';
  const DURATION      = 30;

  /* helpers */
  const parse24 = (slot) => {
    const [h,m] = slot.replace(/AM|PM/,'').trim().split(':');
    const pm = slot.includes('PM');
    let h24 = parseInt(h,10);
    if (pm && h24!==12) h24+=12;
    if (!pm && h24===12) h24=0;
    return { h24, m:parseInt(m,10) };
  };
  const isPast = (slot) => {
    if (selDate!==fmt(today)) return false;
    const now=new Date(); const {h24,m}=parse24(slot);
    const c=new Date(); c.setHours(h24,m,0,0); return c<=now;
  };
  const draftIntro = () => {
    const focus=person?.tags?.[0]||person?.industry||'your work';
    setMessage(`Hi ${personName}, your experience in ${focus} stood out to me. I'd love to learn from your journey.`);
  };

  const hasSelection = selTime||(useCustom&&cusDate&&cusTime);

  if (!isOpen) return null;

  /* ── Send handler ── */
  const handleSend = async () => {
    setErrMsg('');
    if (!hasSelection) return;
    const hostId = person?.id||person?.user_id;
    if (!hostId){ setErrMsg('Missing recipient – reopen this profile and try again.'); return; }
    setLoading(true);
    try {
      let dt;
      if (useCustom){
        const [y,mo,d]=cusDate.split('-').map(Number);
        const [hh,mm]=cusTime.split(':').map(Number);
        dt=new Date(y,mo-1,d,hh,mm);
      } else {
        const {h24,m}=parse24(selTime); dt=new Date();
        if (selDate===fmt(tomorrow)) dt.setDate(dt.getDate()+1);
        dt.setHours(h24,m,0,0);
      }
      if (dt<=new Date()){ setErrMsg('Please select a future time.'); setLoading(false); return; }
      const res = await callsService.createCallBooking(hostId,dt,'video',message,isSuperLinker?callPrice:0,DURATION);
      setSuccessData(res);
      if (onSuccess) onSuccess('Call scheduled successfully! Waiting for confirmation.');
    } catch(e){
      const srv=e?.response?.data?.detail;
      setErrMsg(typeof srv==='string'?srv:'Failed to schedule. Please try another slot.');
      if (onSuccess) onSuccess('Failed to schedule call. Please try again.');
    } finally { setLoading(false); }
  };

  /* ══════════════════════════════════════════════════════════
     SUCCESS SCREEN
  ══════════════════════════════════════════════════════════ */
  if (successData) {
    const pieces = Array.from({length:18},(_,i)=>({
      id:i, color:CONFETTI_COLORS[i%CONFETTI_COLORS.length],
      left:`${(i*5.5)%100}%`, delay:`${(i*0.065).toFixed(2)}s`,
      size: i%3===0?10:i%3===1?7:5,
    }));
    setTimeout(()=>{ if(successData) onClose(); },5000);

    return (
      <div style={{animation:'_backdropIn 0.2s ease both'}}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
        <style>{MODAL_CSS}</style>
        <div style={{animation:'_slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both'}}
          className="bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

          {/* header */}
          <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Booking Sent 🎉</h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* confetti */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              {pieces.map(p=>(
                <span key={p.id} style={{
                  position:'absolute',left:p.left,bottom:'30%',
                  width:p.size,height:p.size,
                  borderRadius:p.id%2===0?'50%':'2px',
                  backgroundColor:p.color,
                  animation:`_confettiUp 1.15s ease-out ${p.delay} both`,
                }}/>
              ))}
            </div>

            {/* animated checkmark */}
            <div className="mb-5">
              <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
                <circle cx="38" cy="38" r="34"
                  stroke="#22c55e" strokeWidth="4" fill="none"
                  strokeDasharray="214" strokeDashoffset="214"
                  style={{animation:'_circleDraw 0.55s cubic-bezier(0.65,0,0.45,1) 0.1s forwards'}}/>
                <polyline points="20,40 32,52 55,28"
                  stroke="#22c55e" strokeWidth="5" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="76" strokeDashoffset="76"
                  style={{animation:'_checkDraw 0.32s ease-out 0.55s forwards'}}/>
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-2"
              style={{animation:'_fadeUp 0.38s ease 0.7s both'}}>
              Request Sent!
            </h3>
            <p className="text-slate-500 text-sm mb-7 max-w-xs"
              style={{animation:'_fadeUp 0.38s ease 0.85s both'}}>
              Your call request has been sent to{' '}
              <span className="font-semibold text-slate-800">{personName}</span>.
              They'll review and confirm soon.
            </p>

            <div className="w-full space-y-2.5" style={{animation:'_fadeUp 0.38s ease 0.95s both'}}>
              {successData.calendar_url && (
                <a href={successData.calendar_url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-3 px-4 rounded-2xl font-semibold text-sm transition-colors">
                  <Calendar className="w-4 h-4"/>
                  Add to Google Calendar
                </a>
              )}
              <button onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                Done
              </button>
            </div>

            {/* countdown bar */}
            <div className="mt-6 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full"
                style={{animation:'_countdown 4s linear 1s forwards',width:'100%'}}/>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Auto-closing in a few seconds…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     BOOKING FORM
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{animation:'_backdropIn 0.2s ease both'}}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
      <style>{MODAL_CSS}</style>

      <div style={{animation:'_slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both', maxHeight:'92vh'}}
        className="bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        {/* ── HEADER ── */}
        <div className="shrink-0 relative px-5 pt-5 pb-4 border-b border-slate-100 overflow-hidden">
          {/* subtle gradient stripe */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"/>
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 rounded-bl-full -z-0 pointer-events-none"/>

          <div className="flex items-start justify-between gap-3 relative">
            <div className="flex items-center gap-3">
              {/* avatar with online dot */}
              {person && (
                <div className="relative shrink-0">
                  <img src={getAvatarUrlWithSize(person,90)} alt={personName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm"/>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"/>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-0.5">
                  Schedule a Call
                </p>
                <h2 className="text-[15px] font-bold text-slate-800 leading-tight">
                  Chat with {personName}
                </h2>
              </div>
            </div>
            <button onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors mt-0.5">
              <X className="w-4 h-4 text-slate-500"/>
            </button>
          </div>

          {/* meta pills */}
          <div className="flex gap-2 mt-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-full">
              <Video className="w-3 h-3 text-indigo-500"/> Video Call
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3 text-indigo-500"/> {DURATION} min
            </span>
            {isSuperLinker && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-3 py-1.5 rounded-full">
                <Zap className="w-3 h-3 fill-amber-400 text-amber-500"/> Super Listener
              </span>
            )}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
          style={{scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>

          {/* Super Listener Fee Card */}
          {isSuperLinker && (
            <div className="rounded-2xl overflow-hidden border border-indigo-100 shadow-sm">
              {/* card header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="w-3 h-3 text-indigo-600 fill-indigo-500"/>
                  </div>
                  <span className="text-sm font-bold text-indigo-700">Consultation Fee</span>
                </div>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Super Listener
                </span>
              </div>
              {/* line items */}
              <div className="bg-white px-4 py-3 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Rate per session</span>
                  <span className="text-slate-700 font-medium">₹{payRate}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Duration</span>
                  <span className="text-slate-700 font-medium">{DURATION} minutes</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total</span>
                  <span className="text-lg font-extrabold text-indigo-600">₹{callPrice.toFixed(2)}</span>
                </div>
              </div>
              {/* note */}
              <div className="bg-indigo-50 px-4 py-2.5 border-t border-indigo-100">
                <p className="text-[11px] text-indigo-600 text-center">
                  💡 Payment only charged after {personName} accepts your request
                </p>
              </div>
            </div>
          )}

          {/* ── Choose Day ── */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Choose a Day
            </p>
            <div className="flex gap-2 flex-wrap">
              {[today, tomorrow].map(date => {
                const ds = fmt(date);
                const active = selDate===ds && !useCustom;
                return (
                  <button key={ds}
                    onClick={()=>{ setSelDate(ds); setSelTime(null); setUseCustom(false); }}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                    }`}>
                    {ds}
                  </button>
                );
              })}
              <button
                onClick={()=>{ setUseCustom(true); setSelTime(null); }}
                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                  useCustom
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                }`}>
                Custom
              </button>
            </div>
          </div>

          {/* ── Choose Time ── */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Choose a Time
            </p>

            {errMsg && (
              <div className="mb-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
                {errMsg}
              </div>
            )}

            {!useCustom ? (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(t => {
                  const past   = isPast(t);
                  const active = selTime===t;
                  return (
                    <button key={t}
                      onClick={()=>{ if(past) return; setErrMsg(''); setSelTime(t); }}
                      disabled={past}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                        active
                          ? 'bg-[#ff3b68] border-[#ff3b68] text-white shadow-[0_4px_12px_rgba(255,59,104,0.3)]'
                          : past
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-rose-200 hover:bg-rose-50'
                      }`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
                  <input type="date" value={cusDate}
                    onChange={e=>setCusDate(e.target.value)}
                    min={today.toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Time</label>
                  <input type="time" value={cusTime}
                    onChange={e=>setCusTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"/>
                </div>
              </div>
            )}
          </div>

          {/* ── Write a Note ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Write a Note <span className="normal-case font-normal text-slate-400">(optional)</span>
              </p>
              <button onClick={draftIntro}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors">
                ✨ Draft Intro
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Say something nice…"
              value={message}
              onChange={e=>setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-slate-300 bg-white leading-relaxed"
            />
          </div>

          {/* selection summary */}
          {hasSelection && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"
                style={{animation:'_dotPulse 1.5s ease-in-out infinite'}}/>
              <p className="text-sm text-green-700 font-semibold">
                {useCustom
                  ? `${fmtCus(cusDate)} at ${cusTime}`
                  : `${selDate} at ${selTime}`}
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER CTA ── */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleSend}
            disabled={!hasSelection||loading}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              !hasSelection||loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isSuperLinker
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_6px_18px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.5)]'
                  : 'bg-[#ff3b68] hover:bg-[#e8345c] text-white shadow-[0_6px_18px_rgba(255,59,104,0.35)] hover:shadow-[0_8px_24px_rgba(255,59,104,0.45)]'
            }`}>
            {loading ? (
              <><Loader className="w-4 h-4 animate-spin"/>Scheduling…</>
            ) : isSuperLinker ? (
              <>
                <Calendar className="w-4 h-4"/>
                Schedule Consultation
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-sm font-bold">
                  ₹{callPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <><Calendar className="w-4 h-4"/>Schedule Call</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCallModal;
