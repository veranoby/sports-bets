import { useState } from "react";
import { adminAPI } from "../services/api";
import type { UserSubscription } from "../types";

export const useUserSubscription = (
  userId: string,
  initialSubscription?: UserSubscription,
) => {
  const [subscription, setSubscription] = useState<
    UserSubscription | undefined
  >(initialSubscription);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSubscription = async (
    membershipType: "free" | "24-hour" | "monthly",
    assignedUsername: string,
  ) => {
    setIsUpdating(true);
    try {
      const response = await adminAPI.updateUserMembership(userId, {
        membership_type: membershipType,
        assigned_username: assignedUsername,
      });

      if (response.success && response.data) {
        setSubscription(response.data as UserSubscription);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error updating subscription",
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    subscription,
    isUpdating,
    updateSubscription,
  };
};
