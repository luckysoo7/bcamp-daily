"""MBC 배철수의 음악캠프 선곡표 크롤러."""

import html
import re
from datetime import date
from urllib.parse import urlencode, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://miniweb.imbc.com"
LIST_URL = f"{BASE_URL}/Music"
VIEW_URL = f"{BASE_URL}/Music/View"
PROG_CODE = "RAMFM300"


def _get(url: str, params: dict | None = None) -> BeautifulSoup:
    """GET 요청 후 BeautifulSoup 반환."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }
    resp = requests.get(url, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding
    return BeautifulSoup(resp.text, "html.parser")


def find_seq_id(target_date: date) -> int | None:
    """선곡표 목록 페이지에서 target_date에 해당하는 seqID 반환.

    여러 페이지를 순회하며 찾는다 (최대 5페이지).
    """
    date_str = target_date.strftime("%Y-%m-%d")

    for page in range(1, 6):
        soup = _get(LIST_URL, params={"progCode": PROG_CODE, "page": page})

        # 테이블 내 각 행에서 날짜 + href 추출
        for row in soup.select("table tr"):
            cells = row.find_all("td")
            if len(cells) < 2:
                continue

            # 날짜 셀 텍스트 정규화
            row_date = cells[0].get_text(strip=True)
            if row_date != date_str:
                continue

            # 링크에서 seqID 추출
            link = row.find("a", href=True)
            if not link:
                continue

            qs = parse_qs(urlparse(link["href"]).query)
            seq_ids = qs.get("seqID") or qs.get("seqId")
            if seq_ids:
                return int(seq_ids[0])

    return None


def fetch_songs(seq_id: int) -> list[dict]:
    """특정 seqID의 선곡표 페이지에서 곡 목록 파싱.

    반환 형식:
        [{"order": 1, "title": "SONG TITLE", "artist": "ARTIST NAME"}, ...]
    """
    soup = _get(VIEW_URL, params={"seqID": seq_id, "progCode": PROG_CODE})

    songs: list[dict] = []

    # 선곡표 테이블: 번호 / 곡명 / 가수 3열 구조
    for row in soup.select("table tr"):
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        order_text = cells[0].get_text(strip=True)
        if not order_text.isdigit():
            continue  # 헤더 행 스킵

        title = html.unescape(cells[1].get_text(strip=True))
        artist = html.unescape(cells[2].get_text(strip=True))

        # 빈 행 스킵
        if not title:
            continue

        songs.append(
            {
                "order": int(order_text),
                "title": title,
                "artist": artist,
            }
        )

    return songs


def get_source_url(seq_id: int) -> str:
    """해당 seqID의 MBC 선곡표 URL 반환."""
    params = urlencode({"seqID": seq_id, "progCode": PROG_CODE})
    return f"{VIEW_URL}?{params}"
