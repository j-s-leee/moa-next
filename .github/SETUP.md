# GitHub 저장소 초기 설정 가이드

## 1. Default Branch 설정

### 권장: `main`을 Default Branch로 유지

**설정 방법:**
1. GitHub 저장소 접속
2. **Settings** > **Branches** 메뉴로 이동
3. Default branch가 `main`으로 설정되어 있는지 확인
4. 필요시 `main`으로 변경

**이유:**
- 프로덕션 코드가 기본 브랜치인 것이 안전함
- 새로 클론할 때 안정적인 코드를 받게 됨
- 일반적인 Git Flow 관행과 일치

## 2. 브랜치 보호 규칙 설정

### main 브랜치 보호

1. **Settings** > **Branches** > **Add rule**
2. Branch name pattern: `main`
3. 설정 항목:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1 (또는 0, 1인 프로젝트인 경우)
   - ✅ Require status checks to pass before merging (CI/CD 설정 후)
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict who can push to matching branches: `develop`에서만 병합 가능하도록 설정
   - ✅ Do not allow bypassing the above settings

### develop 브랜치 보호 (선택사항)

1. **Settings** > **Branches** > **Add rule**
2. Branch name pattern: `develop`
3. 설정 항목:
   - ✅ Require a pull request before merging (선택사항)
   - ✅ Require status checks to pass before merging (선택사항)

## 3. Pull Request 템플릿 설정

PR 템플릿이 자동으로 적용되도록 설정:

1. **Settings** > **General** > **Pull requests**
2. ✅ Allow merge commits
3. ✅ Allow squash merging (권장)
4. ✅ Allow rebase merging

## 4. Issue 템플릿 설정 (선택사항)

`.github/ISSUE_TEMPLATE/` 폴더에 이슈 템플릿 추가 가능

## 5. GitHub Actions 설정 (향후)

CI/CD 파이프라인 설정 시:
- `.github/workflows/` 폴더에 워크플로우 파일 추가
- Lint, Build, Test 자동화

## 체크리스트

- [ ] Default branch가 `main`으로 설정됨
- [ ] `main` 브랜치 보호 규칙 설정 완료
- [ ] `develop` 브랜치 보호 규칙 설정 (선택사항)
- [ ] Pull Request 템플릿 적용 확인
- [ ] 브랜치 전략 문서 확인 (`.github/BRANCH_STRATEGY.md`)

