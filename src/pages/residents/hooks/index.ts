

// hook lấy danh sách hộ dân 

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { filterResidents } from "../apis"
import { createResident, deleteResident, getResidentById, getResidents, updateResident } from "../apis"
import type { CreateResident, UpdateResident } from "../interfaces"

export const useResidents = (filter: filterResidents) => {
    return useQuery({
        queryKey: ['residents', filter],
        queryFn: () => getResidents(filter),
    })
}


// hook thêm hộ dân 

export const useCreateResident = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (value: CreateResident) => createResident(value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['residents'] });
            
        },
    })
}

// hook cập nhật hộ dân 

export const useUpdateResident = () => {

    return useMutation({
        mutationFn: ({id, value}: {id: number, value: UpdateResident}) => updateResident(id, value),
    })
}

// hook xóa hộ dân 

export const useDeleteResident = () => {
    return useMutation({
        mutationFn: (id: number) => deleteResident(id),
    })
}

// hook lấy thông tin hộ dân theo id 
export const useResidentById = (id: number) => {
    return useQuery({
        queryKey: ['resident', id],
        queryFn: () => getResidentById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 3,
    })
}
