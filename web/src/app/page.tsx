import { loadLatest } from "@/lib/data";
import PlaylistView from "@/components/PlaylistView";

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

  return <PlaylistView data={latest} label="최신 방송" />;
}
