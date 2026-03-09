import { useState, useEffect, type ChangeEvent } from 'react';
import axios from 'axios';
import { ImageIcon, Loader2, Sparkles, Activity, Grid, Palette, Sun, Moon, Zap } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Radar as RechartsRadar } from 'recharts';

interface MoodDnaResult {
  brightness: number;
  complexity: number;
  saliency: number;
  symmetry: number;
  space: number;
  colors: string[];
  category: string;
  mood: string;
  advice: string;
  benchmarking_point: string;
  unsplash_keywords: string[];
  suggested_palette: string[];
  reference_images: string[];
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
    { subject: '시각 집중도', A: res.saliency },
    { subject: '대칭성', A: res.symmetry },
    { subject: '여백 비율', A: res.space },
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const analyzeMood = async () => {
    if (!file) return alert('이미지를 먼저 선택해주세요.');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remove_bg', String(removeBg));

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData);
      // 📍 백엔드에서 온 JSON 덩어리를 그대로 상태에 저장!
      setResult(response.data);
    } catch (error) {
      console.error("분석 중 에러 발생", error);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">M</div>
            <span className="text-xl font-bold tracking-tight">Mood<span className="text-primary">DNA</span></span>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Upload & Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card rounded-3xl border border-border shadow-sm p-6 overflow-hidden relative group">
              <div className="aspect-square w-full bg-secondary/50 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center relative overflow-hidden transition-all hover:border-primary/50">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-contain z-10" />
                    <div className="absolute inset-0 blur-3xl opacity-20 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${preview})` }} />
                  </>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer z-20">
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <input type="checkbox" id="bg-toggle" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                  <label htmlFor="bg-toggle" className="text-sm font-medium cursor-pointer flex-1">배경 제거 (Background Removal)</label>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">AI</span>
                </div>
                <button onClick={analyzeMood} disabled={isLoading || !file} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {isLoading ? 'Analyzing DNA...' : 'Analyze Image'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis Results */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              // 괄호가 열리는 결과화면 시작! (A 영역)
              <div className="space-y-6 animate-in">
                
                {/* 1. AI Insight Card (JSON 데이터 직접 바인딩) */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-purple-500"></div>
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Sparkles className="text-purple-500" size={20} /> AI Consultant Insight
                  </h2>
                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <div className="bg-secondary/30 p-4 rounded-xl">
                      <span className="font-bold text-foreground block mb-1">판별된 분야: {result.category}</span>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl">
                      <span className="font-bold text-foreground block mb-1">핵심 인상 (Mood)</span>
                      <p className="whitespace-pre-wrap">{result.mood}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl">
                      <span className="font-bold text-foreground block mb-1">분야별 심층 조언 (Expert Advice)</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{result.advice}</p>
                    </div>
                  </div>
                </div>

                {/* 2. DNA Chart & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2"><Activity size={16} /> Visual DNA</h3>
                    <div className="h-64 w-full flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getChartData(result)}>
                          <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <RechartsRadar name="Mood" dataKey="A" stroke={isDark ? "#818cf8" : "#2563eb"} strokeWidth={3} fill={isDark ? "#818cf8" : "#3b82f6"} fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Sun size={16}/> Brightness</span>
                        <span className="text-2xl font-bold font-mono">{result.brightness.toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(result.brightness/255)*100}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Grid size={16}/> Complexity</span>
                        <span className="text-2xl font-bold font-mono text-primary">{result.complexity.toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${result.complexity}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">시각 집중도</span>
                      <span className="text-2xl font-bold font-mono">{result.saliency.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.saliency}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">대칭성</span>
                      <span className="text-2xl font-bold font-mono">{result.symmetry.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.symmetry}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">여백 비율</span>
                      <span className="text-2xl font-bold font-mono">{result.space.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: `${result.space}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* 3. Color Palette */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2"><Palette size={16} /> Extracted Palette</h3>
                  <div className="flex w-full h-24 rounded-xl overflow-hidden ring-1 ring-border shadow-inner">
                    {result.colors.map((color, idx) => (
                      <div key={idx} className="flex-1 h-full flex items-end justify-center pb-2 group cursor-pointer transition-all hover:flex-[1.5]" style={{ backgroundColor: color }} onClick={() => { navigator.clipboard.writeText(color); alert(`Copied: ${color}`); }}>
                        <span className="text-[10px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. AI 추천 컬러칩 영역 */}
                <div className="rounded-2xl border p-6 mt-6 border-primary/20 bg-primary/5 shadow-inner">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <Palette size={18} className="text-primary" /> AI Suggested Palette
                  </h3>
                  <div className="flex justify-around">
                    {result.suggested_palette?.map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-full shadow-lg border-2 border-white dark:border-gray-800 transition-transform hover:scale-110 cursor-pointer" 
                          style={{ backgroundColor: color }}
                          onClick={() => { navigator.clipboard.writeText(color); alert('색상 코드가 복사되었습니다!'); }}
                        />
                        <span className="text-[10px] font-mono opacity-70">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 핀터레스트풍 레퍼런스 갤러리 */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-primary" /> Benchmarking Guide
                  </h3>

                  {/* 벤치마킹 포인트 출력 구역*/}
                  {result.benchmarking_point && (
                  <div className="text-sm text-muted-foreground mb-6 bg-primary/5 p-5 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Master's Guide</span>
                      <span className="font-bold text-foreground">완성도를 높이는 벤치마킹 포인트</span>
                    </div>
                    {/* whitespace-pre-wrap을 넣어 줄바꿈이 보이게 함 */}
                    <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {result.benchmarking_point}
                    </p>
                  </div>
                )}

                  <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {result.reference_images?.map((url:string, idx: number) => (
                      <div key={idx} className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-border">
                        <img src={url} alt="Inspiration" className="w-full h-auto object-cover" />
                      </div>
                    ))}
                  </div>
                </div>


              </div> //결과 화면 종료 (space-y-6 div)
            ) : (
              // 괄호가 닫히고 ":" 뒤에 오는 빈 상태 (B 영역)
              <div className="h-full min-h-100 flex flex-col items-center justify-center text-muted-foreground space-y-4 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/20">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
                  <Zap size={32} className="opacity-20" />
                </div>
                <p className="text-lg font-medium">Ready to analyze</p>
                <p className="text-sm max-w-xs text-center opacity-70">
                  이미지를 업로드하고 AI가 분석한 디자인 DNA와 추천 팔레트를 확인해보세요.
                </p>
              </div>
            )}
          </div>
         
        </div>
      </main>
    </div>
  );
}

export default App;