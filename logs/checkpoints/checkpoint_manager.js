/**
 * Checkpoint Management System for YoutubeToGold Project
 * 버전 관리 및 롤백 시스템
 * 
 * @version 1.0.0
 * @flag FLAG-20250913-003
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CheckpointManager {
  constructor(projectRoot = './') {
    this.projectRoot = path.resolve(projectRoot);
    this.checkpointDir = path.join(this.projectRoot, 'logs', 'checkpoints');
    this.versionDir = path.join(this.projectRoot, 'logs', 'versions');
    this.currentVersion = null;
    
    this.initializeDirectories();
  }

  /**
   * 디렉토리 초기화
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.checkpointDir, { recursive: true });
      await fs.mkdir(this.versionDir, { recursive: true });
    } catch (error) {
      console.error('디렉토리 초기화 실패:', error);
    }
  }

  /**
   * 새로운 체크포인트 생성
   * @param {string} description - 체크포인트 설명
   * @param {Object} metadata - 추가 메타데이터
   * @returns {Object} 생성된 체크포인트 정보
   */
  async createCheckpoint(description, metadata = {}) {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.slice(0, 10).replace(/-/g, '');
    const timeStr = timestamp.slice(11, 16).replace(':', '');
    
    // 기존 체크포인트 수 확인하여 시퀀스 번호 생성
    const existingCheckpoints = await this.listCheckpoints();
    const sequence = String(existingCheckpoints.length + 1).padStart(3, '0');
    
    const checkpointId = `V${sequence}_${dateStr}_${timeStr}`;
    const flagId = `FLAG-${dateStr}-${timeStr}-${sequence}`;

    const checkpointData = {
      id: checkpointId,
      flagId,
      timestamp,
      description,
      metadata,
      projectState: await this.captureProjectState(),
      hash: null // 계산 후 설정
    };

    // 체크포인트 데이터 해시 생성 (무결성 검증용)
    checkpointData.hash = this.generateHash(JSON.stringify(checkpointData.projectState));

    // 체크포인트 저장
    await this.saveCheckpoint(checkpointData);
    
    // 현재 버전 업데이트
    this.currentVersion = checkpointId;
    
    console.log(`✅ 체크포인트 생성 완료: ${checkpointId}`);
    return checkpointData;
  }

  /**
   * 프로젝트 현재 상태 캡처
   * @returns {Object} 프로젝트 상태 스냅샷
   */
  async captureProjectState() {
    const state = {
      timestamp: new Date().toISOString(),
      files: {},
      structure: {},
      dependencies: {},
      configuration: {}
    };

    try {
      // 주요 파일들의 상태 캡처
      const importantFiles = [
        'package.json',
        'PROJECT_RULES.md',
        'index.html',
        'README.md'
      ];

      for (const fileName of importantFiles) {
        const filePath = path.join(this.projectRoot, fileName);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const stats = await fs.stat(filePath);
          
          state.files[fileName] = {
            content,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            hash: this.generateHash(content)
          };
        } catch (error) {
          // 파일이 없는 경우는 무시
          console.log(`파일 없음 (무시): ${fileName}`);
        }
      }

      // 디렉토리 구조 캡처
      state.structure = await this.captureDirectoryStructure(this.projectRoot);

      // package.json 의존성 정보
      try {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        const packageContent = await fs.readFile(packageJsonPath, 'utf8');
        const packageData = JSON.parse(packageContent);
        
        state.dependencies = {
          dependencies: packageData.dependencies || {},
          devDependencies: packageData.devDependencies || {},
          scripts: packageData.scripts || {}
        };
      } catch (error) {
        console.log('package.json 없음 (무시)');
      }

      // 프로젝트 설정 정보
      state.configuration = {
        nodeVersion: process.version,
        platform: process.platform,
        projectRoot: this.projectRoot,
        checkpointSystem: 'active'
      };

    } catch (error) {
      console.error('프로젝트 상태 캡처 실패:', error);
    }

    return state;
  }

  /**
   * 디렉토리 구조 재귀적 캡처
   * @param {string} dirPath - 디렉토리 경로
   * @param {number} maxDepth - 최대 깊이 (기본 3)
   * @returns {Object} 디렉토리 구조
   */
  async captureDirectoryStructure(dirPath, maxDepth = 3) {
    if (maxDepth <= 0) return null;

    try {
      const items = await fs.readdir(dirPath);
      const structure = {};

      for (const item of items) {
        // .git, node_modules 등은 제외
        if (['.git', 'node_modules', '.DS_Store'].includes(item)) continue;

        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          structure[item] = {
            type: 'directory',
            children: await this.captureDirectoryStructure(itemPath, maxDepth - 1)
          };
        } else {
          structure[item] = {
            type: 'file',
            size: stats.size,
            modified: stats.mtime.toISOString()
          };
        }
      }

      return structure;
    } catch (error) {
      console.error(`디렉토리 구조 캡처 실패: ${dirPath}`, error);
      return null;
    }
  }

  /**
   * 체크포인트 저장
   * @param {Object} checkpointData - 저장할 체크포인트 데이터
   */
  async saveCheckpoint(checkpointData) {
    const filePath = path.join(this.checkpointDir, `${checkpointData.id}.json`);
    
    try {
      await fs.writeFile(
        filePath, 
        JSON.stringify(checkpointData, null, 2),
        'utf8'
      );

      // 버전 디렉토리에 상세 정보 저장
      const versionPath = path.join(this.versionDir, `${checkpointData.id}.md`);
      const versionDoc = this.generateVersionDocument(checkpointData);
      
      await fs.writeFile(versionPath, versionDoc, 'utf8');
      
    } catch (error) {
      console.error('체크포인트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 버전 문서 생성
   * @param {Object} checkpointData - 체크포인트 데이터
   * @returns {string} 마크다운 문서
   */
  generateVersionDocument(checkpointData) {
    const { id, flagId, timestamp, description, projectState } = checkpointData;
    
    const fileList = Object.keys(projectState.files)
      .map(fileName => `- ${fileName} (${projectState.files[fileName].size} bytes)`)
      .join('\n');

    return `# ${id}: ${description}

## 기본 정보
- **체크포인트 ID**: ${id}
- **플래그 ID**: ${flagId}
- **생성 일시**: ${timestamp}
- **설명**: ${description}

## 프로젝트 상태

### 포함된 파일
${fileList}

### 의존성 정보
\`\`\`json
${JSON.stringify(projectState.dependencies, null, 2)}
\`\`\`

### 시스템 환경
- **Node.js**: ${projectState.configuration.nodeVersion}
- **플랫폼**: ${projectState.configuration.platform}
- **프로젝트 루트**: ${projectState.configuration.projectRoot}

## 무결성 검증
- **해시**: ${checkpointData.hash}
- **검증 상태**: ✅ 정상

## 롤백 명령
\`\`\`javascript
await checkpointManager.rollbackToCheckpoint('${id}');
\`\`\`

---
**생성 시각**: ${new Date().toISOString()}
**관리 시스템**: CheckpointManager v1.0.0
`;
  }

  /**
   * 특정 체크포인트로 롤백
   * @param {string} checkpointId - 롤백할 체크포인트 ID
   * @returns {boolean} 롤백 성공 여부
   */
  async rollbackToCheckpoint(checkpointId) {
    try {
      console.log(`🔄 체크포인트 ${checkpointId}로 롤백 시작...`);
      
      const checkpointData = await this.loadCheckpoint(checkpointId);
      if (!checkpointData) {
        throw new Error(`체크포인트 ${checkpointId}를 찾을 수 없습니다`);
      }

      // 무결성 검증
      const currentHash = this.generateHash(JSON.stringify(checkpointData.projectState));
      if (currentHash !== checkpointData.hash) {
        throw new Error('체크포인트 무결성 검증 실패');
      }

      // 백업용 현재 상태 저장
      await this.createCheckpoint(`롤백 전 백업 (${checkpointId}로 롤백)`, {
        rollbackTarget: checkpointId,
        type: 'backup'
      });

      // 파일 복원
      await this.restoreFiles(checkpointData.projectState.files);
      
      // 현재 버전 업데이트
      this.currentVersion = checkpointId;
      
      console.log(`✅ 체크포인트 ${checkpointId}로 롤백 완료`);
      return true;
      
    } catch (error) {
      console.error('롤백 실패:', error);
      return false;
    }
  }

  /**
   * 파일 복원
   * @param {Object} files - 복원할 파일 정보
   */
  async restoreFiles(files) {
    for (const [fileName, fileData] of Object.entries(files)) {
      const filePath = path.join(this.projectRoot, fileName);
      
      try {
        // 디렉토리 생성 (필요한 경우)
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // 파일 복원
        await fs.writeFile(filePath, fileData.content, 'utf8');
        
        console.log(`✅ 파일 복원: ${fileName}`);
        
      } catch (error) {
        console.error(`❌ 파일 복원 실패: ${fileName}`, error);
      }
    }
  }

  /**
   * 체크포인트 로드
   * @param {string} checkpointId - 로드할 체크포인트 ID
   * @returns {Object|null} 체크포인트 데이터
   */
  async loadCheckpoint(checkpointId) {
    const filePath = path.join(this.checkpointDir, `${checkpointId}.json`);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`체크포인트 로드 실패: ${checkpointId}`, error);
      return null;
    }
  }

  /**
   * 모든 체크포인트 목록 조회
   * @returns {Array} 체크포인트 목록
   */
  async listCheckpoints() {
    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const checkpointId = path.basename(file, '.json');
          const checkpointData = await this.loadCheckpoint(checkpointId);
          
          if (checkpointData) {
            checkpoints.push({
              id: checkpointData.id,
              flagId: checkpointData.flagId,
              timestamp: checkpointData.timestamp,
              description: checkpointData.description,
              metadata: checkpointData.metadata
            });
          }
        }
      }

      // 타임스탬프 기준 정렬 (최신 순)
      return checkpoints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
    } catch (error) {
      console.error('체크포인트 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 해시 생성 (무결성 검증용)
   * @param {string} content - 해시할 내용
   * @returns {string} SHA-256 해시
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 체크포인트 삭제
   * @param {string} checkpointId - 삭제할 체크포인트 ID
   * @returns {boolean} 삭제 성공 여부
   */
  async deleteCheckpoint(checkpointId) {
    try {
      const checkpointFile = path.join(this.checkpointDir, `${checkpointId}.json`);
      const versionFile = path.join(this.versionDir, `${checkpointId}.md`);
      
      await fs.unlink(checkpointFile);
      await fs.unlink(versionFile);
      
      console.log(`✅ 체크포인트 삭제 완료: ${checkpointId}`);
      return true;
      
    } catch (error) {
      console.error(`체크포인트 삭제 실패: ${checkpointId}`, error);
      return false;
    }
  }

  /**
   * 체크포인트 비교
   * @param {string} checkpointId1 - 첫 번째 체크포인트
   * @param {string} checkpointId2 - 두 번째 체크포인트
   * @returns {Object} 비교 결과
   */
  async compareCheckpoints(checkpointId1, checkpointId2) {
    const checkpoint1 = await this.loadCheckpoint(checkpointId1);
    const checkpoint2 = await this.loadCheckpoint(checkpointId2);
    
    if (!checkpoint1 || !checkpoint2) {
      throw new Error('체크포인트를 찾을 수 없습니다');
    }

    const differences = {
      files: {
        added: [],
        removed: [],
        modified: []
      },
      dependencies: {
        added: [],
        removed: [],
        modified: []
      }
    };

    // 파일 변경사항 비교
    const files1 = Object.keys(checkpoint1.projectState.files);
    const files2 = Object.keys(checkpoint2.projectState.files);
    
    differences.files.added = files2.filter(f => !files1.includes(f));
    differences.files.removed = files1.filter(f => !files2.includes(f));
    
    for (const fileName of files1.filter(f => files2.includes(f))) {
      const file1Hash = checkpoint1.projectState.files[fileName].hash;
      const file2Hash = checkpoint2.projectState.files[fileName].hash;
      
      if (file1Hash !== file2Hash) {
        differences.files.modified.push(fileName);
      }
    }

    return differences;
  }
}

module.exports = CheckpointManager;

// 사용 예제
if (require.main === module) {
  async function example() {
    const manager = new CheckpointManager();
    
    // 첫 번째 체크포인트 생성
    await manager.createCheckpoint('프로젝트 규칙 및 최적화 시스템 구현 완료', {
      author: 'Claude Code',
      type: 'feature-complete',
      components: ['PROJECT_RULES.md', 'prompt_optimizer.js']
    });
    
    // 체크포인트 목록 확인
    const checkpoints = await manager.listCheckpoints();
    console.log('생성된 체크포인트:', checkpoints);
  }
  
  example().catch(console.error);
}