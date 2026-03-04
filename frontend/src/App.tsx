import { useState, type ChangeEvent } from 'react';
import axios from 'axios';


interface MoodDnaResult{
  brightness:number;
  complexity: number; 
  description:string;
  colors:string[];

}
function App() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MoodDnaResult | null > (null) 
  const [isLoading, setIsLoading] = useState(false);
    
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeMood = async () => {
    if (!file) return alert('Please select an image first.');

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file',file);

    try {
      const response = await axios.post('http://localhost:8000/analyze',formData,);
      setResult(response.data);
  }catch (error){
    console.error ("분석 중 에러 발생", error);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">MoodDNA V2</h1>
        <p className="text-center text-gray-500">배경 제거 & 복잡도 분석 탑재</p>

      {/*사진 고르는 구역*/}
      <div className="flex flex-col items-center space-y-4">
        <input 
        type="file"  
        onChange={handleFileChange} 
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        <button
        onClick={analyzeMood}
        disabled={isLoading}
        className={`  w-full py-3 rounded-xl font-bold text-white transition ${
          isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        >
          {isLoading ? '분석 중...': '분석 시작하기'}
        </button>
    </div>
  {/* 결과 보여주는 구역 */}
        {result && (
          <div className="mt-8 space-y-6 border-t pt-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">{result.description}</h2>
              
              {/*분석 수치 표시 그리드 */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="block text-gray-400">밝기 (Brightness)</span>
                    <span className="text-xl font-bold text-gray-700">{result.brightness.toFixed(1)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="block text-gray-400">복잡도 (Complexity)</span>
                    <span className="text-xl font-bold text-blue-600">{result.complexity.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* 5가지 색상 (배경 제거된 정확한 색상) */}
            <div>
                <p className="text-xs text-center text-gray-400 mb-2">추출된 메인 컬러 (배경 제외)</p>
                <div className="flex justify-between items-center px-2">
                {result.colors.map((color, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                    <div 
                        className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm transform hover:scale-110 transition-transform" 
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{color.toUpperCase()}</span>
                    </div>
                ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default App;
