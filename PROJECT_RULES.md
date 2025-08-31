# PROJECT RULES - YouTube API Monetization Project

## 절대적 준수 사항

### 1. SuperClaude Framework 최적화
- 모든 작업에 SuperClaude, SC MCP, MCP 최신 안정화 버전 적극 활용
- Context7, Sequential, Magic, Playwright 통합 사용
- 자동 플래그 활성화 및 페르소나 시스템 최적화 적용

### 2. 프롬프트 최적화 시스템
- 사용자 입력 시 프롬프트를 자동 최적화하여 적용
- 결과 재현을 위한 최적화된 프롬프트 기록
- 바이브코딩 시 일관된 결과값 보장

### 3. 코드 품질 기준
- 합리적이고 최적화된 코드 구성
- 테스트 자체 검토 필수
- 불확실한 사항은 반드시 사용자 확인 후 진행

### 4. 플래깅 및 버전 관리
- 모든 수행 결과에 번호 부여 (FLAG-YYYYMMDD-HHmm-XXX)
- 문제 발생 시 이전 상태로 롤백 가능하도록 관리
- 각 단계별 상태 저장 및 추적

### 5. 로깅 시스템
- 프롬프트 입력/출력 날짜/시간별 기록
- 별도 폴더 구조로 체계적 관리
- 결과값 추적 및 분석 가능한 형태로 저장

## 프로젝트 구조

```
PROJECT_ROOT/
├── logs/
│   ├── prompts/
│   │   ├── YYYY-MM-DD/
│   │   │   ├── HH-mm-ss_prompt.md
│   │   │   └── HH-mm-ss_result.md
│   ├── flags/
│   │   └── FLAG-YYYYMMDD-HHmm-XXX.md
│   └── versions/
│       └── VERSION-XXX/
├── src/
├── tests/
└── docs/
```

## 실행 원칙

1. **확인 우선**: 모르는 것은 반드시 사용자 확인
2. **최적화 우선**: SuperClaude 프레임워크 최대 활용
3. **기록 우선**: 모든 과정 체계적 기록
4. **품질 우선**: 테스트와 검증을 통한 안정성 확보
5. **재현성 우선**: 동일 결과 보장 가능한 시스템 구축

---
생성일시: 2025-08-31 14:00
플래그: FLAG-20250831-1400-001
상태: ACTIVE