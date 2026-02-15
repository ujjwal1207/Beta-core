import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const CallReviewModal = ({ 
  isOpen, 
  onClose, 
  recipientUser, 
  callInvitationId,
  onSubmitReview 
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitReview({
        reviewee_id: recipientUser.id,
        rating: rating,
        content: comment,
        call_invitation_id: callInvitationId
      });
      
      // Reset form and close
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (stars) => {
    switch (stars) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Rate your experience';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <img
              src={recipientUser.profile_photo || `https://picsum.photos/seed/${recipientUser.id}/100`}
              alt={recipientUser.full_name}
              className="w-16 h-16 rounded-full border-3 border-white/30"
            />
            <div>
              <h2 className="text-xl font-bold">Rate Your Session</h2>
              <p className="text-white/90">with {recipientUser.full_name}</p>
              {recipientUser.is_super_linker && (
                <div className="inline-flex items-center bg-yellow-400/20 text-yellow-100 px-2 py-1 rounded-full text-xs mt-1">
                  ⭐ Super Linker
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              How was your experience? Your feedback helps improve our community.
            </p>
            
            {/* Star Rating */}
            <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className={`p-2 transition-all duration-200 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            
            <p className="text-sm font-medium text-gray-700">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Optional Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional feedback (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what made this session great or how it could be improved..."
              className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`flex-1 py-3 px-4 font-medium rounded-xl transition-all ${
                rating === 0 || isSubmitting
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallReviewModal;