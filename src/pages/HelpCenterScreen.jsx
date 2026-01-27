import React, { useState } from 'react';
import { ArrowLeft, Phone, Heart, Shield, HelpCircle, Copy, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const HelpCenterScreen = () => {
  const { setScreen, showToast } = useAppContext();
  const [copiedNumber, setCopiedNumber] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNumber(true);
      showToast('Phone number copied to clipboard!', 'success');
      setTimeout(() => setCopiedNumber(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy phone number', 'error');
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <div className="p-4 pt-6">
        <button
          onClick={() => setScreen('SETTINGS')}
          className="p-2 rounded-full hover:bg-slate-200 mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Help Center</h1>
        <p className="text-slate-600 mb-6">Get support and find resources</p>
      </div>

      <div className="flex-grow overflow-y-auto px-4 space-y-6">
        {/* Emergency Support Section */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">Need Immediate Help?</h2>
              <p className="text-red-800 mb-4">
                If you're experiencing a mental health crisis or need immediate support, please contact our counselors.
              </p>
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="text-sm font-medium text-red-900 mb-2">Dial the Toll-Free numbers below to get in touch with our Counsellor</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-red-600" />
                  <span className="text-lg font-bold text-red-900">14416</span>
                  <button
                    onClick={() => copyToClipboard('14416')}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    title="Copy phone number"
                  >
                    {copiedNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Support Options</h3>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-slate-800">FAQs</h4>
            </div>
            <p className="text-slate-600 text-sm">
              Find answers to common questions about using ListenLink and managing your mental health journey.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-slate-800">Safety & Privacy</h4>
            </div>
            <p className="text-slate-600 text-sm">
              Learn about our commitment to your privacy and how we keep your conversations safe and confidential.
            </p>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Additional Resources</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Crisis Text Line:</strong> Text HOME to 741741</p>
            <p>• <strong>National Suicide Prevention Lifeline:</strong> 988</p>
            <p>• <strong>International Association for Suicide Prevention</strong></p>
          </div>
        </div>

        {/* Contact Form Link */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Still Need Help?</h3>
          <p className="text-slate-600 text-sm mb-4">
            Can't find what you're looking for? Send us a message and we'll get back to you.
          </p>
          <button
            onClick={() => setScreen('CONTACT_US')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterScreen;