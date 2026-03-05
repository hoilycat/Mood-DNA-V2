import { useState, useEffect, type ChangeEvent } from 'react';
import axios from 'axios';
import { Upload, ImageIcon, Loader2 } from 'lucide-react'; // 아이콘 사용을 위해 설치 필요 없으면 텍스트로 대체됨
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Sparkles, Activity, Grid, Maximize, Palette, Sun, Moon, Zap } from 'lucide-react';


interface MoodDnaResult {
  brightness: number;
  complexity: number;
  saliency: number;
  symmetry: number;
  space: number;
  description: string;
  colors: string[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // 이미지 미리보기용
  const [result, setResult] = useState<MoodDnaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removeBg, setRemoveBg] = useState(false); // 배경 제거 옵션
  const [isDark, setIsDark] = useState(true);

  const getChartData = (result: MoodDnaResult) => [
    {subject: '밝기', A: (result.brightness / 255) * 100, fullMark: 100},
    {subject: '복잡도', A: result.complexity, fullMark: 100},
    {subject: '시각 집중도', A: result.saliency, fullMark: 100},
    {subject: '대칭성', A: result.symmetry, fullMark: 100},
    {subject: '여백 비율', A: result.space, fullMark: 100},
  ]

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // 이미지 미리보기 URL 생성
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setResult(null); // 새 파일 올리면 기존 결과 초기화
    }
  };

  // 분석 함수
  const analyzeMood = async () => {
    if (!file) return alert('이미지를 먼저 선택해주세요.');

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remove_bg', String(removeBg));

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData);
      setResult(response.data);
    } catch (error) {
      console.error("분석 중 에러 발생", error);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } 
  }, [isDark]);

 return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary selection:text-white">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">
              M
            </div>
            <span className="text-xl font-bold tracking-tight">Mood<span className="text-primary">DNA</span></span>
          </div>
          
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
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
              {/* 이미지 미리보기 영역 */}
              <div className="aspect-square w-full bg-secondary/50 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center relative overflow-hidden transition-all hover:border-primary/50">
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-contain z-10" />
                    <div 
                      className="absolute inset-0 blur-3xl opacity-20 z-0 bg-cover bg-center" 
                      style={{ backgroundImage: `url(${preview})` }} 
                    />
                  </>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  </div>
                )}
                
                {/* 파일 인풋 (투명하게 덮기) */}
                <label className="absolute inset-0 cursor-pointer">
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>

              {/* 컨트롤 영역 */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                   <input 
                      type="checkbox" 
                      id="bg-toggle" 
                      checked={removeBg} 
                      onChange={(e) => setRemoveBg(e.target.checked)}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                  <label htmlFor="bg-toggle" className="text-sm font-medium cursor-pointer flex-1">
                      배경 제거 (Background Removal)
                  </label>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">AI</span>
                </div>

                <button
                  onClick={analyzeMood}
                  disabled={isLoading || !file}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {isLoading ? 'Analyzing DNA...' : 'Analyze Image'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis Results */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <div className="space-y-6 animate-in">
                
                {/* 1. AI Insight Card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                   <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                     <Sparkles className="text-purple-500" size={20} /> AI Consultant Insight
                   </h2>
                   <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      {result.description.split('\n').filter(line => line.trim() !== "").map((line, idx) => {
                          const [title, content] = line.split(":");
                          return (
                            <div key={idx} className="bg-secondary/30 p-4 rounded-xl">
                              <span className="font-bold text-foreground block mb-1">{title}</span>
                              {content}
                            </div>
                          )
                      })}
                   </div>
                </div>

                {/* 2. DNA Chart & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Radar Chart */}
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} /> Visual DNA
                    </h3>
                    <div className="h-64 w-full flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getChartData(result)}>
                          <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Mood"
                            dataKey="A"
                            stroke={isDark ? "#818cf8" : "#2563eb"}
                            strokeWidth={3}
                            fill={isDark ? "#818cf8" : "#3b82f6"}
                            fillOpacity={0.4}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="space-y-4">
                     {/* Brightness */}
                    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Sun size={16}/> Brightness</span>
                            <span className="text-2xl font-bold font-mono">{result.brightness.toFixed(0)}</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(result.brightness/255)*100}%` }}></div>
                        </div>
                    </div>

                    {/* Complexity */}
                    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Grid size={16}/> Complexity</span>
                            <span className="text-2xl font-bold font-mono text-primary">{result.complexity.toFixed(0)}</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${result.complexity}%` }}></div>
                        </div>
                    </div>

                     {/* Space Ratio */}
                     <div className="bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Maximize size={16}/> Space Ratio</span>
                            <span className="text-2xl font-bold font-mono">{result.space.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.space}%` }}></div>
                        </div>
                    </div>
                  </div>
                </div>

                {/* 3. Color Palette */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Palette size={16} /> Extracted Palette
                    </h3>
                    <div className="flex w-full h-24 rounded-xl overflow-hidden ring-1 ring-border shadow-inner">
                        {result.colors.map((color, idx) => (
                            <div 
                                key={idx} 
                                className="flex-1 h-full flex items-end justify-center pb-2 group cursor-pointer transition-all hover:flex-[1.5]"
                                style={{ backgroundColor: color }}
                                title={color}
                                onClick={() => {
                                    navigator.clipboard.writeText(color);
                                    alert(`Copied: ${color}`);
                                }}
                            >
                                <span className="text-[10px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                    {color}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

              </div>
            ) : (
                // 빈 상태 (Empty State)
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground space-y-4 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/20">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
                        <Zap size={32} className="opacity-20" />
                    </div>
                    <p className="text-lg font-medium">Ready to analyze</p>
                    <p className="text-sm max-w-xs text-center opacity-70">
                        Upload an image to see its Design DNA, including brightness, complexity, and color palette.
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