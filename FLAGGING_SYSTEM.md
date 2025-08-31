# FLAGGING & VERSIONING SYSTEM

## 플래그 시스템

### 플래그 번호 체계
```
FLAG-YYYYMMDD-HHmm-XXX
│    │        │    └── 순차번호 (001-999)
│    │        └────── 시간 (24시간 형식)
│    └─────────────── 날짜
└──────────────────── 플래그 식별자
```

### 상태 분류
- **CREATED**: 생성됨
- **ACTIVE**: 활성 상태
- **TESTED**: 테스트 완료
- **VERIFIED**: 검증 완료
- **DEPRECATED**: 사용 중단
- **ROLLBACK**: 롤백됨

### 플래그 로그 템플릿
```yaml
flag_id: FLAG-20250831-1400-001
timestamp: 2025-08-31 14:00:00
action: CREATE_PROJECT_RULES
status: ACTIVE
description: "프로젝트 룰 파일 생성 및 최적화 가이드라인 설정"
files_affected:
  - PROJECT_RULES.md
rollback_point: null
next_flag: FLAG-20250831-1405-002
validation_status: PENDING
```

## 버전 관리 시스템

### 버전 번호 체계
```
VERSION-XXX (001-999)
└── 순차 버전 번호
```

### 버전 상태
- **DEVELOPMENT**: 개발 중
- **TESTING**: 테스트 중
- **STABLE**: 안정 버전
- **PRODUCTION**: 프로덕션
- **ARCHIVED**: 보관됨

### 롤백 절차
1. 문제 상황 발생 시 해당 플래그 확인
2. 이전 안정 플래그 식별
3. 롤백 실행
4. 새로운 플래그로 상태 기록

## 자동화 스크립트 (향후 구현)

### 플래그 생성 자동화
- 타임스탬프 자동 생성
- 순차번호 자동 할당
- 상태 추적 자동화

### 롤백 자동화
- 이전 상태로 자동 복원
- 충돌 해결 지원
- 롤백 로그 자동 기록

---
생성일시: 2025-08-31 14:10
플래그: FLAG-20250831-1410-003
상태: ACTIVE
이전_플래그: FLAG-20250831-1405-002