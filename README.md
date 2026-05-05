# 🌙 Mood-DNA Ver 2.0
 
![version](https://img.shields.io/badge/version-2.0-3b82f6?style=flat-square)
![status](https://img.shields.io/badge/status-developing-2563eb?style=flat-square)
 
> **"Design Intelligence for Designers"**
> 감각을 데이터로, 아이디어를 구조로.
> 디자인 이미지를 분석해 시각적 요소를 수치화하고, 지식 그래프 기반 AI로 디자인 결정을 논리적 근거와 함께 제시하는 **디자이너의 감각을 논리로 증명하는 AI 시스템**입니다.
 
![React](https://img.shields.io/badge/React-3b82f6?style=flat-square&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-2563eb?style=flat-square&logo=fastapi&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-1d4ed8?style=flat-square&logo=neo4j&logoColor=60a5fa)
![Python](https://img.shields.io/badge/Python-2563eb?style=flat-square&logo=python&logoColor=white)
![LlamaIndex](https://img.shields.io/badge/LlamaIndex-3b82f6?style=flat-square&logo=chainlink&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-1d4ed8?style=flat-square&logo=google&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-2563eb?style=flat-square&logo=opencv&logoColor=white)

<div align="center">
  <img src="./assets/mood_dna_demo.webp" alt="Mood-DNA Demo" width="800" style="border-radius: 10px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"/>
</div>

---
 
## 🖋️ Introduction
 
디자인 이미지를 분석해 시각적 요소를 수치화하고,
지식 그래프 기반 AI로 디자인 결정을 논리적 근거와 함께 제시하는 **AI 디자인 분석 도구**입니다.
 
단순한 이미지 분석을 넘어, 감각적 판단을 **수치 데이터와 디자인 이론**으로 번역해
디자이너의 설득력을 높여줍니다.
 
---
 
## ✨ Philosophy
 
> "디자인의 '감성'을 손상시키지 않으면서 AI의 '이성'을 더하다."
 
Mood-DNA는 기술이 디자인을 대체하는 것이 아니라, 디자이너가 자신의 직관을 논리적으로 증명하고 더 높은 차원의 창의성에 집중할 수 있도록 돕는 도구입니다.
 
---

## 📸 Screenshots

<div align="center">
  <img src="./assets/screenshot_1.png" alt="Mood-DNA Setup" width="32%" style="border-radius: 8px;"/>
  <img src="./assets/screenshot_2.png" alt="Analysis Process" width="32%" style="border-radius: 8px;"/>
  <img src="./assets/screenshot_3.png" alt="Dashboard Results" width="32%" style="border-radius: 8px;"/>
</div>

---

## 🎯 Core Features

> ✅ 현재 구현 완료된 기능입니다.
 
### 🔍 1. Design Scanning Engine
OpenCV와 EasyOCR 기반의 이미지 시각 구조 분석 엔진입니다.
*   **Visual Metrics**
      밝기, 대비, 복잡도, Saliency, 대칭성, 여백 비율, 구도 안정성
*   **Form & Texture**
      곡률(Roundness), 직선성(Straightness), 매끄러움(Smoothness) 분석을 통한 형태적 특징 추출.
*   **Color DNA**
       K-Means 알고리즘 기반 주요 컬러 팔레트 및 색채 조화도 산출.


### 🏆 2. Design Decision Engine(Batch Analysis)
여러 디자인 시안을 비교하여 최적의 결과를 선택하는 의사결정 시스템입니다.
*   **DNA Matching**
      설정한 Target DNA와 실제 데이터 사이의 유사도를 계산하여 순위 산정.
*   **Master's Report**
      AI가 오디션 심사위원처럼 각 시안의 장단점을 비교 분석하여 마스터 리포트를 생성합니다.


### 🖼️ 3. Style Benchmarking
AI 피드백과 연동된 실무 레퍼런스 제안.
*   **SerpApi Integration**
      분석 결과와 매칭되는 최적의 디자인 레퍼런스를 Pinterest, Dribbble, Behance 등에서 실시간으로 수집.
*   **Context Matching**
      분석 결과와 유사한 디자인 스타일 큐레이션
---


## 🧠 In Development
 
> 현재 개발 중인 기능입니다. (논문 수집 및 지식 그래프 구축 진행 중)
 
### 🧠 Hybrid GraphRAG Critique ![WIP](https://img.shields.io/badge/status-WIP-blue?style=flat-square)
 
기존에는 하드코딩된 수치 기준으로 디자인을 평가했다면,
이제는 **왜 그 수치인지**를 디자인 이론으로 설명해줍니다.
 
- **Knowledge Graph:** 디자인 원칙과 스타일 간의 관계망을 구축해 수치의 근거를 추적
- **Agentic AI:** DB에 없는 정보는 논문·웹 검색으로 실시간 보완
- **확장 가능한 구조:** 어떤 앱에서도 재사용 가능한 에이전트 설계

>#### 📌 Example Output (Simulated)
> **Input:** Brightness = 0.72, Contrast = 0.41
>
> **AI Analysis:**
> *    높은 밝기는 시각적 주목도를 증가시킴
> *    대비가 낮아 정보 계층 구조가 약화될 가능성 있음
> *    Gestalt 이론에 따르면 figure-ground separation이 약화될 수 있음
> **Reference:**
> *    Ware, C. (2013). Information Visualization: Perception for Design
> *    Tufte, E. (1990). Envisioning Information


---


 
## ⚙️ System Architecture
 
```mermaid
graph TD
 
A[User Image Upload] --> B[Frontend UI<br/>React Dashboard]
B --> C[FastAPI Backend]
C --> D[Image Analyzer<br/>OpenCV / OCR]
C --> E[Feature Extraction<br/>Color / Layout / Texture]
D --> E
E --> F[Metrics Engine<br/>디자인 수치화]
F --> G[Knowledge Graph<br/>Neo4j]
F --> H[Vector DB<br/>디자인 사례]
G --> I[GraphRAG Engine]
H --> I
I --> J[AI Critique<br/>Gemini / LLM]
J --> K[Result Output<br/>DNA Score + 피드백]
 
style A fill:#1d4ed8,color:#fff
style B fill:#2563eb,color:#fff
style C fill:#2563eb,color:#fff
style D fill:#3b82f6,color:#fff
style E fill:#3b82f6,color:#fff
style F fill:#60a5fa,color:#fff
style G fill:#93c5fd,color:#1d4ed8
style H fill:#93c5fd,color:#1d4ed8
style I fill:#bfdbfe,color:#1d4ed8
style J fill:#dbeafe,color:#1d4ed8
style K fill:#eff6ff,color:#1d4ed8
```
 
---


 
## 🧩 Tech Stack
 
### Frontend
*   **Framework:** React (Vite), TypeScript
*   **Styling:** Tailwind CSS, Shadcn UI
*   **Data Viz:** Recharts (Radar Chart 기반 DNA 시각화)
### Backend
*   **Framework:** Python (FastAPI)
*   **Analysis:** OpenCV, NumPy, EasyOCR, Rembg
*   **Database:** SQLAlchemy (SQLite), **Neo4j (Knowledge Graph)**
*   **RAG Framework:** **LlamaIndex (Graph Store & Vector Store)**
### AI Models
*   **Main Engine:** Google Gemini 1.5 Pro / Flash
*   **Backup/Local:** Groq (Llama 3.3), Ollama (Exaone 3.5, llama3.2-vision)
---


 
## 📁 Project Structure
 
```bash
Mood-DNA-V2/
├── frontend/             # React + Vite 기반의 시각 분석 UI
│   └── src/              # DNA 대시보드 및 위저드 컴포넌트
├── backend/              # FastAPI 기반 고성능 분석 엔진
│   └── app/
│       ├── services/     # 핵심 로직 (Analyzer, GraphRAG, AI Consultant)
│       └── models.py     # 디자인 히스토리 DB 스키마
└── design_wisdom/        # GraphRAG 구축을 위한 디자인 지식 소스 (.txt, .pdf)
```
 
---


 
## 🧭 Roadmap
 
- [x] 이미지 수치 분석 엔진 구축 (OpenCV)
- [x] 실시간 디자인 DNA 시각화 (Radar Chart)
- [x] Design Audition 배치 분석 구현
- [x] Style Benchmarking (SerpApi 연동)
- [ ] LlamaIndex 기반 Hybrid GraphRAG 시스템 통합 👈 Current Focus
- [ ] 디자인 온톨로지(Design Ontology) 엔티티 확장 및 검증
- [ ] Target Insight 기반 업종별 특화 조언 모듈 고도화
- [ ] 디자인 히스토리 스마트 아카이빙 기능
---


## 🌌 Credits
Designed & Developed by 용용
 
감각적 사고 + 논리적 구조를 사랑하는 디자이너/메이커.
