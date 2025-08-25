import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Lock, Play, Users, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import Modal from '../shared/Modal';
import { subscriptionAPI } from '../../config/api';

interface Subscription {
  id: string;
  type: 'daily' | 'monthly';
  status: 'active' | 'expired' | 'canceled';
  expiresAt: string;
  features: string[];
}

interface SubscriptionGuardProps {
  /** Feature being protected (e.g., "streaming", "premium_streaming") */
  feature: string;
  /** Content to show when access is granted */
  children: React.ReactNode;
  /** Custom fallback content */
  fallback?: React.ReactNode;
  /** Show subscription status in header when user has access */
  showSubscriptionStatus?: boolean;
  /** Custom CSS classes */
  className?: string;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  feature,
  children,
  fallback,
  showSubscriptionStatus = false,
  className = ''
}) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Subscription plans
  const plans = [
    {
      type: 'daily',
      name: 'Daily Access',
      price: 2.50,
      duration: '24 hours',
      features: ['Live streaming', 'HD quality', 'Chat access'],
      popular: false
    },
    {
      type: 'monthly',
      name: 'Monthly Premium',
      price: 10.00,
      duration: '30 days',
      features: ['Live streaming', '720p quality', 'Chat access', 'Ad-free', 'Exclusive content'],
      popular: true
    }
  ];

  // Fetch user subscription
  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await subscriptionAPI.getCurrent();
      setSubscription(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  // Check if user has access to the feature
  const hasAccess = useCallback(() => {
    // Free users have no access to protected content
    if (!subscription || subscription.type === 'free') return false;

    if (!user) return false;
    if (!subscription) return false;
    
    // Check if subscription is active and not expired
    if (subscription.status !== 'active') return false;
    if (new Date(subscription.expiresAt) <= new Date()) return false;
    
    // Check if feature is included in subscription
    if (feature === 'streaming' || feature === 'premium_streaming') {
      return subscription.features.includes('streaming') || subscription.features.includes('live_streaming');
    }
    
    return subscription.features.includes(feature);
  }, [user, subscription, feature]);

  // Handle subscription purchase
  const handleSubscriptionPurchase = async (planType: 'daily' | 'monthly') => {
    try {
      setUpgrading(true);
      
      const response = await subscriptionAPI.create({
        type: planType,
        paymentMethod: 'card' // This would be selected by user
      });
      
      setSubscription(response.data);
      setShowUpgradeModal(false);
      
      // Refresh subscription data
      await fetchSubscription();
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setUpgrading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-spinner">
        <LoadingSpinner text="Checking subscription..." />
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <div className={`text-center py-12 px-6 ${className}`}>
        <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sign in to access premium streaming content and join the live experience.
        </p>
        
        <Link
          to="/login"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users className="w-5 h-5" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  // Subscription error
  if (error && !subscription) {
    return (
      <div className={`text-center py-12 px-6 ${className}`}>
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Subscription</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
        
        <button
          onClick={fetchSubscription}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Check subscription access
  const userHasAccess = hasAccess();

  // User has access - render protected content
  if (userHasAccess) {
    return (
      <div className={className}>
        {showSubscriptionStatus && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <Crown className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Premium Member</span>
            <span className="text-green-600 text-sm">
              - Expires {new Date(subscription!.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }

  // User needs subscription - show upgrade prompt
  const isExpiredSubscription = subscription && (
    subscription.status === 'expired' || 
    new Date(subscription.expiresAt) <= new Date()
  );

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className={`text-center py-12 px-6 ${className}`}>
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <Crown className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isExpiredSubscription ? 'Subscription Expired' : 'Upgrade to Premium'}
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {isExpiredSubscription 
            ? 'Renew your subscription to continue enjoying premium streaming features.'
            : 'Unlock premium streaming with HD quality and exclusive live events.'
          }
        </p>

        {/* Quick plan preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
          {plans.map((plan) => (
            <div 
              key={plan.type} 
              className={`p-4 border rounded-lg text-left ${
                plan.popular ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="text-xs font-semibold text-yellow-700 mb-2">POPULAR</div>
              )}
              <div className="font-semibold text-gray-900">{plan.name}</div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ${plan.price.toFixed(2)}
                <span className="text-sm font-normal text-gray-500">/{plan.type === 'daily' ? 'day' : 'month'}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {plan.features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-8 py-4 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 shadow-lg font-semibold"
        >
          <Play className="w-5 h-5" />
          <span>{isExpiredSubscription ? 'Renew Now' : 'Upgrade Now'}</span>
        </button>
      </div>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Choose Your Plan"
        size="lg"
      >
        <div className="space-y-6">
          {plans.map((plan) => (
            <div 
              key={plan.type}
              className={`p-6 border rounded-lg ${
                plan.popular 
                  ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    {plan.popular && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    ${plan.price.toFixed(2)}
                    <span className="text-lg font-normal text-gray-600">/{plan.duration}</span>
                  </p>
                </div>
                
                <button
                  onClick={() => handleSubscriptionPurchase(plan.type)}
                  disabled={upgrading}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {upgrading ? 'Processing...' : 'Select Plan'}
                </button>
              </div>
              
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center text-sm text-gray-500">
            <p>Secure payments powered by Kushki. Cancel anytime.</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SubscriptionGuard;