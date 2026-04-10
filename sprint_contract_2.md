# Sprint 2 Contract — GitHub Actions 자동화 + Vercel 배포

## 목표

매일 06:00 KST에 GitHub Actions가 자동으로:
1. 어제 날짜 선곡표 크롤링 → YouTube 플레이리스트 생성
2. 결과 JSON을 레포에 commit + push
3. Vercel이 push 감지 → 웹사이트 자동 재배포

---

## 전제 조건 (사용자가 직접 해야 하는 것)

### Step A — 새 Google 계정 설정 (bcamp-daily 전용)
1. Gmail 신규 생성
2. [Google Cloud Console](https://console.cloud.google.com) 접속 → 새 프로젝트 생성
3. YouTube Data API v3 활성화
4. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
5. OAuth 동의 화면 → **게시됨(Production)** 으로 변경 (refresh token 7일 만료 방지)
6. `client_secret.json` 다운로드 → `crawler/client_secret.json` 교체

### Step B — 로컬 OAuth 초기화 (새 계정으로 한 번 실행)
```bash
cd /home/lucky/projects/bcamp-daily
source .venv/bin/activate
# 기존 token.pickle 삭제 후 새 계정으로 재발급
rm crawler/token.pickle
python -m crawler.main --date 2026-04-08 --dry-run
# 브라우저 팝업 → 새 Google 계정으로 로그인 → 승인
# crawler/token.pickle 생성됨
```

### Step C — GitHub 레포 생성 + Secret 등록
1. `gh repo create bcamp-daily --public --source=. --push`
2. GitHub Secrets 등록 (Settings → Secrets → Actions):
   - `GOOGLE_CLIENT_SECRET` = `client_secret.json` 파일 전체 내용 (JSON)
   - `GOOGLE_REFRESH_TOKEN` = 아래 명령어로 추출:
     ```bash
     python3 -c "
     import pickle
     with open('crawler/token.pickle', 'rb') as f:
         creds = pickle.load(f)
     print(creds.refresh_token)
     "
     ```
3. Vercel 연동: [vercel.com](https://vercel.com) → Import Git Repository → `bcamp-daily` → Root Directory: `web`

---

## 파일 구조 추가

```
bcamp-daily/
├─ .github/
│  └─ workflows/
│     └─ daily.yml          # 신규: 매일 자동 실행
├─ crawler/
│  └─ auth_ci.py            # 신규: CI 환경용 인증 (refresh token 기반)
└─ web/
   └─ ...                   # 기존 유지
```

---

## 성공 기준

### GitHub Actions
1. `.github/workflows/daily.yml` 존재
2. 스케줄: `cron: '0 21 * * *'` (UTC = KST 06:00)
3. Actions 탭에서 수동 트리거(`workflow_dispatch`) 가능
4. **실제 수동 트리거 실행 성공** — Actions 로그에서 확인:
   - MBC 크롤링 성공
   - YouTube 플레이리스트 생성 성공
   - `data/YYYY-MM-DD.json` commit 확인
5. Actions 실패 시 이메일 알림 (GitHub 기본 제공, 별도 설정 불필요)

### Vercel 배포
6. `https://bcamp-daily.vercel.app` (또는 자동 생성 URL) 접속 성공
7. 루트 페이지에서 선곡표 정상 표시 (Playwright로 원격 URL 검증)

### Evaluator 검증 방식 (Sprint 2 적용)
- GitHub Actions 결과: **실제 수동 트리거 후 Actions 로그 확인** (외부 API 포함 — 사용자가 직접 실행 후 결과 공유)
- Vercel 배포: Playwright로 실제 URL 접속 검증

---

## Sprint 2에서 하지 않을 것
- 아카이브 페이지 (`/archive`)
- 상세 페이지 (`/date/[date]`)
- 디자인 다듬기
- Topic 채널 우선 로직
- 실패 시 Slack/Discord 알림 (이메일로 충분)

---

## 의존성
- `gh` CLI 설치되어 있어야 함 (`gh --version` 확인)
- Vercel CLI 불필요 (GitHub 연동으로 처리)
