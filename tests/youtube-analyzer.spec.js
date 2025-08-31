// youtube-analyzer.spec.js - YouTube 분석기 핵심 기능 테스트
const { test, expect } = require('@playwright/test');

// 테스트용 YouTube API 응답 모킹 데이터
const mockApiResponses = {
  search: {
    kind: 'youtube#searchListResponse',
    etag: 'test-etag',
    nextPageToken: 'CAUQAA',
    regionCode: 'KR',
    pageInfo: { totalResults: 1000, resultsPerPage: 10 },
    items: [
      {
        kind: 'youtube#searchResult',
        etag: 'test-item-etag',
        id: { kind: 'youtube#video', videoId: 'dQw4w9WgXcQ' },
        snippet: {
          publishedAt: '2023-01-01T00:00:00Z',
          channelId: 'UCtest',
          title: '테스트 비디오 제목',
          description: '테스트 설명입니다',
          thumbnails: {
            default: { url: 'https://i.ytimg.com/vi/test/default.jpg' },
            medium: { url: 'https://i.ytimg.com/vi/test/mqdefault.jpg' },
            high: { url: 'https://i.ytimg.com/vi/test/hqdefault.jpg' }
          },
          channelTitle: '테스트 채널',
          liveBroadcastContent: 'none'
        }
      }
    ]
  },
  videos: {
    kind: 'youtube#videoListResponse',
    etag: 'test-video-etag',
    items: [
      {
        kind: 'youtube#video',
        etag: 'test-video-item',
        id: 'dQw4w9WgXcQ',
        statistics: {
          viewCount: '1000000',
          likeCount: '50000',
          dislikeCount: '1000',
          favoriteCount: '0',
          commentCount: '10000'
        },
        contentDetails: {
          duration: 'PT3M33S',
          dimension: '2d',
          definition: 'hd'
        }
      }
    ]
  },
  channels: {
    kind: 'youtube#channelListResponse',
    etag: 'test-channel-etag',
    items: [
      {
        kind: 'youtube#channel',
        etag: 'test-channel-item',
        id: 'UCtest',
        statistics: {
          viewCount: '100000000',
          subscriberCount: '1000000',
          hiddenSubscriberCount: false,
          videoCount: '500'
        }
      }
    ]
  }
};

