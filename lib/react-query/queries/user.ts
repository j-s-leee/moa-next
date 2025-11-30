import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserStore } from "@/lib/stores/user-store";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// 사용자 프로필 조회
export function useUserProfile() {
  const { setProfile } = useUserStore();

  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("프로필을 불러올 수 없습니다.");
      }
      const data: UserProfile = await response.json();
      
      // Zustand store에 저장
      setProfile(data);
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5분 - 프로필은 자주 변경되지 않으므로 더 긴 캐싱 시간
    gcTime: 10 * 60 * 1000, // 10분
  });
}

// 사용자 프로필 수정
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { setProfile } = useUserStore();

  return useMutation({
    mutationFn: async (data: { name?: string | null; avatarUrl?: string | null }) => {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name?.trim() || null,
          avatarUrl: data.avatarUrl?.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "프로필 수정에 실패했습니다.");
      }

      return response.json() as Promise<UserProfile>;
    },
    onSuccess: (data) => {
      // Zustand store 업데이트
      setProfile(data);
      
      // Query cache 업데이트
      queryClient.setQueryData(["user", "profile"], data);
      
      toast.success("프로필이 성공적으로 수정되었습니다.");
    },
    onError: (error) => {
      console.error("프로필 수정 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "프로필 수정 중 오류가 발생했습니다."
      );
    },
  });
}

