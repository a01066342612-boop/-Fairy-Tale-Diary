import React, { useState, useEffect } from 'react';
import { StoryForm } from './components/StoryForm';
import { StoryWorkspace } from './components/StoryWorkspace';
import { StoryEntry, YouTubeAnalysisResult, FontFamily, FontSize, DrawingLevel, WritingGrade } from './types';
import { BookOpen, Library, Maximize2, Minimize2 } from 'lucide-react';

const App: React.FC = () => {
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [currentDraft, setCurrentDraft] = useState<{
    videoId: string;
    url: string;
    analysis: YouTubeAnalysisResult;
  } | null>(null);
  
  // Style State
  const [fontFamily, setFontFamily] = useState<FontFamily>('basic');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [drawingLevel, setDrawingLevel] = useState<DrawingLevel>('low');
  // New: Writing Grade State (default 1)
  const [writingGrade, setWritingGrade] = useState<WritingGrade>(1);

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Load entries from local storage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('fairyTaleEntries');
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error("Failed to parse saved entries");
      }
    }
  }, []);

  // Save entries to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('fairyTaleEntries', JSON.stringify(entries));
  }, [entries]);

  const handleAnalysisComplete = (videoId: string, url: string, result: YouTubeAnalysisResult) => {
    setCurrentDraft({
      videoId,
      url,
      analysis: result
    });
    // Reset basic styles on new analysis, but keep grade level preference if user set it
    setFontFamily('basic');
    setFontSize('medium');
    setDrawingLevel('low');
    // Note: We deliberately do NOT reset writingGrade here so users can keep their grade setting across multiple books.
  };

  const handleSaveEntry = (entry: StoryEntry) => {
    setEntries(prev => {
        const exists = prev.find(e => e.id === entry.id);
        if (exists) {
            return prev.map(e => e.id === entry.id ? entry : e);
        }
        return [entry, ...prev];
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('정말 이 일기를 삭제할까요?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#FFF7ED]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-orange-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-orange-500" size={32} />
            <h1 className="text-2xl md:text-3xl font-bold text-orange-600 font-handwritten">
              동화나라 일기장
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={toggleFocusMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                    isFocusMode 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
                {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {isFocusMode ? '전체 메뉴 보기' : '글쓰기 창만 보기'}
            </button>
            <div className="text-sm font-bold text-orange-400 font-handwritten hidden sm:block">
                오늘도 재미있는 책을 읽어봐요!
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Search & Analyze */}
            <section className={`transition-all duration-300 ${
                isFocusMode ? 'hidden' : 'lg:col-span-4 lg:block'
            } space-y-4 lg:sticky lg:top-24`}>
               <StoryForm 
                  onAnalyzeComplete={handleAnalysisComplete}
                  fontFamily={fontFamily}
                  setFontFamily={setFontFamily}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  drawingLevel={drawingLevel}
                  setDrawingLevel={setDrawingLevel}
                  writingGrade={writingGrade}
                  setWritingGrade={setWritingGrade}
                  currentDraft={currentDraft}
               />
            </section>

            {/* Right Column: Workspace */}
            <section className={`transition-all duration-300 ${
                isFocusMode ? 'lg:col-span-12' : 'lg:col-span-8'
            } space-y-8`}>
                
                <div>
                   <div className="mb-3 flex items-center gap-2 text-orange-800 font-bold font-handwritten text-xl">
                      <Library size={24} />
                      독서감상문 쓰기
                   </div>
                   <StoryWorkspace 
                      initialData={currentDraft} 
                      onSave={handleSaveEntry}
                      savedEntries={entries}
                      onDeleteEntry={handleDeleteEntry}
                      fontFamily={fontFamily}
                      fontSize={fontSize}
                      drawingLevel={drawingLevel}
                      writingGrade={writingGrade}
                   />
                </div>
            </section>
        </div>
      </main>
      
      <footer className="text-center py-8 text-orange-300 text-sm font-handwritten mt-8">
        © 2024 동화나라 일기장 - 아이들을 위한 꿈과 희망의 기록
      </footer>
    </div>
  );
};

export default App;