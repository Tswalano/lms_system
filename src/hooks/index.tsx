import { useQuery } from "@tanstack/react-query";
import { getMeFn } from "../api/authAPI";

export const useUserQuery = (userId: string, token: string) => {
    return useQuery({
        queryKey: ['authUser', userId],
        queryFn: () => getMeFn(token, userId),
        enabled: !!userId, // Only enable the query if userId is provided
        select: (data) => data.body.payload,
        retry: 1,
    });
};