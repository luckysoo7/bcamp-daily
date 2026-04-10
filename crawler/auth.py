import os
import pickle
import sys

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build, Resource

SCOPES = ["https://www.googleapis.com/auth/youtube"]


def get_youtube_client(
    client_secret_path: str = "client_secret.json",
    token_path: str = "token.pickle",
) -> Resource:
    """YouTube Data API v3 인증 클라이언트 반환."""
    if not os.path.exists(client_secret_path):
        print(
            f"[오류] '{client_secret_path}' 파일을 찾을 수 없습니다.\n"
            "Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 생성하고\n"
            "client_secret.json을 프로젝트 루트에 배치하세요.\n"
            "https://console.cloud.google.com/apis/credentials"
        )
        sys.exit(1)

    creds = None

    if os.path.exists(token_path):
        with open(token_path, "rb") as f:
            creds = pickle.load(f)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_path, SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open(token_path, "wb") as f:
            pickle.dump(creds, f)

    return build("youtube", "v3", credentials=creds)
