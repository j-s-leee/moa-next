# Supabase OAuth 설정 가이드

## 1. Google OAuth 설정

### Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** > **사용자 인증 정보** 메뉴로 이동
4. **사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
5. 애플리케이션 유형: **웹 애플리케이션**
6. 승인된 리디렉션 URI 추가:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   또는 개발 환경:
   ```
   http://localhost:54321/auth/v1/callback
   ```
7. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

### Supabase Dashboard 설정

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Authentication** > **Providers** 메뉴로 이동
4. **Google** 제공자 활성화
5. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID (for OAuth)**: Google 클라이언트 ID
   - **Client Secret (for OAuth)**: Google 클라이언트 보안 비밀번호
6. **Save** 클릭

## 2. Kakao OAuth 설정

### Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 이름, 사업자명 입력 후 저장
4. **앱 설정** > **플랫폼** 메뉴에서 플랫폼 추가:
   - **Web 플랫폼 등록**: 사이트 도메인 등록
     - 개발: `http://localhost:3000`
     - 프로덕션: `https://the-moa.top`
5. **제품 설정** > **카카오 로그인** 활성화
6. **카카오 로그인** > **Redirect URI** 설정:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   또는 개발 환경:
   ```
   http://localhost:54321/auth/v1/callback
   ```
7. **REST API 키** 복사

### Supabase Dashboard 설정

**참고**: Supabase는 기본적으로 Kakao를 지원하지 않습니다.
다음 중 하나의 방법을 사용해야 합니다:

#### 방법 1: Supabase Custom OAuth 사용 (권장)

1. Supabase Dashboard > **Authentication** > **Providers**
2. **Custom OAuth** 또는 **Generic OAuth** 선택
3. 설정:
   - **Provider Name**: `kakao`
   - **Authorization URL**: `https://kauth.kakao.com/oauth/authorize`
   - **Token URL**: `https://kauth.kakao.com/oauth/token`
   - **User Info URL**: `https://kapi.kakao.com/v2/user/me`
   - **Client ID**: Kakao REST API 키
   - **Client Secret**: (Kakao는 보안 키가 없을 수 있음)
   - **Scopes**: `profile_nickname,account_email`

#### 방법 2: Supabase Edge Function 사용

Supabase Edge Function을 사용하여 커스텀 OAuth 플로우 구현

## 3. 환경 변수 설정

`.env.local` 파일에 추가 (필요한 경우):

```env
# Google OAuth (Supabase에서 관리하므로 일반적으로 불필요)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Kakao OAuth (필요한 경우)
# NEXT_PUBLIC_KAKAO_REST_API_KEY=your_kakao_rest_api_key
```

## 4. 테스트

1. 개발 서버 실행: `npm run dev`
2. `/login` 페이지 접속
3. Google 또는 Kakao 로그인 버튼 클릭
4. OAuth 인증 완료 후 콜백 처리 확인
5. 대시보드로 리다이렉트되는지 확인

## 5. 프로덕션 배포 시 주의사항

1. **Redirect URI 업데이트**:

   - Google Cloud Console에서 프로덕션 도메인 추가
   - Kakao Developers에서 프로덕션 도메인 추가

2. **환경 변수 확인**:

   - 프로덕션 환경의 환경 변수 설정 확인

3. **도메인 설정**:
   - Supabase Dashboard > **Authentication** > **URL Configuration**
   - Site URL: `https://the-moa.top`
   - Redirect URLs: `https://the-moa.top/**`

## 문제 해결

### OAuth 로그인 후 콜백 오류

- Redirect URI가 정확히 일치하는지 확인
- Supabase Dashboard의 Redirect URLs 설정 확인
- 브라우저 콘솔에서 에러 메시지 확인

### Kakao 로그인이 작동하지 않는 경우

- Supabase가 Kakao를 직접 지원하지 않으므로 Custom OAuth 설정 필요
- 또는 Supabase Edge Function을 사용한 커스텀 구현 필요
