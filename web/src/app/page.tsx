import fs from "fs";
import path from "path";

// data/ 디렉토리는 web/ 의 상위 디렉토리에 위치
const DATA_DIR = path.join(process.cwd(), "..", "data");

interface Song {
  order: number;
  title: string;
  artist: string;
  videoId: string | null;
  videoTitle: string | null;
  channel: string | null;
  matched: boolean;
}

interface PlaylistData {
  date: string;
  dayOfWeek: string;
  seqID: number;
  source: string;
  youtube: {
    playlistId: string;
    url: string;
    musicUrl: string;
  } | null;
  songs: Song[];
  createdAt: string;
  matchRate: number;
}

function loadLatest(): PlaylistData | null {
  if (!fs.existsSync(DATA_DIR)) return null;

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const raw = fs.readFileSync(path.join(DATA_DIR, files[0]), "utf-8");
  return JSON.parse(raw) as PlaylistData;
}

export default function Home() {
  const data = loadLatest();

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: "var(--text-muted)" }}>
          <p className="text-2xl mb-2">아직 선곡표가 없습니다</p>
          <p className="text-sm">
            크롤러를 먼저 실행해주세요:{" "}
            <code className="bg-white/10 px-2 py-0.5 rounded">
              python -m crawler.main --date YYYY-MM-DD
            </code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      {/* 헤더 */}
      <header className="mb-10">
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          배철수의 음악캠프
        </p>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="date-heading">
          {data.date}
        </h1>
        <p className="mt-1" style={{ color: "var(--sunset-gold)" }}>
          {data.dayOfWeek} · {data.songs.length}곡
        </p>
      </header>

      {/* CTA 버튼 */}
      {data.youtube && (
        <div className="flex gap-3 mb-10">
          <a
            href={data.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: "linear-gradient(135deg, var(--sunset-orange), var(--sunset-gold))",
              color: "#fff",
            }}
          >
            YouTube에서 듣기
          </a>
          <a
            href={data.youtube.musicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: "var(--card-bg)",
              color: "var(--sunset-gold)",
              border: "1px solid var(--sunset-gold)",
            }}
          >
            YouTube Music
          </a>
        </div>
      )}

      {/* 선곡 목록 */}
      <ol className="space-y-3" data-testid="song-list">
        {data.songs.map((song) => (
          <li
            key={song.order}
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{ background: "var(--card-bg)" }}
          >
            <span
              className="text-xs font-mono w-5 shrink-0 mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {song.order}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{song.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {song.artist}
              </p>
            </div>
            {song.videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${song.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-70"
                style={{
                  background: "rgba(232,112,74,0.15)",
                  color: "var(--sunset-orange)",
                }}
                aria-label={`${song.title} YouTube 링크`}
              >
                ▶
              </a>
            )}
          </li>
        ))}
      </ol>

      {/* 푸터 */}
      <footer className="mt-12 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        <p>출처: MBC 배철수의 음악캠프</p>
        <p className="mt-1">비공식 팬 서비스 · MBC와 무관합니다</p>
      </footer>
    </main>
  );
}
