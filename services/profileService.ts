
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export const useGetUserProfile = () => {
  return useQuery(api.users.getUserProfile);
};

export const useUpdateUserProfile = () => {
  return useMutation(api.users.updateUserProfile);
};

export const useCreateUser = () => {
  return useMutation(api.users.createUser);
};

// TODO: Implement file upload with Convex
// export const useUploadAvatar = () => {
//   return useMutation(api.users.uploadAvatar);
// };
