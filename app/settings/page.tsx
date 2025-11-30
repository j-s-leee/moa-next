"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/app-layout";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { useUserProfile, useUpdateUserProfile } from "@/lib/react-query/queries/user";

export default function SettingsPage() {
  const { data: profile, isLoading, error } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
    },
  });

  // 프로필 데이터가 로드되면 폼 초기화
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, form]);

  // 프로필 수정
  const onSubmit = async (data: ProfileFormData) => {
    updateProfile.mutate({
      name: data.name ? data.name.trim() || null : null,
      avatarUrl: data.avatarUrl ? data.avatarUrl.trim() || null : null,
    });
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

  const avatarUrl = form.watch("avatarUrl");
  const name = form.watch("name");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !profile) {
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 프로필 이미지 */}
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={field.value ?? undefined} />
                          <AvatarFallback className="text-lg">
                            {getInitials(name ?? null, profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <FormLabel className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            프로필 이미지 URL
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/avatar.jpg"
                              {...field}
                              value={field.value ?? ""}
                              className="mt-2"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            이미지 URL을 입력하세요.
                          </p>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                {/* 이름 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        이름
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="이름을 입력하세요"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? (
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
            </Form>
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
