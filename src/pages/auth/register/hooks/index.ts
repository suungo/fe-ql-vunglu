import { useMutation, useQuery } from "@tanstack/react-query";
import { deleteUserApi, getUsersApi } from "../apis";
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
