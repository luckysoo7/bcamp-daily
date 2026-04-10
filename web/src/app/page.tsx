import { loadLatest } from "@/lib/data";

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

export default function Home() {
  const latest = loadLatest();

  if (!latest) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: "var(--text-muted)" }}>
          <p className="text-2xl mb-2">아직 선곡표가 없습니다</p>
          <p className="text-sm">크롤러를 먼저 실행해주세요</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 max-w-xl mx-auto">
      {/* 헤더 */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          {latest.seqID && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(232,112,74,0.15)",
                color: "var(--sunset-orange)",
              }}
            >
              제 {latest.seqID}회
            </span>
          )}
          <span className="text-xs tracking-widest" style={{ color: "var(--text-muted)" }}>
            최신 방송
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-none mb-2" data-testid="date-heading">
          {formatDate(latest.date)}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {latest.dayOfWeek} · {latest.songs.length}곡 선곡 · MBC FM4U
        </p>
      </header>

      {/* CTA 버튼 */}
      {latest.youtube && (
        <div className="flex gap-3 mb-10">
          <a
            href={latest.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-85"
            style={{ background: "var(--sunset-orange)", color: "#fff" }}
          >
            YouTube에서 듣기
          </a>
          <a
            href={latest.youtube.musicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: "rgba(232,112,74,0.08)",
              color: "var(--sunset-orange)",
              border: "1px solid rgba(232,112,74,0.25)",
            }}
          >
            YouTube Music
          </a>
        </div>
      )}

      {/* 선곡 목록 — Apple Music row 스타일 */}
      <ol data-testid="song-list">
        {latest.songs.map((song) => (
          <li
            key={song.order}
            className="flex items-center gap-4 py-3.5 group"
            style={{ borderBottom: "1px solid var(--track-border)" }}
          >
            <span
              className="w-5 text-right text-xs tabular-nums shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {song.order}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-snug truncate">{song.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {song.artist}
              </p>
            </div>
            {song.videoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${song.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all opacity-30 group-hover:opacity-100"
                style={{ background: "rgba(232,112,74,0.15)", color: "var(--sunset-orange)" }}
              >
                ▶
              </a>
            ) : (
              <div className="w-7 shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
