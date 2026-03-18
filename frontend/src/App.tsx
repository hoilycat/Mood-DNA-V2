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
    'Home_Living': { brightness: 75, complexity: 30, saliency: 40, symmetry: 80, space: 80 }
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
    'Museum_Exhibition': { brightness: 50, complexity: 40, saliency: 50, symmetry: 85, space: 80, saturation: 15, contrast: 75 }, // 🏛️ 박물관/예술 추가!
    'Magazine_Editorial': { brightness: 65, complexity: 50, saliency: 60, symmetry: 80, space: 80, saturation: 15, contrast: 85 },
    'Minimal_Modern': { brightness: 70, complexity: 10, saliency: 20, symmetry: 85, space: 90, saturation: 10, contrast: 60 }
  }
  
};

function App() {
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

  // --- 4. 위저드 함수 ---
  const handleEnergySelect = (energy: keyof typeof MOOD_DATABASE) => {
    const firstSub = Object.keys(MOOD_DATABASE[energy])[0];
    setContext({ ...context, mainMood: energy, subMood: firstSub });
    setTargets((MOOD_DATABASE as any)[energy][firstSub]);
    setStep(2); 
  };

  const handleSubMoodSelect = (subMood: string) => {
    setContext({ ...context, subMood: subMood });
    setTargets((MOOD_DATABASE as any)[context.mainMood][subMood]);
    setStep(3); 
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary">
      {/* 헤더 */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">M</div>
          <span>Mood<span className="text-primary">DNA</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-secondary rounded-full p-1 border border-border">
            <button onClick={() => {setIsCompareMode(false); setResult(null); setCompResult(null); setStep(1);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isCompareMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>Single</button>
            <button onClick={() => {setIsCompareMode(true); setResult(null); setCompResult(null); setStep(1);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isCompareMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>A/B Test</button>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-muted transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- 왼쪽 사이드바 (Step-by-Step 위저드) --- */}
          <div className="lg:col-span-5 space-y-6">
            
            {step === 1 && (
              <div className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-8 animate-in slide-in-from-left-4">
                <div className="space-y-2">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Briefcase size={14}/> Step 01</span>
                  <h2 className="text-3xl font-black leading-tight">당신의 브랜드는 어떤<br/><span className="text-primary">에너지</span>를 가졌나요?</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(MOOD_DATABASE).map((energy) => (
                    <button key={energy} onClick={() => handleEnergySelect(energy as any)} className="flex items-center justify-between p-6 rounded-2xl bg-secondary/50 hover:bg-primary hover:text-white transition-all group border border-transparent hover:border-primary/20">
                      <span className="font-black text-lg">{energy.replace('_', ' & ')}</span>
                      <Zap size={20} className="opacity-20 group-hover:opacity-100 transition-all" />
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
                <h2 className="text-3xl font-black leading-tight">더 구체적인<br/><span className="text-primary">분야</span>를 알려주세요.</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(MOOD_DATABASE[context.mainMood]).map((sub) => (
                    <button key={sub} onClick={() => handleSubMoodSelect(sub)} className="px-6 py-4 rounded-2xl bg-secondary font-black text-sm hover:ring-2 hover:ring-primary transition-all border border-border text-left w-full">
                      # {sub.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in zoom-in-95">
                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm"><Sparkles size={18}/> 1. 브랜드 정보</div>
                    <button onClick={() => setStep(1)} className="text-[10px] font-bold text-muted-foreground underline">다시 설정</button>
                  </div>
                  <select className="w-full bg-secondary p-2.5 rounded-xl text-sm border-none focus:ring-2 focus:ring-primary" value={context.industry} onChange={(e) => setContext({...context, industry: e.target.value})}>
                    <option>IT / 테크 스타트업</option>
                    <option>카페 / 베이커리</option>
                    <option>의료 / 제약</option>
                    <option>하이엔드 패션 / 명품</option>
                  </select>
                  <textarea placeholder="브랜드 설명을 적어주세요..." className="w-full bg-secondary p-4 rounded-2xl text-sm border-none h-24 resize-none" onChange={(e) => setContext({...context, description: e.target.value})} />
                </div>

                <div className="p-6 bg-secondary/30 rounded-3xl border border-border space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Target size={14}/> 2. Target DNA Fine-Tuning</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {Object.keys(targets).map((key) => {
                      const labels: any = { brightness: ["Dark", "Bright"], complexity: ["Simple", "Complex"], saliency: ["Soft", "Sharp"], symmetry: ["Organic", "Formal"], space: ["Dense", "Airy"] };
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center px-1"><span className="text-[9px] font-black uppercase text-muted-foreground/80">{key}</span><span className="text-[10px] font-mono font-bold text-primary">{(targets as any)[key]}</span></div>
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

                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6">
                  {/* --- 배경 제거 옵션 추가 --- */}
                  <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${removeBg ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Palette size={14} />
                      </div>
                      <label htmlFor="bg-toggle" className="text-xs font-bold cursor-pointer">
                        배경 자동 제거 (AI)
                      </label>
                    </div>
                    <input 
                      type="checkbox" 
                      id="bg-toggle" 
                      checked={removeBg} 
                      onChange={(e) => setRemoveBg(e.target.checked)} 
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
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
                  <button onClick={analyzeMood} disabled={isLoading || !file} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20}/>}
                    {isLoading ? 'DNA SCANNING...' : '디자인 분석하기'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- 오른쪽 패널 (결과 출력) --- */}
          <div className="lg:col-span-7 space-y-8">
            {isLoading ? (
              <div className="h-full min-h-125 flex flex-col items-center justify-center space-y-8 py-20 text-center">
                <div className="relative">
                  {preview && <img src={preview} alt="Loading Preview" className="w-48 h-48 object-contain blur-2xl opacity-20 animate-pulse" />}
                  <Loader2 className="absolute inset-0 m-auto w-12 h-12 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black animate-shimmer">디자인 유전자를 해독하는 중입니다...</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Sequencing Visual DNA Pattern</p>
                </div>
              </div>

               ) : isCompareMode && compResult ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                <div className="bg-card rounded-3xl border-2 border-primary p-8 shadow-xl relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Scale size={100}/></div>
                  <h2 className="text-3xl font-black mb-4 text-left">
                    승자는 <span className="text-primary underline decoration-wavy">{compResult.comparison.winner}안</span> 입니다!
                  </h2>
                  <p className="text-lg font-medium text-primary mb-6 text-left">{compResult.comparison.summary}</p>
                  <div className="grid gap-4 text-sm leading-relaxed">
                    <div className="bg-secondary/30 p-5 rounded-2xl">
                      <h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><Activity size={16}/> 상세 비교 분석</h4>
                      <p className="whitespace-pre-wrap opacity-80">{compResult.comparison.detail_comparison}</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                      <h4 className="font-bold text-primary flex items-center gap-2 mb-2"><Sparkles size={16}/> 선택 이유</h4>
                      <p className="whitespace-pre-wrap text-primary/80">{compResult.comparison.reasoning}</p>
                    </div>
                  </div>
                </div>
              </div>

            ) : result ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 w-2 h-full bg-linear-to-b from-primary to-purple-500" />
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-primary"><Sparkles size={22}/> Master's Insight</h2>
                      <span className="text-5xl font-black text-amber-500 tracking-tighter">{result.total_score}<span className="text-xl">점</span></span>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-secondary text-[10px] font-black uppercase tracking-widest">{result.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {Object.entries(result.evaluation).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-secondary text-[9px] font-bold rounded-md border border-border">
                        {key.toUpperCase()}: {value}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <CompetencyCard title="Brand Identity" desc={result.competency?.identity || "분석 대기 중..."} icon={Target} />
                    <CompetencyCard title="Graphic Quality" desc={result.competency?.quality || "분석 대기 중..."} icon={Activity} />
                    <CompetencyCard title="Technical Fidelity" desc={result.competency?.fidelity || "분석 대기 중..."} icon={Scale} />
                  </div>
                  {result.market_analysis && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-amber-600 uppercase">Estimated Market Value (Beta)</span>
                        <span className="text-lg font-black text-amber-600">
                          ₩{result.market_analysis.estimated_value.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-600/70 mt-1">* 2026년 디자인 노임단가 및 작업 복잡도 기준</p>
                    </div>
                  )}
                  <div className="space-y-8">
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left block">Overall Mood</label><p className="text-lg font-medium leading-relaxed whitespace-pre-wrap text-left">{result.mood}</p></div>
                    <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50"><label className="text-[10px] font-black uppercase text-primary tracking-widest block mb-3 text-left">Strategic Advice</label><p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap text-left">{result.advice}</p></div>
                    <div className="space-y-4"><h4 className="text-sm font-black text-foreground flex items-center gap-2 text-left">📌 Action Checklist</h4><div className="grid gap-2">{result.action_checklist?.map((item, idx) => (<div key={idx} className="text-xs text-muted-foreground bg-background/50 p-3 rounded-xl flex gap-3 border border-border/40 text-left"><span className="text-primary font-bold">✅</span> {item}</div>))}</div></div>
                  </div>
                </div>

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
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <StatCard label="Brightness" value={result.brightness} max={255} color="bg-amber-400" icon={Sun} />
                    <StatCard label="Complexity" value={result.complexity} color="bg-blue-500" icon={Grid} />
                    <StatCard label="Saliency" value={result.saliency} color="bg-purple-500" icon={Activity} />
                    <StatCard label="Symmetry" value={result.symmetry} color="bg-green-500" icon={Zap} />
                    <StatCard label="Contrast" value={result.contrast} color="bg-orange-500" icon={Zap} />
                    <StatCard label="Composition" value={result.composition} color="bg-indigo-500" icon={Maximize} />
                    <StatCard label="Space Ratio" value={result.space} color="bg-slate-400" icon={Maximize} />
                  </div>
                </div>

                {/* 컬러 DNA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                    <h3 className="text-[11px] font-black text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2"><Palette size={14} /> Color DNA</h3>
                    <div className="flex h-16 rounded-2xl overflow-hidden border border-border">{result.colors.map((c, i) => (<div key={i} className="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all" style={{backgroundColor: c}} onClick={() => {navigator.clipboard.writeText(c); alert('복사되었습니다!');}} />))}</div>
                  </div>
                  <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex items-center justify-around">{result.suggested_palette?.map((color, idx) => (<div key={idx} className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full shadow-md border-2 border-white" style={{backgroundColor: color}} /><span className="text-[9px] font-mono opacity-50 uppercase">{color}</span></div>))}</div>
                </div>

                <div className="space-y-8 pt-8 border-t border-border">
                   <div className="space-y-1"><h3 className="text-2xl font-black tracking-tight text-foreground text-left">Style Benchmarking</h3><p className="text-sm text-muted-foreground text-left">완성도를 높이기 위한 시각적 레퍼런스 가이드</p></div>
                   {result.reference_images && result.reference_images.length > 0 ? (
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                      {result.reference_images.map((url, i) => (
                        <div key={i} className="group relative break-inside-avoid rounded-2xl overflow-hidden border border-border bg-muted shadow-sm transition-all cursor-zoom-in hover:shadow-xl hover:-translate-y-1 duration-300" onClick={() => setSelectedImg(url)}>
                          <img src={url} alt={`Ref ${i}`} referrerPolicy="no-referrer" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={(e) => {e.stopPropagation(); window.open(url, '_blank')}} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/40 hover:bg-white/40 transition-all"><ExternalLink size={20} /></button></div>
                        </div>

                      ))}
                    </div>
                  ) : (<div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-secondary/10"><ImageIcon className="opacity-20 mb-2" size={32} /><p className="text-xs text-muted-foreground font-medium">참고 이미지를 불러오지 못했습니다.</p></div>)}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-125 border-2 border-dashed border-border/50 rounded-[3rem] flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
                <Zap size={40} className="opacity-10 mb-4 animate-pulse" />
                <p className="font-bold text-lg">왼쪽에서 브랜드 무드를 설정하고 분석을 시작하세요.</p>
                
              </div>
            )}
          </div>
        </div>
       {/* --- 이미지 확대 모달 --- */}
        {selectedImg && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedImg(null)}><Maximize size={32} className="rotate-45" /></button>
            <img src={selectedImg} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" />
            <div className="absolute bottom-10 flex gap-4">
                <button onClick={(e) => {e.stopPropagation(); window.open(selectedImg, '_blank');}} className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-full backdrop-blur-md transition-all">원본 이미지 보기</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;