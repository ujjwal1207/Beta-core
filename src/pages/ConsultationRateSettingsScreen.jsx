import React, { useState } from 'react';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import userService from '../services/userService';

export const ConsultationRateSettingsScreen = () => {
  const { setScreen, user, showToast, updateUserProfile } = useAppContext();
  const [payRate, setPayRate] = useState(user?.pay_rate_per_min?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveRate = async () => {
    if (!payRate || parseFloat(payRate) <= 0) {
      showToast('Please enter a valid rate greater than ₹0.00', 'error');
      return;
    }

    if (parseFloat(payRate) > 500) {
      showToast('Rate cannot exceed ₹500.00 per minute', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        pay_rate_per_min: parseFloat(payRate)
      });
      
      showToast('Consultation rate updated successfully!', 'success');
      setScreen('SETTINGS');
    } catch (error) {
      console.error('Failed to update pay rate:', error);
      showToast('Failed to update rate. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (value) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setPayRate(value);
    }
  };

  const suggestedRates = [500, 1000, 2000, 3000, 5000, 10000];

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <div className="p-4 pt-6 bg-white shadow-sm">
        <button 
          onClick={() => setScreen('SETTINGS')} 
          className="p-2 rounded-full hover:bg-slate-100 mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Consultation Rate</h1>
        <p className="text-slate-600 text-sm">Set your rate per minute for consultations</p>
      </div>
      
      <div className="flex-grow p-4 space-y-6">
        {/* Current Rate Display */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center mb-4">
            <span className="w-6 h-6 text-green-500 mr-3 text-xl font-bold">₹</span>
            <h2 className="text-lg font-semibold text-slate-800">Your Rate</h2>
          </div>
          
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-xl font-semibold">₹</span>
            <input
              type="text"
              value={payRate}
              onChange={(e) => handleRateChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-16 py-4 text-3xl font-bold text-center bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg">/session</span>
          </div>
          
          {payRate && (
            <div className="text-center text-slate-600">
              <p className="text-sm">Example: 1 session consultation = ₹{(parseFloat(payRate)).toFixed(2)}</p>
            </div>
          )}
        </div>
        
        {/* Suggested Rates */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">Suggested Rates</h3>
          <div className="grid grid-cols-3 gap-3">
            {suggestedRates.map(rate => (
              <button
                key={rate}
                onClick={() => setPayRate(rate.toFixed(2))}
                className={`p-3 rounded-lg border transition-colors ${
                  parseFloat(payRate) === rate 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ₹{rate.toFixed(2)}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            💡 Most listeners charge between ₹1000 - ₹5000 per session
          </p>
        </div>
        
        {/* Tips */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">💡 Pricing Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Start with a competitive rate to build your reputation</li>
            <li>• Consider your experience and specializations</li>
            <li>• You can adjust your rate anytime</li>
            <li>• Higher rates work best with established trust scores</li>
          </ul>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="p-4 bg-white border-t border-slate-200">
        <button
          onClick={handleSaveRate}
          disabled={isLoading || !payRate || parseFloat(payRate) <= 0}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Rate
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConsultationRateSettingsScreen;