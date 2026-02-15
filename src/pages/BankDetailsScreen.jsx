import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building, CreditCard, User, ShieldCheck, Loader, Save, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import Button from '../components/ui/Button';
import userService from '../services/userService';

const BankDetailsScreen = () => {
  const { user, setScreen, showToast } = useAppContext();
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'savings',
    upiId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (user?.payout_details && !isFormInitialized) {
      setFormData(prev => ({
        ...prev,
        ...user.payout_details,
        confirmAccountNumber: user.payout_details.accountNumber || ''
      }));
      setIsFormInitialized(true);
    }
  }, [user, isFormInitialized]);

  const validate = () => {
    const newErrors = {};
    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = "Account holder name is required";
    if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
    if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number is required";
    if (formData.accountNumber !== formData.confirmAccountNumber) newErrors.confirmAccountNumber = "Account numbers do not match";
    if (!formData.ifscCode.trim()) newErrors.ifscCode = "IFSC code is required";
    // Basic regex for IFSC (4 letters, 0, 6 alphanum)
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) newErrors.ifscCode = "Invalid IFSC Code format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Exclude confirmAccountNumber from saved data
      const { confirmAccountNumber, ...dataToSave } = formData;
      dataToSave.ifscCode = dataToSave.ifscCode.toUpperCase();

      await userService.updateProfile({
        payout_details: dataToSave
      });

      showToast("Bank details saved successfully!", "success");
      // Optional: Redirect back
      // setScreen('SUPER_LISTENER_DASHBOARD');
    } catch (error) {
      console.error("Failed to save bank details:", error);
      showToast("Failed to save details. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="BANK_DETAILS" />
      
      <div className="flex-grow overflow-y-auto pt-[121px] pb-6">
        <div className="px-4 sm:px-6 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setScreen('SUPER_LISTENER_DASHBOARD')}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Bank Details</h1>
              <p className="text-sm text-slate-600">For receiving payouts from consultations</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5" />
              <p className="text-sm text-indigo-800">
                Your banking information is stored securely and only used for processing payouts.
              </p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* Account Holder */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Holder Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.accountHolderName ? 'border-red-300' : 'border-slate-300'}`}
                    placeholder="As per bank records"
                  />
                </div>
                {errors.accountHolderName && <p className="text-xs text-red-500 mt-1">{errors.accountHolderName}</p>}
              </div>

              {/* Account Number */}
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.accountNumber ? 'border-red-300' : 'border-slate-300'}`}
                      placeholder="Enter account number"
                    />
                  </div>
                  {errors.accountNumber && <p className="text-xs text-red-500 mt-1">{errors.accountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Account Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="confirmAccountNumber"
                      value={formData.confirmAccountNumber}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.confirmAccountNumber ? 'border-red-300' : 'border-slate-300'}`}
                      placeholder="Re-enter account number"
                    />
                  </div>
                  {errors.confirmAccountNumber && <p className="text-xs text-red-500 mt-1">{errors.confirmAccountNumber}</p>}
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                      }}
                      maxLength={11}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.ifscCode ? 'border-red-300' : 'border-slate-300'}`}
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                  {errors.ifscCode && <p className="text-xs text-red-500 mt-1">{errors.ifscCode}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.bankName ? 'border-red-300' : 'border-slate-300'}`}
                    placeholder="e.g. HDFC Bank"
                  />
                  {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>}
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                   <select
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                   >
                     <option value="savings">Savings</option>
                     <option value="current">Current</option>
                   </select>
                </div>
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID (Optional)</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="username@upi"
                />
                <p className="text-xs text-slate-500 mt-1">For faster small payments (if supported)</p>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full flex justify-center items-center py-3 text-base"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Saving Details...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Bank Details
                    </>
                  )}
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsScreen;