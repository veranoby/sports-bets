import React, { useState, useEffect } from "react";
import { Crown, Check, Star, RefreshCw, AlertTriangle } from "lucide-react";
import { subscriptionAPI } from "../../config/api";
import LoadingSpinner from "../shared/LoadingSpinner";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "day" | "month";
  features: string[];
  popular?: boolean;
  description?: string;
}

interface SubscriptionPlansProps {
  onPlanSelect: (plan: SubscriptionPlan) => Promise<void> | void;
  currentPlan?: string | null;
  loading?: boolean;
  className?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onPlanSelect,
  currentPlan,
  loading: externalLoading = false,
  className = "",
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionAPI.getPlans();
      setPlans(response.data);
    } catch (err: unknown) {
      let errorMessage = "Failed to load subscription plans";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle plan selection
  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (currentPlan === plan.id || selecting) {
      return;
    }

    try {
      setSelecting(plan.id);
      await onPlanSelect(plan);
    } catch (error) {
      console.error("Plan selection failed:", error);
    } finally {
      setSelecting(null);
    }
  };

  // Format currency
  const formatPrice = (price: number, currency: string) => {
    const symbol =
      currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
    return `${symbol}${price.toFixed(2)}`;
  };

  // Calculate savings for monthly plan
  const calculateSavings = () => {
    const dailyPlan = plans.find((p) => p.interval === "day");
    const monthlyPlan = plans.find((p) => p.interval === "month");

    if (dailyPlan && monthlyPlan) {
      const monthlyDaily = dailyPlan.price * 30;
      const savings = monthlyDaily - monthlyPlan.price;
      return savings > 0 ? savings : 0;
    }

    return 0;
  };

  // Loading state
  if (loading || externalLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner text="Loading subscription plans..." />
      </div>
    );
  }

  // Error state
  if (error && plans.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Plans
        </h3>
        <p className="text-gray-600 mb-6">
          {error.includes("network") || error.includes("fetch")
            ? "Check your internet connection and try again."
            : error}
        </p>
        <button
          onClick={fetchPlans}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Crown className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Plans Available
        </h3>
        <p className="text-gray-600">
          Subscription plans are not available at the moment. Please try again
          later.
        </p>
      </div>
    );
  }

  const savings = calculateSavings();

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Compare features and select the plan that works best for you. All
          plans include premium streaming access and exclusive content.
        </p>
        {savings > 0 && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <Star className="w-4 h-4 mr-2" />
            Save ${savings.toFixed(2)} per month with our monthly plan
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div
        data-testid="subscription-plans"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
      >
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isSelecting = selecting === plan.id;
          const isUpgrade =
            currentPlan === "daily" && plan.interval === "month";

          return (
            <div
              key={plan.id}
              data-testid={`plan-${plan.id}`}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                plan.popular
                  ? "border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50"
                  : isCurrentPlan
                    ? "border-green-500 ring-2 ring-green-500 ring-opacity-50"
                    : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                    POPULAR
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Current
                  </div>
                </div>
              )}

              {/* Upgrade Badge */}
              {isUpgrade && !isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Upgrade
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  )}

                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-gray-500 ml-1">
                      /{plan.interval === "day" ? "day" : "month"}
                    </span>
                  </div>

                  {plan.interval === "month" && savings > 0 && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      Save ${savings.toFixed(2)} per month
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isCurrentPlan || isSelecting || externalLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    isCurrentPlan
                      ? "bg-green-100 text-green-700 cursor-not-allowed"
                      : plan.popular
                        ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 transform hover:scale-105"
                        : "bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105"
                  } disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSelecting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Selecting...
                    </div>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : isUpgrade ? (
                    `Upgrade to ${plan.name}`
                  ) : (
                    "Select Plan"
                  )}
                </button>

                {/* Billing Info */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    {plan.interval === "day"
                      ? "Billed daily. Cancel anytime."
                      : "Billed monthly. Cancel anytime."}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            <span>Secure payments by Kushki</span>
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            <span>24/7 support</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Money-back guarantee:</strong> Not satisfied? Get a full
            refund within 7 days of your purchase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
