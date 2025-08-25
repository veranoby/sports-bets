import React from 'react';
import type { UserSubscription } from '../../types';
import { format } from 'date-fns';

interface SubscriptionStatusProps {
  subscription: UserSubscription | null;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscription }) => {
  if (!subscription) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Free
      </span>
    );
  }

  const isExpired = subscription.expiresAt && new Date(subscription.expiresAt) <= new Date();
  const isFree = subscription.type === 'free';
  const isPremium = !isFree && subscription.status === 'active' && !isExpired;

  let statusText = 'Free';
  let statusClass = 'bg-gray-100 text-gray-800';

  if (isPremium) {
    statusText = 'Premium';
    statusClass = 'bg-yellow-100 text-yellow-800';
  } else if (isExpired) {
    statusText = 'Expired';
    statusClass = 'bg-red-100 text-red-800';
  } else if (subscription.status === 'pending') {
    statusText = 'Pending';
    statusClass = 'bg-blue-100 text-blue-800';
  } else if (subscription.status === 'cancelled') {
    statusText = 'Cancelled';
    statusClass = 'bg-purple-100 text-purple-800';
  }

  const daysRemaining = subscription.expiresAt ? Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const showWarning = isPremium && daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="flex flex-col items-start">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
        {statusText}
      </span>
      {isPremium && subscription.expiresAt && (
        <span className="mt-1 text-xs text-gray-500">
          Expires: {format(new Date(subscription.expiresAt), 'MMM dd, yyyy')}
        </span>
      )}
      {showWarning && (
        <span className="mt-1 text-xs text-red-500">
          Your subscription expires in {daysRemaining} day(s)!
        </span>
      )}
    </div>
  );
};

export default SubscriptionStatus;
