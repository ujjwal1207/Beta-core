import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MessageSquare, Calendar, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import callsService from '../services/callsService';

const ReviewsScreen = () => {
  const { user, setScreen } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const reviewsData = await callsService.getUserReviews(user.id, 50);
      setReviews(reviewsData);

      // Calculate stats
      const totalReviews = reviewsData.length;
      const averageRating = totalReviews > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      setStats({
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="REVIEWS" />

      <div className="flex-grow overflow-y-auto pt-14 pb-20">
        <div className="px-4 sm:px-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setScreen('SUPER_LISTENER_DASHBOARD')}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Reviews</h1>
              <p className="text-sm text-slate-600">Feedback from your consultations</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-slate-900">{stats.averageRating}</span>
                </div>
                <p className="text-sm text-slate-600">Average Rating</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{stats.totalReviews}</div>
                <p className="text-sm text-slate-600">Total Reviews</p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{review.reviewer_name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-slate-600 ml-2">{review.rating}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(review.created_at * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {review.content && (
                    <div className="flex gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{review.content}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No reviews yet</h3>
                <p className="text-slate-600">Complete some consultations to start receiving feedback</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsScreen;