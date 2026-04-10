"""bcamp-daily 크롤러 엔트리포인트.

Usage:
    python -m crawler.main --date 2026-04-08
    python -m crawler.main               # 어제 날짜 자동 처리
    python -m crawler.main --dry-run     # 크롤링만, YouTube API 호출 없음
"""

import argparse
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

from crawler.auth import get_youtube_client
from crawler.mbc_crawler import find_seq_id, fetch_songs, get_source_url
from crawler.youtube_client import search_videos, create_playlist, add_to_playlist, QuotaExceededError

# 프로젝트 루트 기준 data/ 디렉토리
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _parse_date(date_str: str) -> date:
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        print(f"[오류] 날짜 형식이 올바르지 않습니다: {date_str} (예: 2026-04-08)")
        sys.exit(1)


def _day_of_week_ko(d: date) -> str:
    return ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"][d.weekday()]


def run(target_date: date, dry_run: bool = False) -> Path:
    date_str = target_date.isoformat()
    print(f"\n[bcamp-daily] {date_str} ({_day_of_week_ko(target_date)}) 처리 시작\n")

    # 1. MBC 크롤링 — seqID 찾기
    print("1/4 MBC 선곡표 목록에서 seqID 탐색...")
    seq_id = find_seq_id(target_date)
    if seq_id is None:
        print(f"[오류] {date_str} 선곡표를 MBC에서 찾을 수 없습니다.")
        sys.exit(1)
    print(f"     seqID = {seq_id}")

    # 2. 곡 목록 파싱
    print("2/4 곡 목록 파싱...")
    songs = fetch_songs(seq_id)
    if not songs:
        print("[오류] 곡 목록을 파싱하지 못했습니다.")
        sys.exit(1)
    print(f"     {len(songs)}곡 파싱 완료")
    for s in songs:
        print(f"     {s['order']:2d}. {s['title']} — {s['artist']}")

    if dry_run:
        print("\n[dry-run] YouTube API 호출 없이 종료.")
        return _save_json(date_str, target_date, seq_id, songs, playlist_id=None)

    # 3. YouTube API
    print("\n3/4 YouTube 플레이리스트 생성...")
    import os
    if os.environ.get("GOOGLE_REFRESH_TOKEN"):
        # CI 환경 (GitHub Actions)
        from crawler.auth_ci import get_youtube_client_ci
        youtube = get_youtube_client_ci()
    else:
        # 로컬 환경 (OAuth 브라우저 플로우)
        youtube = get_youtube_client(
            client_secret_path=str(Path(__file__).parent / "client_secret.json"),
            token_path=str(Path(__file__).parent / "token.pickle"),
        )

    try:
        playlist_id = create_playlist(
            youtube,
            title=f"배철수의 음악캠프 {date_str}",
            description=f"출처: MBC 배철수의 음악캠프\n{get_source_url(seq_id)}",
        )
        print(f"     플레이리스트 생성: {playlist_id}")

        matched = 0
        for song in songs:
            query = f"{song['title']} {song['artist']}"
            results = search_videos(youtube, query, max_results=1)
            if results:
                video = results[0]
                song["videoId"] = video["video_id"]
                song["videoTitle"] = video["title"]
                song["channel"] = video["channel"]
                song["matched"] = True
                add_to_playlist(youtube, playlist_id, video["video_id"])
                matched += 1
                print(f"     ✓ {song['order']:2d}. {song['title']} → {video['title'][:50]}")
            else:
                song["videoId"] = None
                song["videoTitle"] = None
                song["channel"] = None
                song["matched"] = False
                print(f"     ✗ {song['order']:2d}. {song['title']} — 검색 결과 없음")

    except QuotaExceededError as e:
        print(f"\n[오류] {e}")
        sys.exit(1)

    print(f"\n4/4 JSON 저장...")
    output_path = _save_json(date_str, target_date, seq_id, songs, playlist_id)
    print(f"     {output_path}")
    print(f"\n완료! {matched}/{len(songs)}곡 매칭")
    print(f"YouTube: https://www.youtube.com/playlist?list={playlist_id}")
    return output_path


def _save_json(
    date_str: str,
    target_date: date,
    seq_id: int,
    songs: list[dict],
    playlist_id: str | None,
) -> Path:
    import datetime as dt

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DATA_DIR / f"{date_str}.json"

    playlist_data = None
    if playlist_id:
        playlist_data = {
            "playlistId": playlist_id,
            "url": f"https://www.youtube.com/playlist?list={playlist_id}",
            "musicUrl": f"https://music.youtube.com/playlist?list={playlist_id}",
        }

    matched_count = sum(1 for s in songs if s.get("matched", False))

    payload = {
        "date": date_str,
        "dayOfWeek": _day_of_week_ko(target_date),
        "seqID": seq_id,
        "source": get_source_url(seq_id),
        "youtube": playlist_data,
        "songs": songs,
        "createdAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "matchRate": matched_count,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return output_path


def _resolve_date(date_arg: str | None) -> date:
    """처리할 날짜 자동 결정.

    --date 없으면:
      1. 오늘 날짜 선곡표가 MBC에 있으면 → 오늘
      2. 없으면 → 어제
      3. 이미 data/ 에 해당 JSON 있으면 → 스킵 (sys.exit 0)
    """
    if date_arg:
        return _parse_date(date_arg)

    for candidate in [date.today(), date.today() - timedelta(days=1)]:
        output_path = DATA_DIR / f"{candidate.isoformat()}.json"
        if output_path.exists():
            print(f"[스킵] {candidate.isoformat()} 선곡표 이미 존재: {output_path}")
            sys.exit(0)

        seq_id = find_seq_id(candidate)
        if seq_id is not None:
            print(f"[자동 감지] {candidate.isoformat()} 선곡표 발견 (seqID={seq_id})")
            return candidate

    print("[오류] 오늘/어제 선곡표를 MBC에서 찾을 수 없습니다.")
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="배철수의 음악캠프 선곡표 → YouTube 플레이리스트")
    parser.add_argument("--date", help="처리할 날짜 (YYYY-MM-DD). 기본값: 자동 감지")
    parser.add_argument("--dry-run", action="store_true", help="크롤링만, YouTube API 호출 없음")
    args = parser.parse_args()

    target_date = _resolve_date(args.date)
    run(target_date, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
