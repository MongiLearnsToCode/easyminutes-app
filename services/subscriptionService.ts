import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export const useGetSubscription = () => {
  return useQuery(api.subscriptions.getSubscription);
};

export const useGetPlanLimits = (planType: string) => {
  return useQuery(api.subscriptions.getPlanLimits, { planType });
};

export const useUpsertSubscription = () => {
  return useMutation(api.subscriptions.upsertSubscription);
};