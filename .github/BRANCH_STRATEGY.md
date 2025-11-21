# Git 브랜치 관리 전략

## 브랜치 전략: GitHub Flow (단순화된 Git Flow)

이 프로젝트는 **GitHub Flow**를 기반으로 하되, 프로젝트 특성에 맞게 단순화한 전략을 사용합니다.

## 브랜치 구조

### 주요 브랜치

- **`main`**: 프로덕션 배포 가능한 안정적인 코드

  - 항상 배포 가능한 상태 유지
  - 직접 커밋 금지 (Pull Request 필수)
  - 보호 브랜치 설정 권장
  - `develop`에서만 병합 가능

- **`develop`**: 개발 통합 브랜치
  - 여러 기능 브랜치를 통합하여 테스트
  - 개발 중인 모든 기능이 통합되는 브랜치
  - 안정화되면 `main`으로 병합
  - 기본 개발 브랜치로 사용

### 보조 브랜치

- **`feature/*`**: 기능 개발 브랜치

  - 예: `feature/user-authentication`, `feature/budget-management`
  - 기능 완료 후 `main`으로 병합

- **`fix/*`**: 버그 수정 브랜치

  - 예: `fix/login-error`, `fix/budget-calculation`
  - 수정 완료 후 `main`으로 병합

- **`hotfix/*`**: 긴급 프로덕션 수정 브랜치
  - 예: `hotfix/security-patch`
  - `main`에서 분기하여 즉시 수정 후 병합

## 브랜치 네이밍 규칙

### 형식

```
{type}/{short-description}
```

### 타입

- `feature/`: 새로운 기능 추가
- `fix/`: 버그 수정
- `hotfix/`: 긴급 수정
- `refactor/`: 코드 리팩토링
- `docs/`: 문서 수정
- `test/`: 테스트 추가/수정
- `chore/`: 빌드/설정 변경

### 예시

```
feature/user-authentication
feature/budget-management
fix/login-error-handling
hotfix/security-patch
refactor/database-schema
docs/api-documentation
test/expense-crud
chore/update-dependencies
```

## 워크플로우

### 1. 기능 개발

```bash
# 1. 최신 develop 브랜치 가져오기
git checkout develop
git pull origin develop

# 2. 기능 브랜치 생성
git checkout -b feature/user-authentication

# 3. 개발 및 커밋
git add .
git commit -m "feat: 사용자 인증 기능 추가"

# 4. 원격 저장소에 푸시
git push origin feature/user-authentication

# 5. Pull Request 생성 (GitHub에서)
#   - Base: develop
#   - Compare: feature/user-authentication
```

### 2. Pull Request 규칙

**PR 타입:**

- **기능 브랜치 → develop**: 기능 개발 완료 후 통합
- **develop → main**: 배포 준비 완료 후 프로덕션 배포

**PR 제목 형식:**

```
[Type] 간단한 설명

예:
[Feature] 사용자 인증 기능 추가
[Fix] 로그인 오류 처리 개선
[Refactor] 데이터베이스 스키마 리팩토링
```

**PR 설명 템플릿:**

```markdown
## 변경 사항

- 사용자 인증 기능 추가
- 로그인/회원가입 페이지 구현

## 관련 이슈

- #123

## 체크리스트

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 문서 업데이트
- [ ] 개발 로드맵 업데이트
```

### 3. 코드 리뷰 및 병합

**기능 브랜치 → develop:**

- 최소 1명의 리뷰어 승인 필요 (1인 프로젝트는 자체 리뷰)
- CI/CD 테스트 통과 필수
- 충돌 해결 후 병합
- 병합 후 브랜치 삭제

**develop → main:**

- 모든 기능이 안정화된 상태
- 충분한 테스트 완료
- 배포 준비 완료
- 버전 태그 생성 권장

### 4. 커밋 메시지 규칙

**Conventional Commits** 형식 사용:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**타입:**

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경

**예시:**

```
feat(auth): Supabase 인증 기능 추가

- 로그인 페이지 구현
- 회원가입 페이지 구현
- 인증 미들웨어 설정

Closes #123
```

```
fix(budget): 예산 계산 오류 수정

예산 잔액 계산 시 음수 값이 나오는 문제 수정

Fixes #456
```

## Phase별 브랜치 전략

### Phase 0-1: 초기 설정 (완료)

- `main` 브랜치에서 초기 설정 완료
- `develop` 브랜치 생성 및 기본 구조 설정

### Phase 2 이후: 기능 개발

- `develop` 브랜치를 기본으로 사용
- 각 기능별로 `feature/{description}` 브랜치 생성
- 예: `feature/user-authentication`, `feature/expense-management`
- 완료 후 `develop`에 병합
- 배포 준비 완료 시 `main`에 병합

## GitHub Default Branch 설정

### 권장 설정: `main`을 Default Branch로 유지

**이유:**

- 프로덕션 코드가 기본 브랜치인 것이 더 안전하고 명확함
- 새로 클론할 때 안정적인 코드를 받게 됨
- PR의 기본 base가 `main`이 되는 것이 직관적
- 일반적인 Git Flow 관행과 일치

**설정 방법:**

1. GitHub 저장소 > **Settings** > **Branches**
2. Default branch를 `main`으로 설정 (이미 설정되어 있음)
3. `develop` 브랜치는 별도로 보호 규칙 설정

### 대안: `develop`을 Default Branch로 설정 (비권장)

**언제 사용:**

- 아직 프로덕션 배포 전인 초기 개발 단계
- 개발자가 항상 최신 개발 코드를 받아야 하는 경우

**단점:**

- 불안정한 코드가 기본 브랜치가 됨
- 새로 클론할 때 개발 중인 코드를 받게 됨
- 일반적인 관행과 다름

## 보호 브랜치 설정 (권장)

GitHub 저장소 설정에서 `main`과 `develop` 브랜치 보호:

### main 브랜치 보호

1. **Settings** > **Branches** > **Add rule**
2. Branch name pattern: `main`
3. 설정 항목:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1 (또는 0)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict who can push to matching branches: `develop`에서만 병합 가능
   - ✅ Do not allow bypassing the above settings

### develop 브랜치 보호 (선택사항)

1. **Settings** > **Branches** > **Add rule**
2. Branch name pattern: `develop`
3. 설정 항목:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging (선택사항)

## CI/CD 통합

### GitHub Actions 워크플로우 (향후 추가)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

## 브랜치 정리

### 정기적인 브랜치 정리

```bash
# 로컬에서 병합된 브랜치 삭제 (develop 기준)
git branch --merged develop | grep -v "develop\|main" | xargs git branch -d

# main에 병합된 브랜치도 정리
git branch --merged main | grep -v "develop\|main" | xargs git branch -d

# 원격에서 삭제된 브랜치 정리
git fetch --prune
```

## 예외 상황

### 긴급 수정 (Hotfix)

```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. 수정 및 커밋
# ... 수정 작업 ...
git commit -m "hotfix: 긴급 버그 수정"

# 3. 즉시 main에 병합
git checkout main
git merge hotfix/critical-bug
git push origin main

# 4. develop에도 병합 (중요!)
git checkout develop
git merge hotfix/critical-bug
git push origin develop

# 5. hotfix 브랜치 삭제
git branch -d hotfix/critical-bug
git push origin --delete hotfix/critical-bug
```

## 참고 자료

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)
