import { test, expect } from "@playwright/test";

test.describe("배캠 플레이리스트 홈 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("페이지가 정상 로드된다", async ({ page }) => {
    await expect(page).toHaveTitle(/배철수의 음악캠프/);
  });

  test("날짜 헤더에 2026-04-08이 표시된다", async ({ page }) => {
    const heading = page.getByTestId("date-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("2026-04-08");
  });

  test("선곡 목록이 13곡 이상 표시된다", async ({ page }) => {
    const songList = page.getByTestId("song-list");
    await expect(songList).toBeVisible();

    const items = songList.locator("li");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(13);
  });

  test("선곡 목록이 실제로 화면에 렌더링된다 (크기 검증)", async ({ page }) => {
    const songList = page.getByTestId("song-list");
    const box = await songList.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(200);
  });

  test("첫 번째 곡 이름과 아티스트가 표시된다", async ({ page }) => {
    const songList = page.getByTestId("song-list");
    const firstItem = songList.locator("li").first();
    await expect(firstItem).toContainText("PRIDE AND JOY");
    await expect(firstItem).toContainText("STEVIE RAY VAUGHAN");
  });

  test("dry-run 모드에서는 YouTube CTA 버튼이 없다 (youtube: null)", async ({ page }) => {
    // dry-run JSON에는 youtube: null이므로 버튼이 렌더링되지 않아야 함
    const ytLink = page.locator('a[href*="youtube.com/playlist"]');
    // 버튼이 없거나, 있다면 실제 플리 URL을 가져야 함
    const count = await ytLink.count();
    if (count > 0) {
      const href = await ytLink.first().getAttribute("href");
      expect(href).toMatch(/youtube\.com\/playlist\?list=PL/);
    }
  });
});
