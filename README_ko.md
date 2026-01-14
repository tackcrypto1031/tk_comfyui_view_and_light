# tk_comfyui_view_and_light

**Language / 语言 / 言語 / 언어:** [English](README.md) | [中文](README_zh.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

3D 카메라 각도 제어를 위한 ComfyUI 커스텀 노드입니다. 인터랙티브한 Three.js 뷰포트를 제공하여 카메라 각도를 조정하고 다중 각도 이미지 생성을 위한 포맷된 프롬프트 문자열을 출력합니다.
![img.png](img.png)
## 기능

- **인터랙티브 3D 카메라 제어** - Three.js 뷰포트에서 핸들을 드래그하여 조정:
  - 수평 각도 (방위각): 0° - 360°
  - 수직 각도 (앙각): -30° ~ 60°
  - 줌 레벨: 0 - 10
- **빠른 선택 드롭다운** - 프리셋 카메라 각도를 빠르게 선택하기 위한 3개의 드롭다운 메뉴:
  - 방위각: 정면, 쿼터 뷰, 측면, 후면
  - 앙각: 로우 앵글, 아이 레벨, 하이 앵글, 부감
  - 거리: 와이드 샷, 미디엄 샷, 클로즈업
- **실시간 미리보기** - 이미지 입력을 연결하면 올바른 색상 렌더링으로 3D 장면에 카드로 표시
- **카메라 뷰 모드** - `camera_view`를 전환하여 카메라 인디케이터의 시점에서 장면 미리보기, 인터랙티브 오빗 제어 지원 (드래그로 회전, 스크롤로 줌)
- **프롬프트 출력** - [Qwen-Image-Edit-2511-Multiple-Angles-LoRA](https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA)와 호환되는 포맷된 프롬프트 출력
- **양방향 동기화** - 슬라이더 위젯, 3D 핸들 및 드롭다운이 동기화 유지
- **다국어 지원** - UI 라벨은 영어, 중국어, 일본어 및 한국어로 제공 (ComfyUI 설정에서 자동 감지)

## 설치

1. ComfyUI 커스텀 노드 폴더로 이동:
   ```bash
   cd ComfyUI/custom_nodes
   ```

2. 이 저장소를 클론:
   ```bash
   git clone https://github.com/jtydhr88/ComfyUI-qwenmultiangle.git
   ```

3. ComfyUI 재시작

4. https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA/tree/main 에서 LoRA를 다운로드하여 lora 폴더에 저장

## 개발

이 프로젝트는 프론트엔드 빌드에 TypeScript와 Vite를 사용합니다. 3D 뷰포트는 Three.js로 구축되었습니다.

### 사전 요구 사항

- Node.js 18+
- npm

### 빌드

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 감시 모드로 빌드 (개발용)
npm run dev

# 타입 체크
npm run typecheck
```

### 프로젝트 구조

```
ComfyUI-qwenmultiangle/
├── src/
│   ├── main.ts           # 익스텐션 진입점
│   ├── CameraWidget.ts   # Three.js 카메라 제어 위젯
│   ├── i18n.ts           # 국제화 (en/zh/ja/ko)
│   ├── styles.ts         # CSS 스타일
│   └── types.ts          # TypeScript 타입 정의
├── js/                   # 빌드 출력 (배포용으로 커밋됨)
│   └── main.js
├── nodes.py              # ComfyUI 노드 정의
├── __init__.py           # Python 모듈 초기화
├── package.json
├── tsconfig.json
└── vite.config.mts
```

## 사용 방법

1. `image/multiangle` 카테고리에서 **Qwen Multiangle Camera** 노드 추가
2. 선택 사항: 3D 장면에서 미리보기 하려면 IMAGE 입력 연결
3. 다음 방법으로 카메라 각도 조정:
   - 3D 뷰포트에서 색상 핸들 드래그
   - 슬라이더 위젯 사용
   - 드롭다운 메뉴에서 프리셋 값 선택
4. `camera_view`를 전환하여 카메라 시점에서 미리보기 확인
5. 노드는 카메라 각도를 설명하는 프롬프트 문자열 출력

### 위젯

| 위젯 | 타입 | 설명 |
|------|------|------|
| horizontal_angle | 슬라이더 | 카메라 방위각 (0° - 360°) |
| vertical_angle | 슬라이더 | 카메라 앙각 (-30° ~ 60°) |
| zoom | 슬라이더 | 카메라 거리/줌 레벨 (0 - 10) |
| default_prompts | 체크박스 | **사용 중단** - 이전 버전 호환성을 위해서만 유지, 효과 없음 |
| camera_view | 체크박스 | 카메라 시점에서 장면 미리보기 |

### 3D 뷰포트 제어

| 핸들 | 색상 | 제어 |
|------|------|------|
| 링 핸들 | 핑크 | 수평 각도 (방위각) |
| 아크 핸들 | 시안 | 수직 각도 (앙각) |
| 라인 핸들 | 골드 | 줌/거리 |

이미지 미리보기는 카드로 표시됩니다 - 정면은 이미지를 표시하고, 뒷면에서 보면 그리드 패턴이 표시됩니다.

### 카메라 뷰 모드 제어

`camera_view`가 활성화되면 마우스로 카메라를 인터랙티브하게 제어할 수 있습니다:

| 동작 | 제어 |
|------|------|
| 좌우 드래그 | 수평 회전 (방위각) |
| 상하 드래그 | 수직 회전 (앙각) |
| 위로 스크롤 | 줌 인 (거리 증가) |
| 아래로 스크롤 | 줌 아웃 (거리 감소) |

모든 인터랙션은 슬라이더와 동일한 제한을 따릅니다:
- 방위각: 0° - 360° (순환)
- 앙각: -30° ~ 60°
- 거리: 0 - 10

오빗 제어를 통한 변경 사항은 슬라이더 위젯과 자동으로 동기화됩니다.

### 빠른 선택 드롭다운

3D 뷰포트에는 프리셋 카메라 각도를 빠르게 선택하기 위한 3개의 드롭다운 메뉴가 있습니다:

| 드롭다운 | 옵션 |
|----------|------|
| 수평 (H) | 정면, 우측 전방, 우측면, 우측 후방, 후면, 좌측 후방, 좌측면, 좌측 전방 |
| 수직 (V) | 로우 앵글, 아이 레벨, 하이 앵글, 부감 |
| 거리 (Z) | 와이드 샷, 미디엄 샷, 클로즈업 |

프리셋을 선택하면 3D 핸들과 슬라이더 위젯이 자동으로 업데이트됩니다.

### 국제화

UI 라벨은 ComfyUI 언어 설정에 따라 자동으로 번역됩니다:

| 언어 | 코드 |
|------|------|
| 영어 | en |
| 중국어 (간체) | zh |
| 일본어 | ja |
| 한국어 | ko |

UI 언어에 관계없이 출력 프롬프트는 항상 영어입니다.

### 출력 프롬프트 형식

노드는 [Qwen-Image-Edit-2511-Multiple-Angles-LoRA](https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA)가 요구하는 형식으로 프롬프트를 출력합니다:

```
<sks> {방위각} {앙각} {거리}
```

예시:
- `<sks> front view eye-level shot medium shot`
- `<sks> right side view high-angle shot close-up`
- `<sks> back-left quarter view low-angle shot wide shot`

#### 지원되는 값

| 파라미터 | 값 |
|----------|-----|
| 방위각 | `front view`, `front-right quarter view`, `right side view`, `back-right quarter view`, `back view`, `back-left quarter view`, `left side view`, `front-left quarter view` |
| 앙각 | `low-angle shot` (-30°), `eye-level shot` (0°), `elevated shot` (30°), `high-angle shot` (60°) |
| 거리 | `close-up`, `medium shot`, `wide shot` |

## 크레딧

### 원본 구현

이 ComfyUI 노드는 독립형 카메라 각도 제어 웹 애플리케이션인 [qwenmultiangle](https://github.com/amrrs/qwenmultiangle)을 기반으로 합니다.

원본 프로젝트는 다음에서 영감을 받았습니다:
- Hugging Face Spaces의 [multimodalart/qwen-image-multiple-angles-3d-camera](https://huggingface.co/spaces/multimodalart/qwen-image-multiple-angles-3d-camera)
- [fal.ai - Qwen Image Edit 2511 Multiple Angles](https://fal.ai/models/fal-ai/qwen-image-edit-2511-multiple-angles/)

## 관련 프로젝트

- [ComfyUI-qwenmultiangle-plus](https://github.com/cjlang2020/ComfyUI-qwenmultiangle-plus) - 이 프로젝트를 기반으로 한 또 다른 수정 버전

## 라이선스

MIT
