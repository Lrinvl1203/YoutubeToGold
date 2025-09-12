/**
 * Result Tracking and Storage System for YoutubeToGold Project
 * 실행 결과 추적, 성능 모니터링, 재현성 보장 시스템
 * 
 * @version 1.0.0
 * @flag FLAG-20250913-004
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ResultTracker {
  constructor(projectRoot = './') {
    this.projectRoot = path.resolve(projectRoot);
    this.logsDir = path.join(this.projectRoot, 'logs');
    this.resultsDir = path.join(this.logsDir, 'results');
    this.promptsDir = path.join(this.logsDir, 'prompts');
    this.performanceDir = path.join(this.logsDir, 'performance');
    
    this.currentSession = null;
    this.sessionMetrics = {};
    
    this.initializeDirectories();
  }

  /**
   * 디렉토리 초기화
   */
  async initializeDirectories() {
    const dirs = [
      this.resultsDir,
      this.promptsDir,
      this.performanceDir,
      path.join(this.resultsDir, 'daily'),
      path.join(this.promptsDir, 'optimized'),
      path.join(this.performanceDir, 'sessions')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`디렉토리 생성 실패: ${dir}`, error);
      }
    }
  }

  /**
   * 새로운 세션 시작
   * @param {Object} sessionInfo - 세션 정보
   * @returns {string} 세션 ID
   */
  async startSession(sessionInfo = {}) {
    const timestamp = new Date().toISOString();
    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      id: sessionId,
      startTime: timestamp,
      info: {
        userAgent: process.env.USER_AGENT || 'Claude Code',
        nodeVersion: process.version,
        platform: process.platform,
        projectRoot: this.projectRoot,
        ...sessionInfo
      },
      operations: [],
      metrics: {
        operationCount: 0,
        totalExecutionTime: 0,
        averageResponseTime: 0,
        successRate: 0,
        errors: []
      }
    };

    this.sessionMetrics = {};
    
    console.log(`🚀 세션 시작: ${sessionId}`);
    return sessionId;
  }

  /**
   * 프롬프트 및 결과 추적
   * @param {Object} promptData - 프롬프트 정보
   * @param {Object} result - 실행 결과
   * @returns {Object} 추적 정보
   */
  async trackPromptResult(promptData, result) {
    const timestamp = new Date().toISOString();
    const operationId = this.generateOperationId();
    
    const trackingData = {
      id: operationId,
      sessionId: this.currentSession?.id,
      timestamp,
      prompt: {
        original: promptData.original,
        optimized: promptData.optimized,
        flags: promptData.flags || [],
        personas: promptData.personas || [],
        mcpServers: promptData.mcpServers || []
      },
      result: {
        success: result.success,
        output: result.output,
        errors: result.errors || [],
        warnings: result.warnings || [],
        executionTime: result.executionTime,
        tokensUsed: result.tokensUsed,
        performance: result.performance || {}
      },
      reproduction: {
        environment: await this.captureEnvironment(),
        dependencies: await this.captureDependencies(),
        configuration: result.configuration || {},
        reproductionHash: null // 계산 후 설정
      },
      quality: {
        codeQuality: result.quality?.codeQuality || 'unknown',
        testCoverage: result.quality?.testCoverage || 0,
        securityScore: result.quality?.securityScore || 'unknown',
        performanceScore: result.quality?.performanceScore || 'unknown'
      }
    };

    // 재현성 해시 생성
    trackingData.reproduction.reproductionHash = this.generateReproductionHash(trackingData);

    // 세션에 추가
    if (this.currentSession) {
      this.currentSession.operations.push(trackingData);
      this.updateSessionMetrics(trackingData);
    }

    // 저장
    await this.saveTrackingData(trackingData);
    
    console.log(`📊 결과 추적 완료: ${operationId}`);
    return trackingData;
  }

  /**
   * 환경 정보 캡처
   * @returns {Object} 환경 정보
   */
  async captureEnvironment() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
      environmentVariables: this.getRelevantEnvVars()
    };
  }

  /**
   * 의존성 정보 캡처
   * @returns {Object} 의존성 정보
   */
  async captureDependencies() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      return {
        dependencies: packageData.dependencies || {},
        devDependencies: packageData.devDependencies || {},
        engines: packageData.engines || {},
        scripts: packageData.scripts || {}
      };
    } catch (error) {
      console.log('package.json 정보 캡처 실패 (무시)');
      return {};
    }
  }

  /**
   * 관련 환경 변수 필터링
   * @returns {Object} 필터링된 환경 변수
   */
  getRelevantEnvVars() {
    const relevantKeys = [
      'NODE_ENV',
      'DEBUG',
      'CLAUDE_CODE_VERSION',
      'USER_AGENT',
      'TERM'
    ];
    
    const filtered = {};
    relevantKeys.forEach(key => {
      if (process.env[key]) {
        filtered[key] = process.env[key];
      }
    });
    
    return filtered;
  }

  /**
   * 재현성 해시 생성
   * @param {Object} trackingData - 추적 데이터
   * @returns {string} 재현성 해시
   */
  generateReproductionHash(trackingData) {
    const reproductionData = {
      prompt: trackingData.prompt.optimized,
      flags: trackingData.prompt.flags.sort(),
      personas: trackingData.prompt.personas.sort(),
      mcpServers: trackingData.prompt.mcpServers.sort(),
      environment: {
        nodeVersion: trackingData.reproduction.environment.nodeVersion,
        platform: trackingData.reproduction.environment.platform
      },
      dependencies: trackingData.reproduction.dependencies
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(reproductionData))
      .digest('hex');
  }

  /**
   * 세션 메트릭 업데이트
   * @param {Object} operation - 작업 정보
   */
  updateSessionMetrics(operation) {
    const metrics = this.currentSession.metrics;
    
    metrics.operationCount++;
    metrics.totalExecutionTime += operation.result.executionTime || 0;
    metrics.averageResponseTime = metrics.totalExecutionTime / metrics.operationCount;
    
    const successCount = this.currentSession.operations.filter(op => op.result.success).length;
    metrics.successRate = (successCount / metrics.operationCount) * 100;
    
    if (!operation.result.success && operation.result.errors.length > 0) {
      metrics.errors.push(...operation.result.errors);
    }
  }

  /**
   * 추적 데이터 저장
   * @param {Object} trackingData - 저장할 데이터
   */
  async saveTrackingData(trackingData) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // 개별 결과 저장
      const resultFile = path.join(
        this.resultsDir, 
        'daily', 
        `${dateStr}_${trackingData.id}.json`
      );
      
      await fs.writeFile(
        resultFile,
        JSON.stringify(trackingData, null, 2),
        'utf8'
      );

      // 최적화된 프롬프트 저장
      const promptFile = path.join(
        this.promptsDir,
        'optimized',
        `${timestamp}_${trackingData.id}.md`
      );
      
      const promptDoc = this.generatePromptDocument(trackingData);
      await fs.writeFile(promptFile, promptDoc, 'utf8');
      
    } catch (error) {
      console.error('추적 데이터 저장 실패:', error);
    }
  }

  /**
   * 프롬프트 문서 생성
   * @param {Object} trackingData - 추적 데이터
   * @returns {string} 마크다운 문서
   */
  generatePromptDocument(trackingData) {
    const { prompt, result, reproduction, quality } = trackingData;
    
    return `# 프롬프트 실행 기록: ${trackingData.id}

## 기본 정보
- **실행 시각**: ${trackingData.timestamp}
- **세션 ID**: ${trackingData.sessionId}
- **성공 여부**: ${result.success ? '✅ 성공' : '❌ 실패'}
- **실행 시간**: ${result.executionTime}ms
- **토큰 사용**: ${result.tokensUsed}

## 원본 프롬프트
\`\`\`
${prompt.original}
\`\`\`

## 최적화된 프롬프트
\`\`\`
${prompt.optimized}
\`\`\`

## SuperClaude 설정
- **플래그**: ${prompt.flags.join(', ') || '없음'}
- **페르소나**: ${prompt.personas.join(', ') || '없음'}
- **MCP 서버**: ${prompt.mcpServers.join(', ') || '없음'}

## 실행 결과
${result.success ? '### 성공적으로 완료됨' : '### 실행 실패'}

${result.output ? `#### 출력\n\`\`\`\n${result.output}\n\`\`\`` : ''}

${result.errors.length > 0 ? `#### 오류\n${result.errors.map(err => `- ${err}`).join('\n')}` : ''}

${result.warnings.length > 0 ? `#### 경고\n${result.warnings.map(warn => `- ${warn}`).join('\n')}` : ''}

## 품질 지표
- **코드 품질**: ${quality.codeQuality}
- **테스트 커버리지**: ${quality.testCoverage}%
- **보안 점수**: ${quality.securityScore}
- **성능 점수**: ${quality.performanceScore}

## 재현성 정보
- **재현 해시**: \`${reproduction.reproductionHash}\`
- **Node.js 버전**: ${reproduction.environment.nodeVersion}
- **플랫폼**: ${reproduction.environment.platform}

### 재현 명령어
\`\`\`javascript
// 동일한 결과를 얻기 위한 설정
const promptData = {
  original: "${prompt.original}",
  flags: [${prompt.flags.map(f => `"${f}"`).join(', ')}],
  personas: [${prompt.personas.map(p => `"${p}"`).join(', ')}],
  mcpServers: [${prompt.mcpServers.map(s => `"${s}"`).join(', ')}]
};
\`\`\`

---
**생성**: ${new Date().toISOString()}
**추적 시스템**: ResultTracker v1.0.0
`;
  }

  /**
   * 세션 종료 및 요약 생성
   * @returns {Object} 세션 요약
   */
  async endSession() {
    if (!this.currentSession) {
      console.log('활성 세션 없음');
      return null;
    }

    const endTime = new Date().toISOString();
    const sessionDuration = new Date(endTime) - new Date(this.currentSession.startTime);
    
    const sessionSummary = {
      ...this.currentSession,
      endTime,
      duration: sessionDuration,
      summary: this.generateSessionSummary()
    };

    // 세션 저장
    await this.saveSessionSummary(sessionSummary);
    
    console.log(`📋 세션 종료: ${this.currentSession.id}`);
    console.log(`📊 총 작업 수: ${sessionSummary.metrics.operationCount}`);
    console.log(`⏱️ 평균 응답 시간: ${sessionSummary.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`✅ 성공률: ${sessionSummary.metrics.successRate.toFixed(1)}%`);
    
    this.currentSession = null;
    return sessionSummary;
  }

  /**
   * 세션 요약 생성
   * @returns {Object} 세션 요약 정보
   */
  generateSessionSummary() {
    const operations = this.currentSession.operations;
    
    const summary = {
      totalOperations: operations.length,
      successfulOperations: operations.filter(op => op.result.success).length,
      failedOperations: operations.filter(op => !op.result.success).length,
      averageExecutionTime: this.currentSession.metrics.averageResponseTime,
      totalTokensUsed: operations.reduce((sum, op) => sum + (op.result.tokensUsed || 0), 0),
      mostUsedFlags: this.getMostUsedItems(operations, 'prompt.flags'),
      mostUsedPersonas: this.getMostUsedItems(operations, 'prompt.personas'),
      mostUsedMcpServers: this.getMostUsedItems(operations, 'prompt.mcpServers'),
      qualityMetrics: this.calculateQualityMetrics(operations)
    };
    
    return summary;
  }

  /**
   * 가장 많이 사용된 항목 추출
   * @param {Array} operations - 작업 목록
   * @param {string} path - 객체 경로
   * @returns {Array} 사용 빈도별 정렬된 항목
   */
  getMostUsedItems(operations, path) {
    const counts = {};
    
    operations.forEach(op => {
      const items = this.getNestedValue(op, path) || [];
      items.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item, count]) => ({ item, count }));
  }

  /**
   * 품질 메트릭 계산
   * @param {Array} operations - 작업 목록
   * @returns {Object} 품질 메트릭
   */
  calculateQualityMetrics(operations) {
    const qualityData = operations
      .filter(op => op.quality)
      .map(op => op.quality);
    
    if (qualityData.length === 0) {
      return { averageTestCoverage: 0, qualityDistribution: {} };
    }
    
    const averageTestCoverage = qualityData
      .reduce((sum, q) => sum + (q.testCoverage || 0), 0) / qualityData.length;
    
    const qualityDistribution = {};
    qualityData.forEach(q => {
      const quality = q.codeQuality || 'unknown';
      qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
    });
    
    return { averageTestCoverage, qualityDistribution };
  }

  /**
   * 중첩 객체 값 추출
   * @param {Object} obj - 대상 객체
   * @param {string} path - 경로 (예: 'prompt.flags')
   * @returns {*} 추출된 값
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 세션 요약 저장
   * @param {Object} sessionSummary - 세션 요약 정보
   */
  async saveSessionSummary(sessionSummary) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(
      this.performanceDir,
      'sessions',
      `session_${timestamp}_${sessionSummary.id}.json`
    );
    
    try {
      await fs.writeFile(
        filePath,
        JSON.stringify(sessionSummary, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('세션 요약 저장 실패:', error);
    }
  }

  /**
   * 세션 ID 생성
   * @returns {string} 세션 ID
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
  }

  /**
   * 작업 ID 생성
   * @returns {string} 작업 ID
   */
  generateOperationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `op_${timestamp}_${random}`;
  }

  /**
   * 재현성 테스트
   * @param {string} reproductionHash - 재현 해시
   * @returns {Array} 동일한 해시를 가진 작업들
   */
  async findReproducibleResults(reproductionHash) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const dailyDir = path.join(this.resultsDir, 'daily');
    
    try {
      const files = await fs.readdir(dailyDir);
      const reproductibleResults = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(dailyDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          if (data.reproduction.reproductionHash === reproductionHash) {
            reproductibleResults.push(data);
          }
        }
      }
      
      return reproductibleResults;
    } catch (error) {
      console.error('재현성 테스트 실패:', error);
      return [];
    }
  }
}

module.exports = ResultTracker;

// 사용 예제
if (require.main === module) {
  async function example() {
    const tracker = new ResultTracker();
    
    // 세션 시작
    const sessionId = await tracker.startSession({
      user: 'Claude Code User',
      project: 'YoutubeToGold'
    });
    
    // 결과 추적 예제
    const promptData = {
      original: "YouTube API 수익화 시스템을 구현해주세요",
      optimized: "YouTube API 수익화 시스템을 구현해주세요\n\n설정: --wave-mode auto --validate\n페르소나: --persona-backend",
      flags: ['--wave-mode', 'auto', '--validate'],
      personas: ['backend'],
      mcpServers: ['Context7', 'Sequential']
    };
    
    const result = {
      success: true,
      output: "YouTube API 수익화 시스템 구현 완료",
      executionTime: 1250,
      tokensUsed: 3420,
      quality: {
        codeQuality: 'excellent',
        testCoverage: 85,
        securityScore: 'high',
        performanceScore: 'good'
      }
    };
    
    await tracker.trackPromptResult(promptData, result);
    
    // 세션 종료
    const summary = await tracker.endSession();
    console.log('세션 요약:', summary.summary);
  }
  
  example().catch(console.error);
}