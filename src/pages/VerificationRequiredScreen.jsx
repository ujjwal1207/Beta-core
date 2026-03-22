import React from 'react';
import { ShieldAlert, ArrowLeft, GraduationCap, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const VerificationRequiredScreen = () => {
  const { setScreen, previousScreen, verificationMessage, user } = useAppContext();

  const isPending = user?.education && user.education.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-amber-200 rounded-3xl shadow-xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">
          {isPending ? 'Approval Pending' : 'University Verification Required'}
        </h1>
        <p className="text-slate-600 mb-5">{verificationMessage}</p>

        {isPending ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 mb-6">
            <h2 className="text-sm font-bold text-teal-800 mb-2 uppercase tracking-wide">Status: Pending Review</h2>
            <p className="text-sm text-teal-700">
              Your profile has been submitted and is currently in the queue for admin approval. You will receive an email once it is verified.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">What you can do now</h2>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>1. Open your profile and complete education details.</li>
              <li>2. Save your profile and wait for university admin approval.</li>
              <li>3. After approval, all app features unlock automatically.</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setScreen('USER_PROFILE')}
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors"
          >
            {isPending ? (
              <><User className="w-4 h-4 mr-2" /> Go to your profile</>
            ) : (
              <><GraduationCap className="w-4 h-4 mr-2" /> Complete Education Info</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequiredScreen;
