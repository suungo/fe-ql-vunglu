import type { FloodDamageFilter } from "@/types/flood-damage.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFloodDamage,
  getDetailFloodDamage,
  getListFloodDamage,
  getStatsByReflection,
  updateFloodDamage,
} from "../api";

// 🧠 KEY chuẩn để cache
const FLOOD_DAMAGE_KEY = "flood-damages";

// =======================
// 📌 GET LIST
// =======================
export const useFloodDamages = (filters: FloodDamageFilter = {}) => {
  return useQuery({
    queryKey: [FLOOD_DAMAGE_KEY, filters],
    queryFn: () => getListFloodDamage(filters),
  });
};

// =======================
// 📌 GET DETAIL
// =======================
export const useFloodDamageDetail = (id?: number) => {
  return useQuery({
    queryKey: [FLOOD_DAMAGE_KEY, id],
    queryFn: () => getDetailFloodDamage(id!),
    enabled: !!id,
  });
};

// =======================
// 📌 GET STATS BY REFLECTION
// =======================
export const useFloodDamageStatsByReflection = (reflectionId?: number) => {
  return useQuery({
    queryKey: [FLOOD_DAMAGE_KEY, "stats", reflectionId],
    queryFn: () => getStatsByReflection(reflectionId!),
    enabled: !!reflectionId,
  });
};


// =======================
// 📌 UPDATE
// =======================
export const useUpdateFloodDamage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateFloodDamage>[1] }) =>
      updateFloodDamage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FLOOD_DAMAGE_KEY] });
      queryClient.invalidateQueries({ queryKey: [FLOOD_DAMAGE_KEY, variables.id] });
    },
  });
};

// =======================
// 📌 DELETE
// =======================
export const useDeleteFloodDamage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFloodDamage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FLOOD_DAMAGE_KEY] });
    },
  });
};
