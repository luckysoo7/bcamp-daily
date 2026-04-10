"""CI 환경용 YouTube 인증 — refresh token 기반.

GitHub Actions에서는 브라우저 OAuth 플로우가 불가능하다.
GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN 환경변수로 인증한다.
"""

import json
import os
import sys

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build, Resource

from crawler.auth import SCOPES


def get_youtube_client_ci() -> Resource:
    """CI 환경에서 환경변수 기반으로 YouTube 클라이언트 반환."""
    client_secret_json = os.environ.get("GOOGLE_CLIENT_SECRET")
    refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN")

    if not client_secret_json or not refresh_token:
        print(
            "[오류] GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN 환경변수가 필요합니다.\n"
            "GitHub Actions Secrets에 등록되어 있는지 확인하세요."
        )
        sys.exit(1)

    secret = json.loads(client_secret_json)
    # client_secret.json 구조: {"installed": {"client_id": ..., "client_secret": ...}}
    installed = secret.get("installed") or secret.get("web", {})

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=installed["client_id"],
        client_secret=installed["client_secret"],
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return build("youtube", "v3", credentials=creds)
