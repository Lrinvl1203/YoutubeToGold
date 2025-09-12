/**
 * Prompt Optimization System for YoutubeToGold Project
 * 사용자 프롬프트 자동 최적화 및 SuperClaude 프레임워크 통합
 * 
 * @version 1.0.0
 * @flag FLAG-20250913-002
 */

class PromptOptimizer {
  constructor() {
    this.optimizationRules = {
      // SuperClaude Framework 최적화 규칙
      framework: {
        autoFlags: {
          'analyze': ['--think', '--seq'],
          'build': ['--c7', '--magic'],
          'implement': ['--wave-mode', '--validate'],
          'improve': ['--loop', '--delegate'],
          'debug': ['--think-hard', '--seq'],
          'test': ['--play', '--qa']
        },
        autoPersonas: {
          'UI': 'frontend',
          'API': 'backend',
          'architecture': 'architect',
          'security': 'security',
          'performance': 'performance',
          'documentation': 'scribe'
        }
      },
      
      // MCP 서버 자동 선택
      mcpSelection: {
        'Context7': ['library', 'documentation', 'framework', 'pattern'],
        'Sequential': ['analysis', 'complex', 'multi-step', 'debugging'],
        'Magic': ['UI', 'component', 'design', 'frontend'],
        'Playwright': ['test', 'automation', 'e2e', 'browser']
      }
    };
    
    this.logSettings = {
      timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
      versionFormat: 'FLAG-YYYYMMDD-HHmm-XXX',
      storagePath: './logs/'
    };
  }

  /**
   * 사용자 프롬프트 자동 최적화
   * @param {string} userPrompt - 원본 사용자 프롬프트
   * @param {Object} context - 프로젝트 컨텍스트
   * @returns {Object} 최적화된 프롬프트 및 설정
   */
  optimizePrompt(userPrompt, context = {}) {
    const analysis = this.analyzePrompt(userPrompt);
    const optimizedConfig = this.generateOptimizedConfig(analysis, context);
    
    return {
      originalPrompt: userPrompt,
      optimizedPrompt: this.enhancePrompt(userPrompt, optimizedConfig),
      configuration: optimizedConfig,
      timestamp: new Date().toISOString(),
      flagId: this.generateFlagId()
    };
  }

  /**
   * 프롬프트 분석 및 분류
   * @param {string} prompt - 분석할 프롬프트
   * @returns {Object} 분석 결과
   */
  analyzePrompt(prompt) {
    const keywords = prompt.toLowerCase().split(/\s+/);
    
    return {
      intent: this.detectIntent(keywords),
      complexity: this.calculateComplexity(prompt),
      domain: this.detectDomain(keywords),
      operationType: this.detectOperationType(keywords),
      requiresValidation: this.requiresValidation(keywords)
    };
  }

  /**
   * 최적화된 설정 생성
   * @param {Object} analysis - 프롬프트 분석 결과
   * @param {Object} context - 프로젝트 컨텍스트
   * @returns {Object} 최적화된 설정
   */
  generateOptimizedConfig(analysis, context) {
    const config = {
      flags: [],
      personas: [],
      mcpServers: [],
      waveMode: false,
      validationLevel: 'standard'
    };

    // 자동 플래그 활성화
    Object.entries(this.optimizationRules.framework.autoFlags).forEach(([key, flags]) => {
      if (analysis.intent.includes(key)) {
        config.flags.push(...flags);
      }
    });

    // 자동 페르소나 선택
    Object.entries(this.optimizationRules.framework.autoPersonas).forEach(([key, persona]) => {
      if (analysis.domain.includes(key.toLowerCase())) {
        config.personas.push(persona);
      }
    });

    // MCP 서버 자동 선택
    Object.entries(this.optimizationRules.mcpSelection).forEach(([server, keywords]) => {
      if (keywords.some(keyword => analysis.domain.includes(keyword))) {
        config.mcpServers.push(server);
      }
    });

    // Wave 모드 활성화 조건
    if (analysis.complexity > 0.7 && analysis.operationType.length > 2) {
      config.waveMode = true;
      config.flags.push('--wave-mode', 'auto');
    }

    // 검증 레벨 설정
    if (analysis.requiresValidation) {
      config.validationLevel = 'strict';
      config.flags.push('--validate');
    }

    return config;
  }

