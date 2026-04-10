import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaylist, getAllDateParams } from "@/lib/data";

export function generateStaticParams() {
  return getAllDateParams();
}

export default async function DatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const data = loadPlaylist(date);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm mb-8 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        ← 목록으로
      </Link>

      {/* 헤더 */}
      <header className="mb-8">
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          배철수의 음악캠프
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{date}</h1>
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
      <ol className="space-y-3 mb-14">
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
                style={{ background: "rgba(232,112,74,0.15)", color: "var(--sunset-orange)" }}
              >
                ▶
              </a>
            )}
          </li>
        ))}
      </ol>

      <footer className="mt-12 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        <p>출처: MBC 배철수의 음악캠프</p>
        <p className="mt-1">비공식 팬 서비스 · MBC와 무관합니다</p>
      </footer>
    </main>
  );
}
