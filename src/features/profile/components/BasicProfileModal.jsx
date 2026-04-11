import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';

const BasicProfileModal = ({ isOpen, onClose, onSave, profileData, universities = [], universitiesLoading = false }) => {
  const wasOpenRef = useRef(false);
  const universityDropdownRef = useRef(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [universitySearchQuery, setUniversitySearchQuery] = useState('');
  const [isUniversityDropdownOpen, setIsUniversityDropdownOpen] = useState(false);
  const [isCustomUniversityEntry, setIsCustomUniversityEntry] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [focus, setFocus] = useState([]);
  const [customFocus, setCustomFocus] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [customLookingFor, setCustomLookingFor] = useState('');

  const focusOptions = useMemo(() => [
    'Finance / Tech',
    'Higher Studies MS / MBA',
    'Medicine / Healthcare',
    'Govt / PSUs',
    'Entrepreneurship',
    'Career Transit',
  ], []);

  const lookingForOptionsByStatus = useMemo(() => ({
    currently_enrolled: [
      'General career guidance & mentorship',
      'Networking with professionals & peers',
      'Real-world industry insights',
      'Navigating gap years & career switches',
      'Advice on higher studies & exams',
    ],
    alumni: [
      'Guide students on Higher Studies & Exams',
      'Mentor folks entering Tech/Finance/Med',
      'Network with fellow founders & professionals',
      'Share my Career Transit & Break experience',
      'Hiring interns/professionals',
      'Fundraising',
    ],
  }), []);

  const activeLookingForOptions = useMemo(() => {
    if (enrollmentStatus === 'currently_enrolled') return lookingForOptionsByStatus.currently_enrolled;
    if (enrollmentStatus === 'alumni') return lookingForOptionsByStatus.alumni;
    return [
      ...lookingForOptionsByStatus.currently_enrolled,
      ...lookingForOptionsByStatus.alumni,
    ];
  }, [enrollmentStatus, lookingForOptionsByStatus]);

  const years = useMemo(
    () => Array.from({ length: 21 }, (_, i) => String(new Date().getFullYear() - 10 + i)),
    []
  );

  useEffect(() => {
    const openedNow = isOpen && !wasOpenRef.current;

    if (openedNow) {
      setStep(1);
      setStepError('');
      setName(profileData?.name || '');

      const firstEducation = Array.isArray(profileData?.education) ? profileData.education[0] : null;
      setUniversity(firstEducation?.name || profileData?.university || '');
      setSelectedUniversityId(firstEducation?.university_id ? String(firstEducation.university_id) : '');
      setIsCustomUniversityEntry(
        !firstEducation?.university_id && String(firstEducation?.name || profileData?.university || '').trim().length > 0
      );
      setUniversitySearchQuery('');
      setIsUniversityDropdownOpen(false);

      const inferredEnrollmentStatus =
        firstEducation?.enrollment_status ||
        (() => {
          const existingYear = parseInt(firstEducation?.passing_year || profileData?.graduationYear || '', 10);
          const nowYear = new Date().getFullYear();
          if (!Number.isFinite(existingYear)) return '';
          return existingYear >= nowYear ? 'currently_enrolled' : 'alumni';
        })();
      setEnrollmentStatus(inferredEnrollmentStatus);

      setGraduationYear(String(firstEducation?.passing_year || profileData?.graduationYear || ''));

      const existingFocus = String(profileData?.focus || profileData?.industry || '').split(',').map((v) => v.trim()).filter(Boolean);
      setFocus(existingFocus.filter((item) => focusOptions.includes(item)));
      setCustomFocus(existingFocus.filter((item) => !focusOptions.includes(item)).join(', '));

      const allKnownLookingForOptions = [
        ...lookingForOptionsByStatus.currently_enrolled,
        ...lookingForOptionsByStatus.alumni,
      ];
      const existingLookingFor = String(profileData?.connectionGoal || profileData?.exploring || '').split(',').map((v) => v.trim()).filter(Boolean);
      setLookingFor(existingLookingFor.filter((item) => allKnownLookingForOptions.includes(item)));
      setCustomLookingFor(existingLookingFor.filter((item) => !allKnownLookingForOptions.includes(item)).join(', '));
    }

    if (!isOpen) {
      setStepError('');
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, profileData, focusOptions, lookingForOptionsByStatus]);

  useEffect(() => {
    if (!enrollmentStatus) return;

    setLookingFor((prevSelected) => {
      const allowed = new Set(activeLookingForOptions);
      const retained = prevSelected.filter((item) => allowed.has(item));
      const movedToCustom = prevSelected.filter((item) => !allowed.has(item));

      if (movedToCustom.length > 0) {
        setCustomLookingFor((prevCustom) => {
          const customItems = String(prevCustom)
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          const mergedCustom = Array.from(new Set([...customItems, ...movedToCustom]));
          return mergedCustom.join(', ');
        });
      }

      return retained;
    });
  }, [enrollmentStatus, activeLookingForOptions]);

  useEffect(() => {
    const handleOutsideUniversityClick = (event) => {
      if (universityDropdownRef.current && !universityDropdownRef.current.contains(event.target)) {
        setIsUniversityDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideUniversityClick);
    return () => document.removeEventListener('mousedown', handleOutsideUniversityClick);
  }, []);

  if (!isOpen) return null;

  const hasUniversityOptions = Array.isArray(universities) && universities.length > 0;

  const filteredUniversities = !hasUniversityOptions
    ? []
    : (universitySearchQuery.trim()
      ? universities.filter((u) => String(u?.name || '').toLowerCase().includes(universitySearchQuery.toLowerCase()))
      : universities);

  const toggleArrayValue = (value, selected, setter) => {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) {
      const hasValidUniversity = hasUniversityOptions
        ? (isCustomUniversityEntry ? !!university.trim() : !!selectedUniversityId)
        : !!university.trim();
      return !name.trim() || !hasValidUniversity || !enrollmentStatus || !graduationYear;
    }
    if (step === 2) return focus.length === 0 && !customFocus.trim();
    if (step === 3) return lookingFor.length === 0 && !customLookingFor.trim();
    return false;
  };

  const getStepErrorMessage = () => {
    if (step === 1) return 'Please fill name, university, enrollment status, and graduation year to continue.';
    if (step === 2) return 'Please select or type at least one focus area.';
    if (step === 3) return 'Please select or type at least one guidance preference.';
    return 'Please complete required details to continue.';
  };

  const handleNext = () => {
    if (isNextDisabled()) {
      setStepError(getStepErrorMessage());
      return;
    }

    setStepError('');
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleComplete = () => {
    const finalFocus = [...focus, ...(customFocus.trim() ? [customFocus.trim()] : [])].join(', ');
    const finalLookingFor = [...lookingFor, ...(customLookingFor.trim() ? [customLookingFor.trim()] : [])].join(', ');
    const yearNum = parseInt(graduationYear, 10);
    const entryYear = Number.isFinite(yearNum) ? String(yearNum - 4) : '';

    const selectedUniversity = hasUniversityOptions
      ? universities.find((u) => String(u.id) === String(selectedUniversityId))
      : null;

    onSave({
      name: name.trim(),
      focus: finalFocus,
      industry: finalFocus,
      connectionGoal: finalLookingFor,
      exploring: finalLookingFor,
      role: enrollmentStatus === 'currently_enrolled' ? 'Student' : 'Alumni',
      education: [
        {
          university_id: selectedUniversity ? Number(selectedUniversity.id) : null,
          name: selectedUniversity ? selectedUniversity.name : university.trim(),
          entry_year: entryYear,
          passing_year: graduationYear,
          enrollment_status: enrollmentStatus,
        },
      ],
      isProfileBasicCompleted: true,
    });
    onClose();
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (stepError) setStepError('');
              }}
              placeholder="e.g., Ujjwal Sharma"
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">1. Where do/did you study?</label>
            {hasUniversityOptions ? (
              <div className="space-y-2.5">
                {!isCustomUniversityEntry ? (
                  <div ref={universityDropdownRef} className="relative">
                    <input
                      type="text"
                      value={isUniversityDropdownOpen ? universitySearchQuery : university}
                      onFocus={() => setIsUniversityDropdownOpen(true)}
                      onChange={(e) => {
                        setUniversitySearchQuery(e.target.value);
                        setUniversity(e.target.value);
                        setSelectedUniversityId('');
                        setIsUniversityDropdownOpen(true);
                        if (stepError) setStepError('');
                      }}
                      placeholder={universitiesLoading ? 'Loading schools...' : 'Search and select your school'}
                      disabled={universitiesLoading}
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    />
                    {isUniversityDropdownOpen && !universitiesLoading && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                        {filteredUniversities.length === 0 ? (
                          <p className="px-3 py-3 text-sm text-slate-400 text-center">No schools found</p>
                        ) : (
                          filteredUniversities.slice(0, 15).map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onMouseDown={() => {
                                setSelectedUniversityId(String(u.id));
                                setUniversity(u.name);
                                setUniversitySearchQuery('');
                                setIsUniversityDropdownOpen(false);
                                if (stepError) setStepError('');
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${String(selectedUniversityId) === String(u.id)
                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              {u.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => {
                      setUniversity(e.target.value);
                      setSelectedUniversityId('');
                      if (stepError) setStepError('');
                    }}
                    placeholder="Type your university"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomUniversityEntry((prev) => !prev);
                    setUniversitySearchQuery('');
                    setIsUniversityDropdownOpen(false);
                    setSelectedUniversityId('');
                    if (stepError) setStepError('');
                  }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {isCustomUniversityEntry ? 'Select from list instead' : 'Add your university'}
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={university}
                onChange={(e) => {
                  setUniversity(e.target.value);
                  if (stepError) setStepError('');
                }}
                placeholder="Type your university"
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">2. What is your enrollment status?</label>
            <div className="relative mb-3">
              <select
                value={enrollmentStatus}
                onChange={(e) => {
                  setEnrollmentStatus(e.target.value);
                  if (stepError) setStepError('');
                }}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl appearance-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                <option value="" disabled>Select your status</option>
                <option value="currently_enrolled">Currently Enrolled</option>
                <option value="alumni">Alumni</option>
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
            </div>

            <label className="text-sm font-bold text-slate-700 mb-2 block">3. What is your graduation year?</label>
            <div className="relative">
              <select
                value={graduationYear}
                onChange={(e) => {
                  setGraduationYear(e.target.value);
                  if (stepError) setStepError('');
                }}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl appearance-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                <option value="" disabled>Select graduation year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <label className="text-sm font-bold text-slate-700 mb-1 block">3. Current Focus / Industry</label>
          <p className="text-xs text-slate-500 mb-3 font-medium">Select all that apply.</p>
          <div className="space-y-2.5">
            {focusOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleArrayValue(opt, focus, setFocus)}
                className={`w-full text-left p-4 rounded-xl border transition-all font-medium flex justify-between items-center ${focus.includes(opt) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <span>{opt}</span>
                {focus.includes(opt) && <CheckCircle className="w-5 h-5 text-indigo-600" />}
              </button>
            ))}
            <div className="mt-4 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Or type your own..."
                value={customFocus}
                onChange={(e) => {
                  setCustomFocus(e.target.value);
                  if (stepError) setStepError('');
                }}
                className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium transition-all ${customFocus ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-800 hover:border-indigo-300'}`}
              />
            </div>
          </div>
        </div>
      );
    }

    const followUpQuestion = enrollmentStatus === 'alumni'
      ? '4. How would you like to engage with the community?'
      : '4. What kind of guidance are you looking for?';

    const followUpHint = 'Select all that apply.';

    return (
      <div>
        <label className="text-sm font-bold text-slate-700 mb-1 block">{followUpQuestion}</label>
        <p className="text-xs text-slate-500 mb-3 font-medium">{followUpHint}</p>
        <div className="space-y-2.5">
          {activeLookingForOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleArrayValue(opt, lookingFor, setLookingFor)}
              className={`w-full text-left p-4 rounded-xl border transition-all font-medium flex justify-between items-center ${lookingFor.includes(opt) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'}`}
            >
              <span>{opt}</span>
              {lookingFor.includes(opt) && <CheckCircle className="w-5 h-5 text-indigo-600" />}
            </button>
          ))}
          <div className="mt-4 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Or type your own..."
              value={customLookingFor}
              onChange={(e) => {
                setCustomLookingFor(e.target.value);
                if (stepError) setStepError('');
              }}
              className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium transition-all ${customLookingFor ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-800 hover:border-indigo-300'}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center">
            {step > 1 && (
              <button type="button" onClick={() => { setStep((prev) => Math.max(prev - 1, 1)); setStepError(''); }} className="mr-3 p-1.5 -ml-1.5 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Basic Profile Setup</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Step {step} of 3</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="w-full h-1.5 bg-slate-100">
          <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="p-6 overflow-y-auto grow">
          {renderStepContent()}
          {stepError && (
            <p className="mt-4 text-xs font-semibold text-rose-600">{stepError}</p>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          {step > 1 ? (
            <button type="button" onClick={() => { setStep((prev) => Math.max(prev - 1, 1)); setStepError(''); }} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <Button type="button" primary className="w-auto! py-2.5! px-6!" onClick={handleNext}>
              Next <ChevronRight className="w-4 h-4 inline ml-1" />
            </Button>
          ) : (
            <Button type="button" primary className="w-auto! py-2.5! px-6!" disabled={isNextDisabled()} onClick={handleComplete}>
              Save Profile <CheckCircle className="w-4 h-4 inline ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicProfileModal;