  /**
   * 프롬프트 향상
   * @param {string} originalPrompt - 원본 프롬프트
   * @param {Object} config - 최적화 설정
   * @returns {string} 향상된 프롬프트
   */
  enhancePrompt(originalPrompt, config) {
    let enhancedPrompt = originalPrompt;

    // SuperClaude 프레임워크 설정 추가
    if (config.flags.length > 0) {
      enhancedPrompt += `\n\n설정: ${config.flags.join(' ')}`;
    }

    if (config.personas.length > 0) {
      enhancedPrompt += `\n페르소나: ${config.personas.map(p => `--persona-${p}`).join(' ')}`;
    }

    if (config.mcpServers.length > 0) {
      enhancedPrompt += `\nMCP 서버: ${config.mcpServers.join(', ')} 활용`;
    }

    // 품질 보증 요구사항 추가
    enhancedPrompt += '\n\n품질 요구사항:';
    enhancedPrompt += '\n- 모든 단계를 검증하고 사용자 확인 후 진행';
    enhancedPrompt += '\n- 최적화된 코드와 함께 재현 가능한 결과 제공';
    enhancedPrompt += '\n- 각 단계별 상태를 기록하고 추적';

    return enhancedPrompt;
  }

  /**
   * 의도 감지
   */
  detectIntent(keywords) {
    const intentMap = {
      'analyze': ['analyze', 'review', 'check', '분석'],
      'build': ['build', 'create', 'make', '만들기', '생성'],
      'implement': ['implement', 'develop', 'code', '구현'],
      'improve': ['improve', 'optimize', 'enhance', '개선', '최적화'],
      'debug': ['debug', 'fix', 'solve', '디버깅', '수정'],
      'test': ['test', 'verify', 'validate', '테스트', '검증']
    };

    const detected = [];
    Object.entries(intentMap).forEach(([intent, patterns]) => {
      if (patterns.some(pattern => keywords.includes(pattern))) {
        detected.push(intent);
      }
    });

    return detected;
  }

  /**
   * 복잡도 계산
   */
  calculateComplexity(prompt) {
    const factors = [
      prompt.length > 500 ? 0.2 : 0,
      (prompt.match(/\band\b/gi) || []).length * 0.1,
      (prompt.match(/\bcomplex|\bsystem|\benterprise/gi) || []).length * 0.3,
      (prompt.match(/\bmultiple|\bseveral|\bmany/gi) || []).length * 0.2
    ];
    
    return Math.min(factors.reduce((a, b) => a + b, 0), 1.0);
  }

  /**
   * 도메인 감지
   */
  detectDomain(keywords) {
    const domains = {
      'frontend': ['ui', 'component', 'react', 'vue', 'css', 'html'],
      'backend': ['api', 'server', 'database', 'endpoint'],
      'security': ['security', 'auth', 'vulnerability', '보안'],
      'performance': ['performance', 'optimize', 'speed', '성능'],
      'testing': ['test', 'qa', 'validation', '테스트']
    };

    const detected = [];
    Object.entries(domains).forEach(([domain, patterns]) => {
      if (patterns.some(pattern => keywords.includes(pattern))) {
        detected.push(domain);
      }
    });

    return detected;
  }

  /**
   * 작업 유형 감지
   */
  detectOperationType(keywords) {
    const operations = ['create', 'modify', 'analyze', 'test', 'deploy', 'debug'];
    return operations.filter(op => keywords.includes(op));
  }

  /**
   * 검증 필요 여부 판단
   */
  requiresValidation(keywords) {
    const validationKeywords = ['production', 'deploy', 'security', 'critical', '프로덕션'];
    return validationKeywords.some(keyword => keywords.includes(keyword));
  }

  /**
   * 플래그 ID 생성
   */
  generateFlagId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const sequence = String(Math.floor(Math.random() * 999)).padStart(3, '0');
    
    return `FLAG-${dateStr}-${timeStr}-${sequence}`;
  }

  /**
   * 결과 로깅
   * @param {Object} optimizedResult - 최적화 결과
   */
  logResult(optimizedResult) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logData = {
      ...optimizedResult,
      projectRules: 'PROJECT_RULES.md 절대 준수',
      superClaudeIntegration: true,
      qualityAssurance: 'validated'
    };

    // 실제 파일 시스템에 로그 저장 (구현 예정)
    console.log(`로그 저장: ${timestamp}_optimization.json`);
    console.log(JSON.stringify(logData, null, 2));
    
    return logData;
  }
}

// 사용 예제
const optimizer = new PromptOptimizer();

// 기본 사용법
const result = optimizer.optimizePrompt(
  "YouTube API를 사용해서 수익화 시스템을 구현해주세요",
  { projectType: 'youtube-monetization' }
);

console.log('최적화 결과:', result);

module.exports = PromptOptimizer;