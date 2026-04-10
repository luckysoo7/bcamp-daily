import { notFound } from "next/navigation";
import { loadPlaylist, getAllDateParams } from "@/lib/data";

export function generateStaticParams() {
  return getAllDateParams();
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${+m}월 ${+d}일`;
}

export default async function DatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const data = loadPlaylist(date);

  if (!data) {
    notFound();
  }

  return (
    <main className="px-8 py-10 max-w-[720px] mx-auto">
      {/* 헤더 */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          {data.seqID && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(232,112,74,0.15)",
                color: "var(--sunset-orange)",
              }}
            >
              제 {data.seqID}회
            </span>
          )}
          <span className="text-xs tracking-widest" style={{ color: "var(--text-muted)" }}>
            지난 방송
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-none mb-2">
          {formatDate(date)}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {data.dayOfWeek} · {data.songs.length}곡 선곡 · MBC FM4U
        </p>
      </header>

      {/* CTA 버튼 */}
      {data.youtube && (
        <div className="flex gap-3 mb-10">
          <a
            href={data.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-85"
            style={{ background: "var(--sunset-orange)", color: "#fff" }}
          >
            YouTube에서 듣기
          </a>
          <a
            href={data.youtube.musicUrl}
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
      <ol>
        {data.songs.map((song) => (
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
