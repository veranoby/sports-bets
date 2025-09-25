import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Settings,
  Crown,
  Download,
  History,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { subscriptionAPI } from "../../config/api";
import SubscriptionPlans from "./SubscriptionPlans";
import "./SubscriptionManager.css";

interface Subscription {
  id: string;
  type: "daily" | "monthly";
  status: "active" | "cancelled" | "expired";
  expiresAt: string;
  remainingDays: number;
  autoRenew: boolean;
  features: string[];
  amount: number;
  currency: string;
  nextBillingDate?: string;
  createdAt: string;
  cancelledAt?: string;
}

interface PaymentHistory {
  id: string;
  type: string;
  status: "completed" | "failed" | "pending" | "refunded";
  amount: number;
  formattedAmount: string;
  currency: string;
  paymentMethod: string;
  cardLast4?: string;
  cardBrand?: string;
  processedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}



const SubscriptionManager: React.FC = () => {
  useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "plans">(
    "overview",
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [togglingRenew, setTogglingRenew] = useState(false);

  // Fetch current subscription
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionAPI.getCurrentSubscription();
      setSubscription(response.data);
    } catch (err: unknown) {
      // Changed from 'any' to 'unknown' for better type safety
      console.error("Failed to fetch subscription:", err);
      setError(err.message || "Failed to load subscription information");
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async (offset = 0, limit = 10) => {
    try {
      setHistoryLoading(true);

      const response = await subscriptionAPI.getPaymentHistory({
        limit,
        offset,
      });

      if (offset === 0) {
        setPaymentHistory(response.data);
      } else {
        setPaymentHistory((prev) => [...prev, ...response.data]);
      }

      setPagination(
        (response as { pagination: PaginationInfo }).pagination || {
          current: 1,
          total: 0,
          pageSize: 10,
        },
      );
    } catch (err: unknown) {
      // Changed from 'any' to 'unknown' for better type safety
      console.error("Failed to fetch payment history:", err);
      setError(err.message || "Failed to load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load more payment history
  const loadMoreHistory = () => {
    if (pagination.hasMore && !historyLoading) {
      fetchPaymentHistory(
        pagination.offset + pagination.limit,
        pagination.limit,
      );
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchPaymentHistory();
  }, []);

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCancelling(true);

      await subscriptionAPI.cancelSubscription({
        reason: cancelReason || "User requested cancellation",
      });

      // Refresh subscription data
      await fetchSubscription();

      setShowCancelDialog(false);
      setCancelReason("");
    } catch (err: unknown) {
      // Changed from 'any' to 'unknown' for better type safety
      console.error("Failed to cancel subscription:", err);
      setError(err.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  // Toggle auto-renew
  const handleToggleAutoRenew = async () => {
    if (!subscription) return;

    try {
      setTogglingRenew(true);

      await subscriptionAPI.updateAutoRenew(subscription.id, {
        autoRenew: !subscription.autoRenew,
      });

      // Refresh subscription data
      await fetchSubscription();
    } catch (err: unknown) {
      // Changed from 'any' to 'unknown' for better type safety
      console.error("Failed to toggle auto-renew:", err);
      setError(err.message || "Failed to update auto-renew setting");
    } finally {
      setTogglingRenew(false);
    }
  };

  // Handle plan selection (upgrade/downgrade)
  const handlePlanSelect = async () => {
    // This would trigger the payment flow for plan changes
    // For now, redirect to plans page
    setActiveTab("plans");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "active":
        return {
          color: "text-green-600",
          bg: "bg-green-100",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          color: "text-yellow-600",
          bg: "bg-yellow-100",
          icon: AlertCircle,
        };
      case "expired":
        return { color: "text-red-600", bg: "bg-red-100", icon: X };
      case "completed":
        return {
          color: "text-green-600",
          bg: "bg-green-100",
          icon: CheckCircle,
        };
      case "failed":
        return { color: "text-red-600", bg: "bg-red-100", icon: X };
      case "pending":
        return {
          color: "text-yellow-600",
          bg: "bg-yellow-100",
          icon: RefreshCw,
        };
      default:
        return { color: "text-gray-600", bg: "bg-gray-100", icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" tip="Loading subscription details..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Management
        </h1>
        <p className="text-gray-600">
          Manage your subscription, view payment history, and update billing
          preferences.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Settings },
            { id: "history", label: "Payment History", icon: History },
            { id: "plans", label: "Change Plan", icon: Crown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Current Subscription */}
          {subscription ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Current Subscription
                  </h2>
                  <div className="flex items-center">
                    {(() => {
                      const statusDisplay = getStatusDisplay(
                        subscription.status,
                      );
                      const StatusIcon = statusDisplay.icon;
                      return (
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.bg} ${statusDisplay.color}`}
                        >
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Plan Type
                      </label>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {subscription.type} Access
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Price
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        ${(subscription.amount / 100).toFixed(2)}{" "}
                        {subscription.currency}
                        <span className="text-sm text-gray-500 ml-1">
                          /{subscription.type === "daily" ? "day" : "month"}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Features
                      </label>
                      <ul className="mt-1 space-y-1">
                        {subscription.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-sm text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Expires At
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(subscription.expiresAt)}
                      </p>
                      {subscription.status === "active" && (
                        <p className="text-sm text-blue-600">
                          {subscription.remainingDays} days remaining
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Auto-Renew
                      </label>
                      <div className="flex items-center mt-1">
                        <button
                          onClick={handleToggleAutoRenew}
                          disabled={
                            togglingRenew || subscription.status !== "active"
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            subscription.autoRenew
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          } ${togglingRenew ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              subscription.autoRenew
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="ml-3 text-sm text-gray-700">
                          {subscription.autoRenew ? "Enabled" : "Disabled"}
                        </span>
                        {togglingRenew && (
                          <RefreshCw className="w-4 h-4 ml-2 animate-spin text-blue-500" />
                        )}
                      </div>
                    </div>

                    {subscription.nextBillingDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Next Billing
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(subscription.nextBillingDate)}
                        </p>
                      </div>
                    )}

                    {subscription.cancelledAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Cancelled On
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(subscription.cancelledAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {subscription.status === "active" && (
                  <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setActiveTab("plans")}
                      className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </button>

                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="flex items-center justify-center px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 text-center">
              <Crown className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-600 mb-6">
                Subscribe to access premium streaming content and exclusive
                features.
              </p>
              <button
                onClick={() => setActiveTab("plans")}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Crown className="w-5 h-5 mr-2" />
                View Plans
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment History
              </h2>
              <div className="text-sm text-gray-500">
                {pagination.total} total transactions
              </div>
            </div>

            {paymentHistory.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.map((payment) => {
                  const statusDisplay = getStatusDisplay(payment.status);
                  const StatusIcon = statusDisplay.icon;

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${statusDisplay.bg}`}>
                          <StatusIcon
                            className={`w-5 h-5 ${statusDisplay.color}`}
                          />
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.formattedAmount}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payment.type
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            {payment.cardLast4 && (
                              <span className="ml-2">
                                •••• {payment.cardLast4}
                              </span>
                            )}
                            {payment.cardBrand && (
                              <span className="ml-1 uppercase text-xs">
                                ({payment.cardBrand})
                              </span>
                            )}
                          </p>
                          {payment.errorMessage && (
                            <p className="text-sm text-red-600 mt-1">
                              {payment.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(
                            payment.processedAt ||
                              payment.failedAt ||
                              payment.createdAt,
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={loadMoreHistory}
                      disabled={historyLoading}
                      className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {historyLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Load More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Payment History
                </h3>
                <p className="text-gray-600">
                  Your payment transactions will appear here once you make a
                  purchase.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "plans" && (
        <SubscriptionPlans
          onPlanSelect={handlePlanSelect}
          currentPlan={subscription?.type}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-6"
        />
      )}

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Subscription
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your subscription? You'll continue
              to have access until{" "}
              {subscription && formatDate(subscription.expiresAt)}.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Help us improve by sharing your feedback..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
