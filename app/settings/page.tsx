"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, User, Mail, Image as ImageIcon } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/app-layout";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    avatarUrl: "",
  });

  // 프로필 조회
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("프로필을 불러올 수 없습니다.");
        }
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          avatarUrl: data.avatarUrl || "",
        });
      } catch (error) {
        console.error("프로필 조회 오류:", error);
        toast.error("프로필을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 프로필 수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim() || null,
          avatarUrl: formData.avatarUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "프로필 수정에 실패했습니다.");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast.success("프로필이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "프로필 수정 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  // 이름 초기값 생성 (이메일에서 추출)
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              프로필을 불러올 수 없습니다.
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="설정"
      breadcrumbs={[{ label: "설정", href: "/settings" }]}
    >
      <div className="space-y-6 max-w-2xl">
        {/* 프로필 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 설정</CardTitle>
            <CardDescription>
              계정 정보를 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 프로필 이미지 */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(formData.name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatarUrl" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    프로필 이미지 URL
                  </Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatarUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, avatarUrl: e.target.value })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    이미지 URL을 입력하세요.
                  </p>
                </div>
              </div>

              <Separator />

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  이름
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* 이메일 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  이메일은 변경할 수 없습니다.
                </p>
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 테마 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>테마 설정</CardTitle>
            <CardDescription>
              테마를 클릭하여 라이트 모드, 다크 모드, 시스템 설정 중에서 선택할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">테마</p>
                <p className="text-xs text-muted-foreground">
                  버튼을 클릭하여 라이트 모드 → 다크 모드 → 시스템 설정 순서로 전환됩니다.
                </p>
              </div>
              <AnimatedThemeToggler />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
