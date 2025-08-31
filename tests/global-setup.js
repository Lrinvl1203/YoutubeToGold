// global-setup.js - Playwright 전역 설정
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 YouTube API Monetize - Playwright 테스트 환경 설정 중...');
  
  // 브라우저 실행 테스트
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로컬 서버 접근 테스트
    await page.goto('http://localhost:8080');
    console.log('✅ 로컬 서버 연결 성공');
    
    // 기본 HTML 로드 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    // YouTube API 키 환경변수 확인
    const hasApiKey = process.env.YOUTUBE_API_KEY;
    if (hasApiKey) {
      console.log('🔑 YouTube API 키 환경변수 확인됨');
    } else {
      console.log('⚠️  YouTube API 키 없음 - 모킹 모드로 테스트 진행');
    }
    
  } catch (error) {
    console.error('❌ 전역 설정 실패:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Playwright 환경 설정 완료\n');
}

module.exports = globalSetup;