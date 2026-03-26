import { useState, useEffect, type ChangeEvent } from 'react';
import axios from 'axios';
import { 
  ImageIcon, Loader2, Sparkles, Activity, Grid, Palette, 
  Sun, Moon, Zap, Maximize, ExternalLink, Scale, 
  Target, Briefcase 
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RechartsRadar 
} from 'recharts';

// --- 1. 컴포넌트 정의 ---
const StatCard = ({ label, value, max = 100, color, icon: Icon }: any) => (
  <div className="bg-card rounded-2xl border border-border p-4 flex flex-col justify-between shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
        <Icon size={14}/> {label}
      </span>
      <span className="text-xl font-bold font-mono">{value.toFixed(0)}</span>
    </div>
    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full rounded-full transition-all duration-1000`} 
        style={{ width: `${(value / max) * 100}%` }}
      ></div>
    </div>
  </div>
);

const CompetencyCard = ({ title, desc, icon: Icon }: any) => (
  <div className="p-4 bg-secondary/20 rounded-2xl border border-border/50">
    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-[10px] uppercase tracking-tighter">
      <Icon size={14}/> {title}
    </div>
    <p className="text-[13px] opacity-80 leading-snug break-keep">{desc}</p>
  </div>
);

// --- 2. 데이터 구조 및 데이터베이스 ---
interface MoodDnaResult {
  brightness: number; complexity: number; saliency: number; symmetry: number; space: number;
  contrast: number; composition: number; aspect_ratio: number; color_count: number;
  typo_score: number; harmony_score: number;
  colors: string[]; category: string; mood: string; advice: string; benchmarking_point: string;
  design_keywords: string[]; suggested_palette: string[]; reference_images: string[];
  total_score: number; 
  evaluation: {
    brightness: string; complexity: string; typography: string; 
    composition: string; color_harmony: string;
  };
  competency: {
    identity: string;
    quality: string;
    fidelity: string;
  };
  action_checklist: string[];
  //경제성 분석 데이터 정의!
  market_analysis?: {
    estimated_days: number;
    estimated_value: number;
  };
}

const industries = [
  "IT / 테크 스타트업", 
  "카페 / 베이커리", 
  "의료 / 제약", 
  "하이엔드 패션 / 명품", 
  "영화 / 엔터테인먼트", 
  "박물관 / 예술 전시",    
  "기타 (직접 입력)"
];


// 단어별 표준 DNA 정의
const VIBE_KEYWORDS = {
  '#따뜻한': { brightness: 80, complexity: 30, saliency: 40, symmetry: 50, space: 75 },
  '#차가운': { brightness: 30, complexity: 40, saliency: 60, symmetry: 80, space: 50 },
  '#힙한': { brightness: 40, complexity: 85, saliency: 90, symmetry: 30, space: 25 },
  '#깔끔한': { brightness: 70, complexity: 15, saliency: 30, symmetry: 90, space: 90 },
  '#화려한': { brightness: 60, complexity: 95, saliency: 85, symmetry: 50, space: 20 },
  '#절제된': { brightness: 50, complexity: 10, saliency: 20, symmetry: 95, space: 95 },
  '#강렬한': { brightness: 45, complexity: 75, saliency: 95, symmetry: 40, space: 30 },
  '#친근한': { brightness: 85, complexity: 40, saliency: 45, symmetry: 55, space: 60 },
  '#미래적인': { brightness: 50, complexity: 70, saliency: 80, symmetry: 60, space: 40 },
  '#고전적인': { brightness: 40, complexity: 60, saliency: 50, symmetry: 85, space: 55 },
};


// App.tsx 상단 (VIBE_KEYWORDS 아래에 배치)
const blendDNA = (baseDNA: any, selectedTags: string[]) => {
  if (selectedTags.length === 0) return baseDNA;

  const vibeSum = selectedTags.reduce((acc, tag) => {
    const v = VIBE_KEYWORDS[tag as keyof typeof VIBE_KEYWORDS];
    return {
      brightness: acc.brightness + v.brightness,
      complexity: acc.complexity + v.complexity,
      saliency: acc.saliency + v.saliency,
      symmetry: acc.symmetry + v.symmetry,
      space: acc.space + v.space,
    };
  }, { brightness: 0, complexity: 0, saliency: 0, symmetry: 0, space: 0 });

  const tagCount = selectedTags.length;
  const avgVibe = {
    brightness: vibeSum.brightness / tagCount,
    complexity: vibeSum.complexity / tagCount,
    saliency: vibeSum.saliency / tagCount,
    symmetry: vibeSum.symmetry / tagCount,
    space: vibeSum.space / tagCount,
  };

  // 업종(60%) + 감성(40%)
  return {
    brightness: Math.round(baseDNA.brightness * 0.6 + avgVibe.brightness * 0.4),
    complexity: Math.round(baseDNA.complexity * 0.6 + avgVibe.complexity * 0.4),
    saliency: Math.round(baseDNA.saliency * 0.6 + avgVibe.saliency * 0.4),
    symmetry: Math.round(baseDNA.symmetry * 0.6 + avgVibe.symmetry * 0.4),
    space: Math.round(baseDNA.space * 0.6 + avgVibe.space * 0.4),
  };
};

// 문장에서 사전에 정의된 키워드들을 찾아내는 함수
const extractKeywords = (text: string) => {
  const found: string[] = [];
  const allKeywords = Object.keys(VIBE_KEYWORDS);
  
  allKeywords.forEach(keyword => {
    // #이 있든 없든 감지하도록 정규식 생성 (예: #힙한 or 힙한)
    const cleanKeyword = keyword.replace('#', '');
    const regex = new RegExp(cleanKeyword, 'g');
    
    if (regex.test(text)) {
      found.push(keyword);
    }
  });
  
  return found;
};



// 타입 정의를 위해 DB를 상수로 관리
const MOOD_DATABASE = {
  // 🌿 1. Natural & Soft (친근함, 유연함, 감성)
  'Natural_Soft': {
    'Eco_Friendly': { brightness: 70, complexity: 30, saliency: 40, symmetry: 50, space: 70 },
    'Beauty_Care': { brightness: 85, complexity: 20, saliency: 50, symmetry: 60, space: 85 },
    'Cute_Kids': { brightness: 90, complexity: 50, saliency: 70, symmetry: 40, space: 40 },
    'Healthcare': { brightness: 80, complexity: 25, saliency: 60, symmetry: 70, space: 75 },
    'Travel_Nature': { brightness: 65, complexity: 40, saliency: 80, symmetry: 50, space: 60 },
    'Vintage_Retro': { brightness: 55, complexity: 65, saliency: 50, symmetry: 45, space: 50 },
    'Home_Living': { brightness: 75, complexity: 30, saliency: 40, symmetry: 80, space: 80 },
    'Naive_Handcrafted': { brightness: 80, complexity: 25,    // 형태는 단순하게
                           saliency: 40, symmetry: 35,      // 일부러 틀어지게
                           space: 80,         // 여백은 넉넉하게
                           saturation: 45,    // 약간 바랜 느낌
                           contrast: 40, roundness: 90,     // 뭉글뭉글하게
                           straightness: 10,  // 직선은 거의 없게
                           smoothness: 15     // 선은 삐뚤삐뚤하게 (핵심!)
    }
    },
   // ⚡ 2. Impact & Dynamic (강렬함, 역동성, 개성)
  'Impact_Dynamic': {
    'Gaming_Ent': { brightness: 40, complexity: 90, saliency: 90, symmetry: 30, space: 30 },
    'Street_Fashion': { brightness: 30, complexity: 95, saliency: 80, symmetry: 20, space: 20 },
    'Tech_AI': { brightness: 50, complexity: 70, saliency: 85, symmetry: 50, space: 50 },
    'Street_Food': { brightness: 60, complexity: 80, saliency: 95, symmetry: 30, space: 30 },
    'Avant_Garde': { brightness: 45, complexity: 85, saliency: 70, symmetry: 20, space: 45 },
    'Sporty': { brightness: 55, complexity: 60, saliency: 85, symmetry: 40, space: 40 },
    'Mobility': { brightness: 45, complexity: 75, saliency: 80, symmetry: 50, space: 50 }
  },
  // 🚀 3. Rational & Structured (신뢰, 질서, 전문성)
  'Rational_Stable': {
    'Education': { brightness: 60, complexity: 30, saliency: 40, symmetry: 95, space: 65 },
    'Finance_Fintech': { brightness: 55, complexity: 35, saliency: 50, symmetry: 98, space: 70 },
    'Luxury_HighEnd': { brightness: 40, complexity: 15, saliency: 30, symmetry: 90, space: 95 },
    'RealEstate': { brightness: 50, complexity: 45, saliency: 40, symmetry: 95, space: 60 },
    'Magazine': { brightness: 65, complexity: 50, saliency: 60, symmetry: 80, space: 80 },
    'Minimal_Casual': { brightness: 70, complexity: 10, saliency: 20, symmetry: 85, space: 90 }
  },
    // 🎨 4. Artistic & High-End (우아함, 권위, 예술성)
  'Artistic_Luxury': {
    'Luxury_Classic': { brightness: 40, complexity: 15, saliency: 30, symmetry: 90, space: 95, saturation: 10, contrast: 90 },
    'Museum_Exhibition': { brightness: 50, complexity: 40, saliency: 50, symmetry: 85, space: 80, saturation: 15, contrast: 75 }, 
    'Magazine_Editorial': { brightness: 65, complexity: 50, saliency: 60, symmetry: 80, space: 80, saturation: 15, contrast: 85 },
    'Minimal_Modern': { brightness: 70, complexity: 10, saliency: 20, symmetry: 85, space: 90, saturation: 10, contrast: 60 }
  },
    // 🎞️ 5. Retro & Nostalgic (아날로그, 향수, 거친 질감)
  'Retro_Vintage': {
    'Y2K_Vibe': { brightness: 80, complexity: 85, saliency: 90, symmetry: 40, space: 30, saturation: 90, contrast: 80, roundness: 70, straightness: 30, smoothness: 20 },
    'Classic_Film': { brightness: 50, complexity: 60, saliency: 50, symmetry: 70, space: 50, saturation: 40, contrast: 45, roundness: 50, straightness: 40, smoothness: 10 },
    'Industrial_Rough': { brightness: 40, complexity: 90, saliency: 60, symmetry: 50, space: 40, saturation: 30, contrast: 70, roundness: 20, straightness: 80, smoothness: 5 }
  },
  // 🏢 6. Official & Trust (정석, 권위, 보수적)
  'Official_Standard': {
    'Government': { brightness: 60, complexity: 20, saliency: 40, symmetry: 100, space: 70, saturation: 40, contrast: 70, roundness: 30, straightness: 90, smoothness: 95 },
    'Law_Expert': { brightness: 30, complexity: 30, saliency: 50, symmetry: 95, space: 80, saturation: 20, contrast: 90, roundness: 10, straightness: 95, smoothness: 98 },
    'Medical_Pro': { brightness: 85, complexity: 25, saliency: 60, symmetry: 90, space: 75, saturation: 30, contrast: 60, roundness: 60, straightness: 70, smoothness: 95 }
  },
  // 🛍️ 7. Retail & Commercial (실용적, 가시성, 세일즈)
  'Commercial_Retail': {
    'E_Commerce': { brightness: 90, complexity: 70, saliency: 95, symmetry: 80, space: 40, saturation: 85, contrast: 90, roundness: 50, straightness: 80, smoothness: 95 },
    'Luxury_Mall': { brightness: 40, complexity: 15, saliency: 40, symmetry: 90, space: 95, saturation: 10, contrast: 95, roundness: 20, straightness: 85, smoothness: 98 },
    'Food_Delivery': { brightness: 75, complexity: 65, saliency: 98, symmetry: 50, space: 30, saturation: 98, contrast: 85, roundness: 80, straightness: 20, smoothness: 90 }
  }  
};

function App() {


  // [핵심] 브랜드 설명 변경 핸들러
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContext(prev => ({ ...prev, description: text }));

    // 실시간 DNA 업데이트 로직
    const detectedTags = extractKeywords(text);
    const combinedTags = Array.from(new Set([...selectedTags, ...detectedTags]));
    
    // 현재 선택된 업종의 기본 DNA 가져와서 섞기
    const baseDNA = (MOOD_DATABASE as any)[context.mainMood][context.subMood];
    const blended = blendDNA(baseDNA, combinedTags);
    setTargets(blended);
  };


  // --- 3. 상태 관리 (타입 안전하게 설정) ---
  const [step, setStep] = useState(1);
  const [context, setContext] = useState({ 
    industry: 'IT / 테크 스타트업', 
    mainMood: 'Rational_Stable' as keyof typeof MOOD_DATABASE, 
    subMood: 'Finance_Fintech', 
    description: '' 
  });
  const [targets, setTargets] = useState(MOOD_DATABASE['Rational_Stable']['Finance_Fintech']);

  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [result, setResult] = useState<MoodDnaResult | null>(null);
  const [compResult, setCompResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // 1. 상태 추가
  const [batchFiles, setBatchFiles] = useState<FileList | null>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchPreviews, setBatchPreviews] = useState<Record<string, string>>({});

  // 2. 파일 핸들러 수정
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setBatchFiles(e.target.files);

      // 1. 기존에 만들어둔 URL들을 메모리에서 해제 (청소)
      Object.values(batchPreviews).forEach(URL.revokeObjectURL);

      // 2. 새 파일들에 대한 URL 매핑 생성
      const newPreviews: Record<string, string> = {};
      files.forEach(file => {
        newPreviews[file.name] = URL.createObjectURL(file);
      });

      // 3. 상태에 저장
      setBatchPreviews(newPreviews);
    }
  };


  // --- 4. 위저드 함수 ---
  const handleEnergySelect = (energy: keyof typeof MOOD_DATABASE) => {
    const firstSub = Object.keys(MOOD_DATABASE[energy])[0];
    setContext({ ...context, mainMood: energy, subMood: firstSub });
    setTargets((MOOD_DATABASE as any)[energy][firstSub]);
    setStep(2); 
  };

    // 1. 업종 선택 시: 태그 초기화 및 기본값 세팅
  const handleSubMoodSelect = (subMood: string) => {
    const baseDNA = (MOOD_DATABASE as any)[context.mainMood][subMood];
    setContext({ ...context, subMood: subMood });
    setSelectedTags([]); // 업종이 바뀌면 태그는 일단 초기화 (혹은 유지하고 싶으면 이 줄 삭제)
    setTargets(baseDNA); 
    // 바로 Step 3로 안 가고, 태그를 고를 기회를 주기 위해 Step 2에 머물게 할 수도 있어!
  };

  // 2. 태그 선택 시: 현재 업종 DNA와 섞기
  const toggleTag = (tag: string) => {
    let newTags;
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      if (selectedTags.length >= 3) return;
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    
    // 현재 선택된 업종의 기본 DNA 가져오기
    const baseDNA = (MOOD_DATABASE as any)[context.mainMood][context.subMood];
    // 섞기!
    const blended = blendDNA(baseDNA, newTags);
    setTargets(blended);
  };


  const getChartData = (res: MoodDnaResult) => [
    { subject: '밝기', A: (res.brightness / 255) * 100 },
    { subject: '복잡도', A: res.complexity },
    { subject: '집중도', A: res.saliency },
    { subject: '대칭성', A: res.symmetry },
    { subject: '여백', A: res.space },
    { subject: '대비', A: res.contrast },    
    { subject: '구도', A: res.composition }
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, id: number) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (id === 1) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setFile2(selectedFile);
        setPreview2(URL.createObjectURL(selectedFile));
      }
      setResult(null);
      setCompResult(null);
    }
  };

  const analyzeMood = async () => {
    if (isLoading) return;
    if (isCompareMode ? (!file || !file2) : !file) return alert('이미지를 선택해주세요.');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('target_dna', JSON.stringify(targets));
    formData.append('brand_context', JSON.stringify(context));
    try {
      if (isCompareMode) {
        formData.append('file1', file!);
        formData.append('file2', file2!);
        const response = await axios.post('http://127.0.0.1:8000/compare', formData);
        setCompResult(response.data);
      } else {
        formData.append('file', file!);
        formData.append('remove_bg', String(removeBg));
        const response = await axios.post('http://127.0.0.1:8000/analyze', formData);
        setResult(response.data);
      }
    } catch (error) {
      alert("분석 실패 또는 API 할당량 초과");
    } finally { setIsLoading(false); }
  };

    //analyzeBatch 함수
  const analyzeBatch = async () => {
    if (!batchFiles || batchFiles.length === 0) return alert('파일들을 선택해주세요.');

    const formData = new FormData();
    // 여러 파일을 'files'라는 이름으로 담기
    Array.from(batchFiles).forEach((f) => formData.append('files', f));
    formData.append('target_dna', JSON.stringify(targets));
    formData.append('brand_context', JSON.stringify(context));

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze-batch', formData);

      setBatchResult(response.data); 
    } catch (error) {
      alert("폴더 분석 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);


// App.tsx 내부 Step 2 영역 수정
const [selectedTags, setSelectedTags] = useState<string[]>([]);



return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary">
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">M</div>
          <span>Mood<span className="text-primary">DNA</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-secondary rounded-full p-1 border border-border">
            <button onClick={() => {setIsCompareMode(false); setIsBatchMode(false); setStep(1); setResult(null);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isCompareMode && !isBatchMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>Single</button>
            <button onClick={() => {setIsCompareMode(true); setIsBatchMode(false); setStep(1); setResult(null);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isCompareMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>A/B Test</button>
            <button onClick={() => {setIsBatchMode(true); setIsCompareMode(false); setStep(1); setResult(null);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isBatchMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>Batch</button>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-muted transition-colors">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            {step === 1 && (
              <div className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-8 animate-in slide-in-from-left-4">
                <div className="space-y-2"><span className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Briefcase size={14}/> Step 01</span><h2 className="text-3xl font-black leading-tight">당신의 브랜드는 어떤<br/><span className="text-primary">에너지</span>를 가졌나요?</h2></div>
                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(MOOD_DATABASE).map((energy) => (
                    <button key={energy} onClick={() => handleEnergySelect(energy as any)} className="flex items-center justify-between p-6 rounded-2xl bg-secondary/50 hover:bg-primary hover:text-white transition-all group border border-transparent hover:border-primary/20">
                      <span className="font-black text-lg">{energy.replace('_', ' & ')}</span><Zap size={20} className="opacity-20 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-muted-foreground hover:text-primary">← 뒤로가기</button>
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Step 02</span>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black">1. 메인 <span className="text-primary">분야</span> 선택</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(MOOD_DATABASE[context.mainMood]).map((sub) => (
                        <button 
                          key={sub} 
                          onClick={() => handleSubMoodSelect(sub)} 
                          className={`px-4 py-3 rounded-xl font-bold text-xs transition-all border ${
                            context.subMood === sub ? 'bg-primary text-white border-primary' : 'bg-secondary border-border'
                          }`}
                        >
                          {sub.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between items-end">
                      <h2 className="text-2xl font-black">2. <span className="text-primary">분위기</span> 한 스푼</h2>
                      <span className="text-[10px] text-muted-foreground font-bold">{selectedTags.length}/3 선택</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(VIBE_KEYWORDS).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-2 rounded-full font-bold text-[11px] transition-all border ${
                            selectedTags.includes(tag) 
                              ? 'bg-primary/20 text-primary border-primary' 
                              : 'bg-background border-border hover:border-primary/50'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(3)} 
                  className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  DNA 세팅 완료 →
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in zoom-in-95">
                {/* 1. 브랜드 정보 카드 (산업군 + 설명) */}
                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-border pb-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <Sparkles size={18}/> 1. 브랜드 정보
                        </div>
                        <button onClick={() => setStep(1)} className="text-[10px] font-bold text-muted-foreground underline">
                          다시 설정
                        </button>
                      </div>
                                    
                      {/* 3-1. 산업군 선택 */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">산업군 선택</label>
                        <select 
                          className="w-full bg-secondary p-2.5 rounded-xl text-sm border-none focus:ring-2 focus:ring-primary transition-all outline-none" 
                          value={industries.includes(context.industry) ? context.industry : "기타 (직접 입력)"} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "기타 (직접 입력)") {
                              setContext({...context, industry: val});
                            } else {
                              setContext({...context, industry: ""}); 
                            }
                          }}
                        >
                          {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>

                        {(!industries.includes(context.industry) || context.industry === "") && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                            <input 
                              type="text"
                              placeholder="분야를 직접 입력하세요"
                              className="w-full bg-primary/5 border border-primary/20 p-3 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                              value={context.industry}
                              onChange={(e) => setContext({...context, industry: e.target.value})}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                      {/* 3-2. [추가된 부분] 브랜드 핵심 가치 및 설명 입력 구역 */}
                      <div className="space-y-3 pt-4 border-t border-border/50">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">브랜드 핵심 가치 및 설명</label>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">DNA AI 분석 활성화</span>
                          </div>
                        </div>
                        
                        <textarea 
                          placeholder="어떤 브랜드를 만들고 싶나요? 키워드를 포함하면 DNA가 자동으로 반응합니다. (예: 힙하면서도 깔끔한 테크 기업)"
                          className="w-full h-32 bg-secondary/50 border border-border p-4 rounded-2xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none font-medium leading-relaxed"
                          value={context.description}
                          onChange={handleDescriptionChange}
                        />
                        
                        {/* 실시간 감지된 키워드 뱃지 */}
                        <div className="flex flex-wrap gap-2 min-h-6">
                          {extractKeywords(context.description).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg font-black animate-in slide-in-from-top-1">
                              ✨ {tag} 감지됨
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 2. Target DNA Fine-Tuning 카드 (이건 기존 코드 그대로 유지) */}
                    <div className="p-6 bg-secondary/30 rounded-3xl border border-border space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Target size={14}/> 2. Target DNA Fine-Tuning</h3>
                      <div className="grid grid-cols-1 gap-5 px-4 max-w-[95%] mx-auto">
                        {Object.keys(targets).map((key) => {
                          const labels: any = { brightness: ["Dark", "Bright"], complexity: ["Simple", "Complex"], saliency: ["Soft", "Sharp"], symmetry: ["Organic", "Formal"], space: ["Dense", "Airy"] };
                          if (['saturation', 'contrast', 'color_range', 'roundness', 'straightness', 'smoothness'].includes(key)) return null;
                          return (
                            <div key={key} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-muted-foreground/80">{key}</span>
                                <span className="text-[10px] font-mono font-bold text-primary">{(targets as any)[key]}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[8px] font-bold text-muted-foreground/30 w-7">{labels[key]?.[0]}</span>
                                <input type="range" min="0" max="100" value={(targets as any)[key]} onChange={(e) => setTargets({...targets, [key]: parseInt(e.target.value)})} className="flex-1 h-1 bg-background rounded-lg appearance-none cursor-pointer accent-primary" />
                                <span className="text-[8px] font-bold text-muted-foreground/30 w-7 text-right">{labels[key]?.[1]}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                {/* 조건부 업로드 섹션 */}
                {isBatchMode ? (
                  <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6 animate-in fade-in">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm"><Grid size={18}/> 3. 시안 폴더 업로드 (오디션)</div>
                    <div className="bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 p-8">
                      <label className="flex flex-col items-center cursor-pointer group">
                        <div className="p-4 bg-primary/10 rounded-full text-primary mb-3 group-hover:scale-110 transition-transform"><Grid size={32} /></div>
                        <span className="text-sm font-bold">이미지 파일들 선택하기</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleBatchFileChange} />
                        <p className="text-[10px] text-muted-foreground mt-2">{batchFiles ? `${batchFiles.length}개의 시안 준비됨` : "파일들을 한꺼번에 드래그하세요"}</p>
                      </label>
                    </div>
                    <button onClick={analyzeBatch} disabled={isLoading || !batchFiles} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-lg active:scale-95 transition-all">시안 오디션 시작</button>
                  </div>
                ) : (
                  <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                      <div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg ${removeBg ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><Palette size={14} /></div><label htmlFor="bg-toggle" className="text-xs font-bold cursor-pointer">배경 자동 제거 (AI)</label></div>
                      <input type="checkbox" id="bg-toggle" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer" />
                    </div>
                    <div className={`grid ${isCompareMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                      <div className="aspect-square bg-secondary/30 rounded-2xl border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group">
                        {preview ? <img src={preview} alt="P1" className="w-full h-full object-contain" /> : <ImageIcon className="opacity-20" size={40}/>}
                        <label className="absolute inset-0 cursor-pointer"><input type="file" className="hidden" onChange={(e) => handleFileChange(e, 1)} accept="image/*" /></label>
                      </div>
                      {isCompareMode && (
                        <div className="aspect-square bg-secondary/30 rounded-2xl border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
                          {preview2 ? <img src={preview2} alt="P2" className="w-full h-full object-contain" /> : <ImageIcon className="opacity-20" size={40}/>}
                          <label className="absolute inset-0 cursor-pointer"><input type="file" className="hidden" onChange={(e) => handleFileChange(e, 2)} accept="image/*" /></label>
                        </div>
                      )}
                    </div>
                    <button onClick={analyzeMood} disabled={isLoading || !file} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20}/>}
                      {isLoading ? 'DNA SCANNING...' : '디자인 분석하기'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- 오른쪽 패널 (결과 출력) --- */}
          <div className="lg:col-span-7 space-y-8">
            {isLoading ? (
              <div className="h-full min-h-125 flex flex-col items-center justify-center space-y-8 py-20 text-center">
                <div className="relative">{preview && <img src={preview} alt="L" className="w-48 h-48 object-contain blur-2xl opacity-20 animate-pulse" />}<Loader2 className="absolute inset-0 m-auto w-12 h-12 animate-spin text-primary" /></div>
                <div className="text-center space-y-3"><h2 className="text-2xl font-black animate-shimmer">디자인 유전자를 해독하는 중입니다...</h2><p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Sequencing Visual DNA Pattern</p></div>
              </div>
            ) : isBatchMode && batchResult ? (
              /*  폴더 분석(오디션) 결과 UI */
              <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
                <div className="bg-card rounded-3xl border-2 border-primary p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Grid size={100}/></div>
                  <h2 className="text-3xl font-black mb-4">마스터의 오디션 리포트</h2>
                  
                  <div className="space-y-6">
                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20 text-left">
                      <h4 className="font-bold text-primary mb-2">🏆 우승 시안 리뷰</h4>
                      <p className="text-sm leading-relaxed">{batchResult.master_report.winner_review}</p>
                    </div>

                    <div className="grid gap-3">
                      {batchResult.ranking.map((item: any, idx: number) => {
                        const imageUrl = batchPreviews[item.filename];

                        return (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-2xl hover:bg-secondary/50 transition-all border border-border/50 group">
                            {/* 1. 순위 표시 */}
                            <span className={`font-black text-lg w-8 ${idx === 0 ? 'text-amber-500' : 'text-primary'}`}>
                              {idx + 1}
                            </span>

                            {/* 2. 📸 이미지 썸네일 */}
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted border border-border shadow-md shrink-0">
                              {imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={item.filename} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <ImageIcon size={24} />
                                </div>
                              )}
                            </div>

                            {/* 3. 파일 정보 */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold truncate text-foreground/80">{item.filename}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">DNA Match</span>
                              </div>
                            </div>

                            {/* 4. 점수 */}
                            <div className="text-right">
                              <span className={`text-xl font-mono font-black ${idx === 0 ? 'text-amber-500' : 'text-foreground'}`}>
                                {item.score}<span className="text-[10px] ml-0.5 opacity-50">pt</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
              </div>
            </div>

            ) : isCompareMode && compResult ? (
              /* ⚖️ 비교 결과창 (중괄호 짝궁 확인!) */
              <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6 text-left">
                <div className="bg-card rounded-4xl border-2 border-primary p-10 shadow-xl">
                  <h2 className="text-3xl font-black mb-4">승자는 <span className="text-primary underline decoration-wavy">{compResult.comparison.winner}안</span> 입니다!</h2>
                  <p className="text-lg font-medium text-primary mb-6">{compResult.comparison.summary}</p>
                  <div className="grid gap-4"><div className="bg-secondary/30 p-5 rounded-2xl"><h4 className="font-bold text-foreground mb-2">상세 분석</h4><p className="text-sm opacity-80 whitespace-pre-wrap">{compResult.comparison.detail_comparison}</p></div></div>
                </div>
              </div>
            ) : result ? (

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 text-left pb-20">
  
              {/* [메인 인사이트 카드] - 옆선을 제거하고 패딩(p-10)을 늘려 시원하게 만듦 */}
              <div className="bg-card rounded-[2.5rem] border border-border p-10 shadow-sm relative overflow-hidden">
                
                {/* 상단: 점수와 카테고리 (글자 크기 정돈) */}
                <div className="flex items-end justify-between mb-12">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-70">
                      <Sparkles size={14}/> Master's Insight
                    </div>
                    <h2 className="text-6xl font-black text-foreground tracking-tighter">
                      {result.total_score}<span className="text-2xl ml-2 font-bold text-muted-foreground">/ 100</span>
                    </h2>
                  </div>
                  <span className="px-5 py-2 rounded-xl bg-secondary text-[11px] font-black uppercase tracking-widest border border-border/50">
                    {result.category}
                  </span>
                </div>

                {/* 1. 5대 지표 평가 (작은 뱃지 대신 깔끔한 표 형태로) */}
                <div className="flex flex-col gap-3 mb-12">
                {Object.entries(result.evaluation).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-border/40 transition-all hover:bg-secondary/50">
                    {/* 상태 뱃지: 긍정적인 단어가 포함되면 GOOD, 아니면 CHECK 표시 */}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      value.includes('적절') || value.includes('안정') || value.includes('우수') 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-primary/10 text-primary'
                    }`}>
                      {value.includes('적절') || value.includes('안정') || value.includes('우수') ? 'GOOD' : 'CHECK'}
                    </span>

                    {/* 지표명: 너비를 고정(w-24)하여 정렬 유지 */}
                    <span className="text-[11px] font-black text-muted-foreground uppercase w-24 shrink-0">
                      {key}
                    </span>

                    {/* 분석 내용: 줄간격을 조절(leading-relaxed)하여 가독성 향상 */}
                    <span className="text-[13px] font-medium text-foreground leading-relaxed italic opacity-90">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
                {/* 2. 3대 핵심 역량 (가운데 정렬 및 아이콘 배치) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                  <CompetencyCard title="Brand Identity" desc={result.competency?.identity} icon={Target} />
                  <CompetencyCard title="Graphic Quality" desc={result.competency?.quality} icon={Activity} />
                  <CompetencyCard title="Technical Fidelity" desc={result.competency?.fidelity} icon={Scale} />
                </div>

                {/* 3. 전문가의 심층 조언 (가독성 극대화 섹션) */}
                <div className="space-y-12 border-t border-border/50 pt-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-primary tracking-[0.2em] opacity-80">Overall Mood Analysis</label>
                    <p className="text-3xl font-bold leading-tight text-foreground tracking-tight whitespace-pre-wrap italic">
                      "{result.mood}"
                    </p>
                  </div>
                  
                  <div className="p-8 rounded-4xl bg-secondary/40 border border-border/60 shadow-inner">
                    <label className="text-[11px] font-black uppercase text-primary tracking-[0.2em] block mb-5 text-left">Master's Strategic Advice</label>
                    <p className="text-[17px] font-medium leading-relaxed text-foreground/90 break-keep">
                      {result.advice}
                    </p>
                  </div>

                  {/* 액션 체크리스트 */}
                  <div className="space-y-5">
                    <h4 className="text-[13px] font-black text-muted-foreground uppercase tracking-widest">Action Checklist</h4>
                    <div className="grid gap-3">
                      {result.action_checklist?.map((item, idx) => (
                        <div key={idx} className="text-sm text-foreground/80 bg-background/40 p-4 rounded-2xl flex gap-4 border border-border/30 items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">✓</div>
                          {item}
                        </div>

                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 📊 차트 및 상세 결과 섹션 --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-card rounded-3xl border border-border p-6 flex items-center justify-center min-h-75">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData(result)}>
                        <PolarGrid stroke="var(--color-border)" />
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 11, fontWeight: 700, fill: 'var(--color-muted-foreground)'}} />
                        <RechartsRadar dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Brightness" value={result.brightness} max={255} color="bg-amber-400" icon={Sun} />
                    <StatCard label="Complexity" value={result.complexity} color="bg-blue-500" icon={Grid} />
                    <StatCard label="Saliency" value={result.saliency} color="bg-purple-500" icon={Activity} />
                    <StatCard label="Symmetry" value={result.symmetry} color="bg-green-500" icon={Zap} />
                    <StatCard label="Contrast" value={result.contrast} color="bg-orange-500" icon={Zap} />
                    <StatCard label="Composition" value={result.composition} color="bg-indigo-500" icon={Maximize} />
                    <StatCard label="Space Ratio" value={result.space} color="bg-slate-400" icon={Maximize} />
                  </div>
                </div>

                {/* --- 🎨 컬러 DNA 섹션 --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                    <h3 className="text-[11px] font-black text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2"><Palette size={14} /> Color DNA</h3>
                    <div className="flex h-16 rounded-2xl overflow-hidden border border-border">
                      {result.colors.map((c, i) => (
                        <div key={i} className="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all" style={{backgroundColor: c}} onClick={() => {navigator.clipboard.writeText(c); alert('복사되었습니다!');}} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex items-center justify-around">
                    {result.suggested_palette?.map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full shadow-md border-2 border-white" style={{backgroundColor: color}} />
                        <span className="text-[9px] font-mono opacity-50 uppercase">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- 스타일 벤치마킹 섹션 --- */}
                <div className="space-y-8 pt-8 border-t border-border">
                  <h3 className="text-2xl font-black tracking-tight">Style Benchmarking</h3>
                  {result.reference_images && result.reference_images.length > 0 ? (
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {result.reference_images.map((url, i) => (
                      <div 
                        key={i} 
                        className="group relative break-inside-avoid rounded-2xl overflow-hidden border border-border bg-muted shadow-sm transition-all cursor-zoom-in hover:shadow-xl hover:-translate-y-1 duration-300"
                        id={`ref-card-${i}`} // ID 추가
                        onClick={() => setSelectedImg(url)}
                      >
                        <img 
                          src={url} 
                          alt={`Ref ${i}`} 
                          referrerPolicy="no-referrer" 
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                          // 핵심: 이미지 로딩 실패 시 부모 컨테이너(div)를 아예 숨김
                         onError={(e) => {
                            // 에러가 난 이미지의 부모 요소(div)를 찾아서 숨김
                            const target = e.currentTarget.parentElement;
                            if (target) {
                              (target as HTMLElement).style.display = 'none';
                            }
                          }}
                        />
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={(e) => {e.stopPropagation(); window.open(url, '_blank')}} 
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/40 hover:bg-white/40 transition-all"
                          >
                            <ExternalLink size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-secondary/10">
                      <ImageIcon className="opacity-20 mb-2" size={32} />
                      <p className="text-xs text-muted-foreground font-medium">참고 이미지를 불러오지 못했습니다.</p>
                    </div>
                  )}

                  {/* App.tsx 파일 하단 핀터레스트 버튼 구역 */}
                  <div className="flex justify-center pt-10 pb-6">
                    <button 
                      onClick={() => window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(result.category + ' ' + result.design_keywords.join(' '))}`, '_blank')}
                      className="group flex items-center gap-3 px-8 py-4 bg-[#E60023] hover:bg-[#ad0018] text-white rounded-full font-black text-sm shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95"
                    >
                      {/* 핀터레스트 느낌이 나는 아이콘 배치 */}
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#E60023]">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.718-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.396 2.966 7.396 6.929 0 4.135-2.607 7.462-6.225 7.462-1.214 0-2.354-.63-2.746-1.37l-.748 2.853c-.271 1.031-1.002 2.324-1.492 3.121C10.587 23.83 11.288 24 12.017 24c6.622 0 11.988-5.367 11.988-11.987C24 5.367 18.639 0 12.017 0z"/>
                        </svg>
                      </div>
                      <span className="tracking-tight">핀터레스트에서 {result.category} 영감 더 보기</span>
                      <ExternalLink size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                </div> {/* 1. 스타일 벤치마킹 닫기 */}
              </div>
            ) : (
              /* ⚡ 기본 대기 화면 */
              <div className="h-full min-h-125 border-2 border-dashed border-border/50 rounded-[3rem] flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
                <Zap size={40} className="opacity-10 mb-4 animate-pulse" />
                <p className="font-bold text-lg text-center">브랜드 무드를 설정하고 분석을 시작하세요.</p>
              </div>
            )}
          </div> {/* 3. lg:col-span-7 (오른쪽 패널) 닫기 */}

          {/* --- 🔍 이미지 확대 모달 --- */}
          {selectedImg && (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setSelectedImg(null)}>
              <button className="absolute top-6 right-6 text-white/50 hover:text-white" onClick={() => setSelectedImg(null)}>
                <Maximize size={32} className="rotate-45" />
              </button>
              <img src={selectedImg} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in-95" />
              <div className="absolute bottom-10">
                <button onClick={(e) => {e.stopPropagation(); window.open(selectedImg, '_blank');}} className="px-6 py-2 bg-white/10 text-white text-sm font-bold rounded-full border border-white/20">원본 이미지 보기</button>
              </div>
            </div>
            )}
            </div> {/* 4. grid grid-cols-12 (메인 그리드) 닫기 */}
          </main>
        </div> /* 5. min-h-screen (최상위 루트) 닫기 */
      );
    }

    export default App;