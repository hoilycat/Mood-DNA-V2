import { useState, useEffect, type ChangeEvent } from 'react';
import axios from 'axios';
import { ImageIcon, Loader2, Sparkles, Activity, Grid, Palette, Sun, Moon, Zap, Maximize, ExternalLink } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RechartsRadar } from 'recharts';

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
      <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
  </div>
);

// --- 2. 데이터 구조 정의 ---
interface MoodDnaResult {
  brightness: number; complexity: number; saliency: number; symmetry: number; space: number;
  colors: string[]; category: string; mood: string; advice: string; benchmarking_point: string;
  design_keywords: string[]; // 💡 unsplash_keywords에서 이름 변경됨
  suggested_palette: string[]; reference_images: string[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<MoodDnaResult | null>(null);
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
      setResult(null);
    }
  };

  const analyzeMood = async () => {
    if (!file) return alert('이미지를 선택하세요.');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remove_bg', String(removeBg));
    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData);
      setResult(response.data);
    } catch (error) {
      alert("분석 실패 또는 API 할당량 초과");
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary">
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">M</div>
            <span>Mood<span className="text-primary">DNA</span></span>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-muted transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
              <div className="aspect-square bg-secondary/50 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center relative overflow-hidden group">
                {preview ? <img src={preview} alt="Preview" className="w-full h-full object-contain z-10" /> : <ImageIcon className="w-16 h-16 opacity-30" />}
                <label className="absolute inset-0 cursor-pointer z-20"><input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <input type="checkbox" id="bg-toggle" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="w-5 h-5 accent-primary" />
                  <label htmlFor="bg-toggle" className="text-sm font-medium cursor-pointer flex-1">배경 제거 (Logo Mode)</label>
                </div>
                <button onClick={analyzeMood} disabled={isLoading || !file} className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {isLoading ? 'DNA 추출 중...' : '이미지 분석하기'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* 1. AI Critique */}
                <div className="bg-card rounded-2xl border p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-purple-500" />
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary"><Sparkles size={20}/> AI Critique</h2>
                  <div className="space-y-4 text-sm leading-relaxed">
                    <div className="bg-secondary/30 p-4 rounded-xl font-bold">분야: {result.category}</div>
                    <div className="bg-secondary/30 p-4 rounded-xl">
                      <span className="font-bold block mb-1">Mood</span>
                      <p className="whitespace-pre-wrap">{result.mood}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl">
                      <span className="font-bold block mb-1">Advice</span>
                      <p className="whitespace-pre-wrap">{result.advice}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Visual DNA Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl border border-border p-4 h-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData(result)}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 600}} />
                        <RechartsRadar dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Brightness" value={result.brightness} max={255} color="bg-amber-400" icon={Sun} />
                    <StatCard label="Complexity" value={result.complexity} color="bg-blue-500" icon={Grid} />
                    <StatCard label="Saliency" value={result.saliency} color="bg-purple-500" icon={Activity} />
                    <StatCard label="Symmetry" value={result.symmetry} color="bg-green-500" icon={Zap} />
                    <div className="col-span-2">
                      <StatCard label="Space Ratio" value={result.space} color="bg-slate-400" icon={Maximize} />
                    </div>
                  </div>
                </div>

                {/* 3. Color DNA */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={14} /> Color DNA
                  </h3>
                  <div className="flex h-16 rounded-xl overflow-hidden ring-1 ring-border">
                    {result.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all" style={{backgroundColor: c}} onClick={() => {navigator.clipboard.writeText(c); alert('복사되었습니다!');}} />
                    ))}
                  </div>
                </div>

                {/* 4. Benchmarking Guide & Pinterest */}
                <div className="mt-8 border-t pt-8 border-border/40">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <ImageIcon size={20} className="text-primary"/> Benchmarking Guide
                    </h3>
                    
                    {/*AI 키워드를 핀터레스트 검색어에 녹여내기*/}
                    <button 
                      onClick={() => {
                        const firstKey = result.design_keywords?.[0] || "";
                        const query = encodeURIComponent(`${result.category} ${firstKey} design identity`);
                        window.open(`https://www.pinterest.com/search/pins/?q=${query}`, '_blank');
                      }} 
                      className="text-[11px] flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#E60023] text-white font-bold hover:bg-[#ad001a] transition-all shadow-md active:scale-95"
                    >
                      <ExternalLink size={14} /> Pinterest에서 더보기
                    </button>
                  </div>

                  {result.benchmarking_point && (
                    <div className="text-sm bg-primary/5 p-5 rounded-2xl border border-primary/10 mb-6">
                      <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {result.benchmarking_point}
                      </p>
                    </div>
                  )}

                  <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {result.reference_images?.map((url, i) => (
                      <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden border border-border bg-muted shadow-sm hover:shadow-xl transition-all">
                        <img 
                          src={url} 
                          alt="Ref" 
                          className="w-full h-auto object-cover transition-transform duration-500 hover:scale-110" 
                          onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-100 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-secondary/10">
                <Zap size={32} className="opacity-20 mb-2" />
                <p className="font-medium">분석 대기 중</p>
                <p className="text-xs opacity-60">이미지를 업로드하고 디자인 DNA와 맞춤형 레퍼런스를 확인하세요.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;