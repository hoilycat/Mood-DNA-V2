import { useState, type ChangeEvent } from 'react';
import axios from 'axios';
import { Upload, ImageIcon, Loader2 } from 'lucide-react'; // 아이콘 사용을 위해 설치 필요 없으면 텍스트로 대체됨

interface MoodDnaResult {
  brightness: number;
  complexity: number;
  description: string;
  colors: string[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // 이미지 미리보기용
  const [result, setResult] = useState<MoodDnaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const analyzeMood = async () => {
    if (!file) return alert('이미지를 먼저 선택해주세요.');

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/analyze', formData);
      setResult(response.data);
    } catch (error) {
      console.error("분석 중 에러 발생", error);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* 왼쪽: 이미지 미리보기 영역 */}
        <div className="w-full md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain rounded-xl shadow-md z-10 transition-transform duration-500 group-hover:scale-105" 
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center z-10">
              <ImageIcon size={64} className="mb-4 opacity-50" />
              <p>이미지를 업로드하면 미리보기가 표시됩니다</p>
            </div>
          )}
          {/* 배경 장식 (블러 효과) */}
          {preview && (
            <div 
              className="absolute inset-0 blur-3xl opacity-30 z-0" 
              style={{ backgroundImage: `url(${preview})`, backgroundSize: 'cover' }} 
            />
          )}
        </div>

        {/* 오른쪽: 컨트롤 & 결과 패널 */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Mood<span className="text-blue-600">DNA</span>
            </h1>
            <p className="text-gray-500 font-medium">Design Analysis AI</p>
          </div>

          {/* 파일 업로드 버튼 */}
          <div className="space-y-4 mb-8">
            <label className="flex items-center justify-center w-full h-16 px-4 transition bg-white border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 group">
              <div className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                <span className="font-medium text-gray-500 group-hover:text-blue-600">
                  {file ? file.name : "클릭해서 이미지 업로드"}
                </span>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>

            <button
              onClick={analyzeMood}
              disabled={isLoading || !file}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all transform hover:-translate-y-1 ${
                isLoading || !file
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" /> 분석 중...
                </span>
              ) : '✨ DNA 분석 시작'}
            </button>
          </div>

          {/* 분석 결과 */}
          {result && (
            <div className="animate-fade-in-up space-y-8">
              {/* 무드 설명 */}
              <div className="text-left border-l-4 border-blue-500 pl-4 py-1">
                <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                  {result.description.split(":")[0]}
                </h2>
                <p className="text-gray-500 mt-1 font-medium">
                  {result.description.split(":")[1]}
                </p>
              </div>

              {/* 수치 데이터 (그리드) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Brightness</span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-bold text-gray-800">{result.brightness.toFixed(0)}</span>
                    <span className="text-sm text-gray-400 mb-1">/ 255</span>
                  </div>
                  {/* 게이지 바 */}
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                    <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(result.brightness / 255) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Complexity</span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-3xl font-bold text-blue-600">{result.complexity.toFixed(0)}</span>
                    <span className="text-sm text-gray-400 mb-1">/ 100</span>
                  </div>
                   {/* 게이지 바 */}
                   <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${result.complexity}%` }}></div>
                  </div>
                </div>
              </div>

              {/* 컬러 팔레트 */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Main Palette</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Background Removed</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {result.colors.map((color, index) => (
                    <div key={index} className="group relative flex flex-col items-center">
                      <div 
                        className="w-full h-16 rounded-xl shadow-sm border border-gray-100 transition-transform transform group-hover:-translate-y-2 cursor-pointer" 
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <span className="mt-2 text-[10px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;