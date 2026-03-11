import { useState, useEffect, type ChangeEvent } from 'react';
import axios from 'axios';
import { 
  ImageIcon, Loader2, Sparkles, Activity, Grid, Palette, 
  Sun, Moon, Zap, Maximize, ExternalLink, Scale 
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RechartsRadar 
} from 'recharts';

// --- 1. StatCard 컴포넌트 ---
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

// --- 2. 데이터 구조 정의 ---
interface MoodDnaResult {
  brightness: number; complexity: number; saliency: number; symmetry: number; space: number;
  colors: string[]; category: string; mood: string; advice: string; benchmarking_point: string;
  design_keywords: string[]; suggested_palette: string[]; reference_images: string[];
}

interface ComparisonResult {
  winner: string; summary: string; detail_comparison: string; reasoning: string; suggested_action: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [result, setResult] = useState<MoodDnaResult | null>(null);
  const [compResult, setCompResult] = useState<{comparison: ComparisonResult, stats1: any, stats2: any, reference_images: string[]} | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const getChartData = (res: MoodDnaResult) => [
    { subject: '밝기', A: (res.brightness / 255) * 100 },
    { subject: '복잡도', A: res.complexity },
    { subject: '집중도', A: res.saliency },
    { subject: '대칭성', A: res.symmetry },
    { subject: '여백', A: res.space },
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
    if (isCompareMode ? (!file || !file2) : !file) return alert('이미지를 선택해주세요.');
    setIsLoading(true);
    const formData = new FormData();
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
        console.log("Backend Response:", response.data); // 확인용 로그
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
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">M</div>
          <span>Mood<span className="text-primary">DNA</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-secondary rounded-full p-1 border border-border">
            <button onClick={() => {setIsCompareMode(false); setResult(null); setCompResult(null);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isCompareMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>Single</button>
            <button onClick={() => {setIsCompareMode(true); setResult(null); setCompResult(null);}} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isCompareMode ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}>A/B Test</button>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-muted transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Upload Area */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
              <div className={`grid ${isCompareMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
                <div className="aspect-square bg-secondary/50 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center relative overflow-hidden group">
                  {isCompareMode && <span className="absolute top-2 left-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded font-bold z-20">A안</span>}
                  {preview ? <img src={preview} alt="Preview 1" className="w-full h-full object-contain z-10" /> : <ImageIcon className="w-12 h-12 opacity-30" />}
                  <label className="absolute inset-0 cursor-pointer z-20"><input type="file" className="hidden" onChange={(e) => handleFileChange(e, 1)} accept="image/*" /></label>
                </div>
                {isCompareMode && (
                  <div className="aspect-square bg-secondary/50 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center relative overflow-hidden group animate-in slide-in-from-right-4">
                    <span className="absolute top-2 left-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded font-bold z-20">B안</span>
                    {preview2 ? <img src={preview2} alt="Preview 2" className="w-full h-full object-contain z-10" /> : <ImageIcon className="w-12 h-12 opacity-30" />}
                    <label className="absolute inset-0 cursor-pointer z-20"><input type="file" className="hidden" onChange={(e) => handleFileChange(e, 2)} accept="image/*" /></label>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {!isCompareMode && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                    <input type="checkbox" id="bg-toggle" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="w-5 h-5 accent-primary" />
                    <label htmlFor="bg-toggle" className="text-sm font-medium cursor-pointer flex-1">배경 제거 (Logo Mode)</label>
                  </div>
                )}
                <button onClick={analyzeMood} disabled={isLoading || !file || (isCompareMode && !file2)} className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
                  {isLoading ? <Loader2 className="animate-spin" /> : (isCompareMode ? <Scale size={18} /> : <Sparkles size={18} />)}
                  {isLoading ? 'Processing DNA...' : (isCompareMode ? '두 시안 비교하기' : '이미지 분석하기')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Results Area */}
          <div className="lg:col-span-7 space-y-8">
            {isLoading ? (
              <div className="h-full min-h-125 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="font-bold animate-pulse text-muted-foreground">Analyzing Design DNA...</p>
              </div>
            ) : isCompareMode && compResult ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-card rounded-2xl border-2 border-primary p-6 relative overflow-hidden shadow-xl shadow-primary/5">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Scale size={100}/></div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="bg-amber-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold uppercase">Master's Choice</span>
                  </div>
                  <h2 className="text-3xl font-black mb-4">승자는 <span className="text-primary underline decoration-wavy">{compResult.comparison.winner}안</span> 입니다.</h2>
                  <p className="text-lg font-medium text-primary mb-6">{compResult.comparison.summary}</p>
                  <div className="grid gap-4 text-sm leading-relaxed">
                    <div className="bg-secondary/30 p-5 rounded-2xl"><h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><Activity size={16}/> 상세 비교 분석</h4><p className="whitespace-pre-wrap opacity-80">{compResult.comparison.detail_comparison}</p></div>
                    <div className="bg-secondary/30 p-5 rounded-2xl"><h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><Sparkles size={16}/> 선택 이유</h4><p className="whitespace-pre-wrap opacity-80">{compResult.comparison.reasoning}</p></div>
                    <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl"><h4 className="font-bold text-primary flex items-center gap-2 mb-2"><Maximize size={16}/> 향후 개선 제안</h4><p className="whitespace-pre-wrap text-primary/80">{compResult.comparison.suggested_action}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm"><h3 className="text-xs font-bold text-blue-500 mb-4 uppercase tracking-widest text-left">A안 데이터</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="밝기" value={compResult.stats1.brightness} max={255} color="bg-amber-400" icon={Sun} />
                      <StatCard label="복잡도" value={compResult.stats1.complexity} color="bg-blue-500" icon={Grid} />
                      <StatCard label="집중도" value={compResult.stats1.saliency} color="bg-purple-500" icon={Activity} />
                      <StatCard label="대칭성" value={compResult.stats1.symmetry} color="bg-green-500" icon={Zap} />
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm"><h3 className="text-xs font-bold text-red-500 mb-4 uppercase tracking-widest text-left">B안 데이터</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="밝기" value={compResult.stats2.brightness} max={255} color="bg-amber-400" icon={Sun} />
                      <StatCard label="복잡도" value={compResult.stats2.complexity} color="bg-blue-500" icon={Grid} />
                      <StatCard label="집중도" value={compResult.stats2.saliency} color="bg-purple-500" icon={Activity} />
                      <StatCard label="대칭성" value={compResult.stats2.symmetry} color="bg-green-500" icon={Zap} />
                    </div>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-left">
                <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-primary to-purple-500" />
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                      <Sparkles size={22}/> AI Design Critique
                    </h2>
                    <span className="px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-tight">
                      {result.category}
                    </span>
                  </div>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-tighter text-muted-foreground">Overall Mood</span>
                      <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">{result.mood}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50">
                      <span className="text-[11px] font-black uppercase tracking-tighter text-primary block mb-3">Strategic Advice</span>
                      <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{result.advice}</p>
                    </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Brightness" value={result.brightness} max={255} color="bg-amber-400" icon={Sun} />
                    <StatCard label="Complexity" value={result.complexity} color="bg-blue-500" icon={Grid} />
                    <StatCard label="Saliency" value={result.saliency} color="bg-purple-500" icon={Activity} />
                    <StatCard label="Symmetry" value={result.symmetry} color="bg-green-500" icon={Zap} />
                    <div className="col-span-2">
                      <StatCard label="Space Ratio" value={result.space} color="bg-slate-400" icon={Maximize} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                    <h3 className="text-[11px] font-black text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Palette size={14} /> Color DNA
                    </h3>
                    <div className="flex h-16 rounded-2xl overflow-hidden shadow-inner border border-border">
                      {result.colors.map((c, i) => (
                        <div key={i} className="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all" style={{backgroundColor: c}} onClick={() => {navigator.clipboard.writeText(c); alert('복사되었습니다!');}} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                    <h3 className="text-[11px] font-black text-primary mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={14} /> AI Suggested Palette
                    </h3>
                    <div className="flex justify-around items-center">
                      {result.suggested_palette?.map((color, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-gray-800 transition-transform hover:scale-110 cursor-pointer" style={{ backgroundColor: color }} onClick={() => navigator.clipboard.writeText(color)} />
                          <span className="text-[10px] font-mono opacity-60 uppercase">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-border">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight">Style Benchmarking</h3>
                      <p className="text-sm text-muted-foreground">완성도를 높이기 위한 시각적 레퍼런스 가이드</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.design_keywords?.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-secondary text-[10px] font-bold text-muted-foreground border border-border uppercase">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result.benchmarking_point && (
                    <div className="p-6 rounded-3xl bg-linear-to-br from-primary/5 to-transparent border border-primary/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={60}/></div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Zap size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm">Master's Benchmarking Point</h4>
                          <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{result.benchmarking_point}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.reference_images && result.reference_images.length > 0 ? (
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                      {result.reference_images.map((url, i) => (
                        <div key={i} className="group relative break-inside-avoid rounded-2xl overflow-hidden border border-border bg-muted shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                          <img 
                            src={url} 
                            alt={`Ref ${i}`} 
                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" 
                            onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => window.open(url, '_blank')} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/40 hover:bg-white/40 transition-all">
                              <ExternalLink size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-secondary/10">
                      <ImageIcon className="opacity-20 mb-2" size={32} />
                      <p className="text-xs text-muted-foreground font-medium">참고 이미지를 불러오지 못했습니다. Google 검색 설정을 확인하세요.</p>
                    </div>
                  )}

                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={() => window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(result.category + ' ' + (result.design_keywords?.[0] || '') + ' design')}`, '_blank')}
                      className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#E60023] text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                      <ImageIcon size={18} />
                      <span>핀터레스트에서 영감 더 보기</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-125 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-[2.5rem] bg-secondary/10">
                <Zap size={40} className="opacity-20 mb-4 animate-pulse" />
                <p className="font-bold text-lg">{isCompareMode ? '두 장의 시안을 선택해 주세요' : '이미지를 업로드하고 분석을 시작하세요'}</p>
                <p className="text-sm opacity-60 mt-1">디자인 DNA 데이터를 기반으로 마스터의 훈수를 드립니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;