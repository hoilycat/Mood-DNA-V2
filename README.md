"# Mood-DNA-V2" 
🌙 Mood-DNA Ver 2.0

Design Intelligence for Designers
감각을 데이터로, 아이디어를 구조로.

🖋️ Introduction

Mood-DNA는 디자이너를 위한 AI 디자인 파트너입니다.
감성·기술·문맥을 통합적으로 분석하여
디자인 의사결정을 빠르고 정교하게 만들어주는 도구입니다.

디자인은 감각이지만,
그 감각을 언어화하고 구조화하는 역할을
Mood-DNA가 대신 수행합니다.

🎯 Core Features (브랜드 미리보기)
1. Target Insight

타겟을 선택하면, 그들의 시각적 취향과 특성을 기반으로
색감, 대비, 톤앤매너의 적합성을 분석해주는 “디자인 리서치 비서”.

“실버 세대 타겟인데 대비가 낮아요. 글씨 톤을 조금 더 올려보면 어떨까요?”

2. Media Technical Advisor

작업물이 어디에 쓰이는지에 따라
전문적인 실무 조언을 자동으로 제공합니다.

📚 출판/인쇄 — 용지 추천, 후가공 조합, CMYK 톤 안정화 팁

📱 웹/앱 — 접근성, 가독성, 다크모드 대응

🧢 굿즈 — 재질별 인쇄 안정화, 제작 단가 조절 팁

3. Smart Archiving

작업물을 저장하면
AI가 분위기・ 키워드・타겟을 자동 기록해서 데이터베이스화합니다.

“파스텔톤 · 몽환적인 감성 · 20대 여성 타겟의 에세이 표지 스타일”

나중에 비슷한 디자인을 만들 때
마치 내 과거 디자인 노트북을 다시 펼치는 기분을 줍니다.

🧩 Tech Stack
Frontend

React (Vite)

Tailwind CSS

Shadcn UI 기반 컴포넌트 커스터마이징

Backend

Python (FastAPI)

LLM API 연동 (Gemini 기반)

Etc

GitHub / Git branching workflow

Local + Cloud Sync 구조

🌿 Branch Strategy

깔끔하고 직관적인, 디자이너-친화 Git 구조

main                ← 배포 브랜치
└── develop         ← 프론트+백엔드 통합 개발
    ├── frontend    ← 프론트엔드 작업 묶음
    ├── backend     ← (필요 시) 백엔드 작업 묶음
    └── feature/*   ← 모든 실제 작업은 여기서 발생


작업 흐름

feature/* → frontend/backend → develop → main

📁 Project Structure (초기 버전)
Mood-DNA-V2/
│
├── frontend/           # 사용자 UI
│   └── src/
│
├── backend/            # API, 모델 호출 로직
│
└── README.md

🧭 Roadmap (초기 계획)

 로고 & 브랜드 에셋 제작

 기본 UI 레이아웃 구성

 Target Insight 기능 개발

 Media Advisor 모듈링

 Smart Archive DB 구축

 LLM 최적화 프롬프트 설계

 초기 베타 버전 빌드 & 테스트

✨ Philosophy

디자인은 감정의 언어입니다.
Mood-DNA는 그 언어를 데이터로 번역해주는 기술입니다.

디자인의 ‘감성’을 손상시키지 않으면서
AI의 ‘이성’을 더하는 도구.

🌌 Credits

Designed & Developed by 용용
감각적 사고 + 논리적 구조를 사랑하는 디자이너/메이커.