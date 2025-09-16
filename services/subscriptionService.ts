import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export interface PlanLimits {
  meetings_limit: number;
  can_save: boolean;
  can_export: boolean;
  can_share: boolean;
  has_autosave: boolean;
  has_audio_transcription: boolean;
  session_generation_limit: number;
  has_priority_support: boolean;
  has_custom_templates: boolean;
  has_api_access: boolean;
}

export const useGetSubscription = () => {
  return useQuery(api.subscriptions.getSubscription);
};

export const useGetPlanLimits = (planType: string) => {
  return useQuery(api.subscriptions.getPlanLimits, { planType });
};

export const useUpsertSubscription = () => {
  return useMutation(api.subscriptions.upsertSubscription);
};