test.describe('YouTube Pro Analyzer - 핵심 기능 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // API 호출 모킹 설정
    await page.route('**/youtube/v3/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.search)
      });
    });
    
    await page.route('**/youtube/v3/videos**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.videos)
      });
    });
    
    await page.route('**/youtube/v3/channels**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.channels)
      });
    });
    
    // 페이지 로드
    await page.goto('/Youtube_Pro_analyzer.html');
    await page.waitForLoadState('networkidle');
  });

  test('페이지 기본 로드 테스트', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/YouTube 프로 분석기/);
    
    // 메인 헤더 확인
    await expect(page.locator('h1')).toContainText('YouTube 프로 분석기');
    
    // API 설정 버튼 확인
    await expect(page.locator('.api-settings-btn')).toBeVisible();
    
    // 네비게이션 탭들 확인
    await expect(page.locator('.nav-tabs')).toBeVisible();
    await expect(page.locator('.nav-tab')).toHaveCount(4); // 검색, 경쟁사, 트렌딩, 채널
  });

  test('API 키 설정 모달 테스트', async ({ page }) => {
    // API 설정 버튼 클릭
    await page.click('.api-settings-btn');
    
    // 모달 열림 확인
    await expect(page.locator('#apiModal')).toBeVisible();
    await expect(page.locator('#apiModal')).toHaveClass(/show/);
    
    // API 키 입력 필드 확인
    await expect(page.locator('#apiKey')).toBeVisible();
    
    // 테스트 API 키 입력
    await page.fill('#apiKey', 'test-api-key-12345');
    
    // 저장 버튼 클릭
    await page.click('#saveApiKey');
    
    // 모달 닫힘 확인
    await expect(page.locator('#apiModal')).not.toHaveClass(/show/);
    
    // API 상태 버튼 변경 확인 (연결됨 상태)
    await expect(page.locator('.api-settings-btn')).toHaveClass(/connected/);
  });

  test('기본 검색 기능 테스트', async ({ page }) => {
    // API 키 설정
    await page.evaluate(() => {
      localStorage.setItem('youtube_api_key', 'test-api-key');
    });
    await page.reload();
    
    // 검색어 입력
    await page.fill('#searchQuery', '테스트 키워드');
    
    // 검색 버튼 클릭
    await page.click('#searchBtn');
    
    // 로딩 상태 확인
    await expect(page.locator('#searchBtn')).toHaveText(/검색 중.../);
    
    // 결과 표시 대기
    await page.waitForSelector('.results-grid', { timeout: 10000 });
    
    // 검색 결과 확인
    await expect(page.locator('.results-grid')).toBeVisible();
    await expect(page.locator('.video-card')).toHaveCountGreaterThan(0);
    
    // 비디오 카드 내용 확인
    const firstCard = page.locator('.video-card').first();
    await expect(firstCard.locator('.video-title')).toContainText('테스트 비디오');
    await expect(firstCard.locator('.video-thumbnail img')).toHaveAttribute('src');
  });

  test('고급 필터 기능 테스트', async ({ page }) => {
    // API 키 설정
    await page.evaluate(() => {
      localStorage.setItem('youtube_api_key', 'test-api-key');
    });
    await page.reload();
    
    // 고급 필터 섹션 열기
    await page.click('.advanced-filters-toggle');
    await expect(page.locator('.advanced-filters-content')).toBeVisible();
    
    // 조회수 필터 설정
    await page.selectOption('#viewsFilter', 'min');
    await page.fill('#customViewsMin', '100000');
    
    // 구독자 수 필터 설정
    await page.selectOption('#subscribersFilter', 'min');
    await page.fill('#customSubscribersMin', '10000');
    
    // 필터 적용 버튼 클릭
    await page.click('.filter-actions .btn-accent');
    
    // 검색 실행
    await page.fill('#searchQuery', '인기 비디오');
    await page.click('#searchBtn');
    
    // 필터링된 결과 확인
    await page.waitForSelector('.results-grid');
    await expect(page.locator('.video-card')).toHaveCountGreaterThan(0);
  });

  test('페이지네이션 테스트', async ({ page }) => {
    // API 키 설정 및 검색 실행
    await page.evaluate(() => {
      localStorage.setItem('youtube_api_key', 'test-api-key');
    });
    await page.reload();
    
    await page.fill('#searchQuery', '페이지네이션 테스트');
    await page.click('#searchBtn');
    
    // 첫 페이지 결과 확인
    await page.waitForSelector('.results-grid');
    const initialResultsCount = await page.locator('.video-card').count();
    expect(initialResultsCount).toBeGreaterThan(0);
    
    // 다음 페이지 버튼이 활성화되었는지 확인
    await expect(page.locator('#nextPage')).not.toBeDisabled();
    
    // 다음 페이지로 이동
    await page.click('#nextPage');
    
    // 로딩 후 새로운 결과 확인
    await page.waitForSelector('.results-grid');
    
    // 이전 페이지 버튼이 활성화되었는지 확인
    await expect(page.locator('#prevPage')).not.toBeDisabled();
  });

  test('경쟁사 분석 탭 테스트', async ({ page }) => {
    // API 키 설정
    await page.evaluate(() => {
      localStorage.setItem('youtube_api_key', 'test-api-key');
    });
    await page.reload();
    
    // 경쟁사 분석 탭 클릭
    await page.click('.nav-tab[data-tab="competitor"]');
    
    // 경쟁사 분석 콘텐츠 표시 확인
    await expect(page.locator('#competitor-content')).toBeVisible();
    await expect(page.locator('#competitor-content')).toHaveClass(/active/);
    
    // 채널명 입력 필드 확인
    await expect(page.locator('#competitorChannel')).toBeVisible();
    
    // 채널명 입력 및 분석 실행
    await page.fill('#competitorChannel', '테스트 채널');
    await page.click('#analyzeCompetitor');
    
    // 분석 결과 확인 (모킹된 데이터 기반)
    await page.waitForSelector('.competitor-results', { timeout: 10000 });
    await expect(page.locator('.competitor-results')).toBeVisible();
  });

  test('에러 핸들링 테스트 - API 키 없음', async ({ page }) => {
    // localStorage에서 API 키 제거
    await page.evaluate(() => {
      localStorage.removeItem('youtube_api_key');
    });
    await page.reload();
    
    // API 키 없이 검색 시도
    await page.fill('#searchQuery', '테스트');
    await page.click('#searchBtn');
    
    // 에러 메시지 확인 (alert 대신 UI 메시지로 개선 필요)
    await page.waitForFunction(() => {
      return window.localStorage.getItem('last_error') !== null;
    });
  });

  test('에러 핸들링 테스트 - API 호출 실패', async ({ page }) => {
    // API 호출 실패 시뮬레이션
    await page.route('**/youtube/v3/search**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 400,
            message: 'API 키가 유효하지 않습니다',
            errors: [{ reason: 'keyInvalid' }]
          }
        })
      });
    });
    
    // API 키 설정
    await page.evaluate(() => {
      localStorage.setItem('youtube_api_key', 'invalid-key');
    });
    await page.reload();
    
    // 검색 실행
    await page.fill('#searchQuery', '실패 테스트');
    await page.click('#searchBtn');
    
    // 에러 상태 확인
    await expect(page.locator('#searchBtn')).not.toHaveText(/검색 중.../);
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 레이아웃 반응형 확인
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.nav-tabs')).toBeVisible();
    
    // API 설정 버튼 위치 확인 (모바일에서는 중앙 정렬)
    const apiBtn = page.locator('.api-settings-btn');
    await expect(apiBtn).toBeVisible();
    
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.results-grid')).toBeVisible();
  });

  test('성능 테스트 - 대량 결과 처리', async ({ page }) => {
    // 대량 결과를 위한 모킹 데이터 생성
    const largeResults = {
      ...mockApiResponses.search,
      items: Array(50).fill(0).map((_, i) => ({
        ...mockApiResponses.search.items[0],
        id: { ...mockApiResponses.search.items[0].id, videoId: `video_${i}` },
        snippet: {
          ...mockApiResponses.search.items[0].snippet,
          title: `테스트 비디오 ${i + 1}`
        }
      }))
    };
    
    await page.route('**/youtube/v3/search**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeResults)
      });
    });
    
    // API 키 설정 및 검색
    await page.evaluate(() => {
      localStorage.setItem('youtube_api_key', 'test-api-key');
    });
    await page.reload();
    
    const startTime = Date.now();
    
    await page.fill('#searchQuery', '성능 테스트');
    await page.click('#searchBtn');
    
    // 결과 로딩 대기
    await page.waitForSelector('.results-grid');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // 성능 기준: 5초 이내 로딩
    expect(loadTime).toBeLessThan(5000);
    
    // 모든 결과가 렌더링되었는지 확인
    await expect(page.locator('.video-card')).toHaveCount(50);
  });
});

test.describe('YouTube Pro Analyzer - 브라우저 호환성', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`${browserName} 브라우저 기본 기능 테스트`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `${browserName} 전용 테스트`);
      
      await page.goto('/Youtube_Pro_analyzer.html');
      
      // 기본 로딩 확인
      await expect(page.locator('h1')).toContainText('YouTube 프로 분석기');
      
      // CSS 스타일 적용 확인
      const headerColor = await page.locator('h1').evaluate(el => 
        window.getComputedStyle(el).backgroundImage
      );
      expect(headerColor).toContain('gradient');
      
      // JavaScript 기능 확인
      const hasSearchFunction = await page.evaluate(() => {
        return typeof window.performSearch === 'function';
      });
      expect(hasSearchFunction).toBeTruthy();
    });
  });
});