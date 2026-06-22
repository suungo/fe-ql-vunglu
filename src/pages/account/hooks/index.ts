import { useMutation, useQuery } from "@tanstack/react-query";
import {
  deleteUserApi,
  getUsersApi,
  getDeletedUsersApi,
  restoreUserApi,
  suspendUserApi,
  unsuspendUserApi,
} from "../apis";
import type { filterUsers } from "../apis";

export const useUsers = (filter: filterUsers) => {
  return useQuery({
    queryKey: ["users", filter],
    queryFn: () => getUsersApi(filter),
  });
};

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: number) => deleteUserApi(id),
  });
};

export const useDeletedUsers = (filter: filterUsers) => {
  return useQuery({
    queryKey: ["deleted-users", filter],
    queryFn: () => getDeletedUsersApi(filter),
  });
};

export const useRestoreUser = () => {
  return useMutation({
    mutationFn: (id: number) => restoreUserApi(id),
  });
};

export const useSuspendUser = () => {
  return useMutation({
    mutationFn: (id: number) => suspendUserApi(id),
  });
};

export const useUnsuspendUser = () => {
  return useMutation({
    mutationFn: (id: number) => unsuspendUserApi(id),
  });
};
