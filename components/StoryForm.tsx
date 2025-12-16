import React, { useState } from 'react';
import { Sparkles, Loader2, Youtube, PenTool, Type, Scaling, Palette, GraduationCap } from 'lucide-react';
import { analyzeStoryLink } from '../services/geminiService';
import { extractYouTubeId } from '../utils';
import { YouTubeAnalysisResult, FontFamily, FontSize, DrawingLevel, WritingGrade } from '../types';

interface StoryFormProps {
  onAnalyzeComplete: (videoId: string, url: string, result: YouTubeAnalysisResult) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  drawingLevel: DrawingLevel;
  setDrawingLevel: (level: DrawingLevel) => void;
  writingGrade: WritingGrade;
  setWritingGrade: (grade: WritingGrade) => void;
  currentDraft: { analysis: YouTubeAnalysisResult } | null;
}

export const StoryForm: React.FC<StoryFormProps> = ({ 
  onAnalyzeComplete,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  drawingLevel,
  setDrawingLevel,
  writingGrade,
  setWritingGrade,
  currentDraft
}) => {
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryLength, setSummaryLength] = useState<number>(2);
  const [thoughtsLength, setThoughtsLength] = useState<number>(2);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url) {
        setError('유튜브 링크를 입력해주세요!');
        return;
    }
    const videoId = extractYouTubeId(url);
    if (!videoId) {
        setError('올바른 유튜브 링크가 아니에요.');
        return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Pass writingGrade to the service
      const result = await analyzeStoryLink(url, summaryLength, thoughtsLength, writingGrade);
      onAnalyzeComplete(videoId, url, result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearchYouTube = () => {
    const query = searchQuery.trim();
    const searchUrl = query 
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent('어린이 동화 ' + query)}`
        : 'https://www.youtube.com/results?search_query=어린이+동화';
    
    window.open(searchUrl, '_blank');
  };

  const toggleFontFamily = () => {
    const fonts: FontFamily[] = ['basic', 'cute', 'hand', 'dongle', 'gamja', 'poor'];
    const nextIndex = (fonts.indexOf(fontFamily) + 1) % fonts.length;
    setFontFamily(fonts[nextIndex]);
  };

  const toggleFontSize = () => {
    const sizes: FontSize[] = ['x-small', 'small', 'medium', 'large', 'x-large'];
    const nextIndex = (sizes.indexOf(fontSize) + 1) % sizes.length;
    setFontSize(sizes[nextIndex]);
  };

  const toggleDrawingLevel = () => {
    const levels: DrawingLevel[] = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(drawingLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    setDrawingLevel(levels[nextIndex]);
  };

  const toggleWritingGrade = () => {
    // Cycle 1 to 6
    const nextGrade = (writingGrade % 6) + 1;
    setWritingGrade(nextGrade as WritingGrade);
  };

  const getFontFamilyName = () => {
    switch (fontFamily) {
        case 'basic': return '기본';
        case 'cute': return '주아';
        case 'hand': return '손글씨';
        case 'dongle': return '동글';
        case 'gamja': return '감자꽃';
        case 'poor': return '서툰';
        default: return '기본';
    }
  };

  const getFontSizeName = () => {
    switch (fontSize) {
        case 'x-small': return '아주 작게';
        case 'small': return '작게';
        case 'medium': return '보통';
        case 'large': return '크게';
        case 'x-large': return '아주 크게';
        default: return '보통';
    }
  };

  const getDrawingLevelName = () => {
      switch(drawingLevel) {
          case 'low': return '그림: 하';
          case 'medium': return '그림: 중';
          case 'high': return '그림: 상';
          default: return '그림: 하';
      }
  };

  const getWritingGradeName = () => {
    return `${writingGrade}학년`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-4 border-indigo-200 overflow-hidden">
      <div className="bg-indigo-100 p-4 border-b-2 border-indigo-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-800 font-handwritten flex items-center gap-2">
          <PenTool size={24} />
          동화 검색하기
        </h2>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        
        {/* Style, Drawing, Writing Level Controls - Optimized for single line */}
        <div className="flex w-full gap-1.5 mb-2">
            <button 
                onClick={toggleFontFamily}
                className="flex-1 flex items-center justify-center gap-1 px-1 py-2 bg-white text-gray-700 text-[11px] sm:text-xs font-bold rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition-colors shadow-sm whitespace-nowrap overflow-hidden"
                title="글씨체 변경"
            >
                <Type size={14} className="flex-shrink-0" />
                <span className="truncate">{getFontFamilyName()}</span>
            </button>
            <button 
                onClick={toggleFontSize}
                className="flex-1 flex items-center justify-center gap-1 px-1 py-2 bg-white text-gray-700 text-[11px] sm:text-xs font-bold rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition-colors shadow-sm whitespace-nowrap overflow-hidden"
                title="글자 크기 변경"
            >
                <Scaling size={14} className="flex-shrink-0" />
                <span className="truncate">{getFontSizeName()}</span>
            </button>
            <button 
                onClick={toggleDrawingLevel}
                className="flex-1 flex items-center justify-center gap-1 px-1 py-2 bg-pink-50 text-pink-600 text-[11px] sm:text-xs font-bold rounded-xl border border-pink-200 hover:bg-pink-100 hover:border-pink-300 transition-colors shadow-sm whitespace-nowrap overflow-hidden"
                title="그림 수준 변경"
            >
                <Palette size={14} className="flex-shrink-0" />
                <span className="truncate">{getDrawingLevelName()}</span>
            </button>
            <button 
                onClick={toggleWritingGrade}
                className="flex-1 flex items-center justify-center gap-1 px-1 py-2 bg-green-50 text-green-600 text-[11px] sm:text-xs font-bold rounded-xl border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors shadow-sm whitespace-nowrap overflow-hidden"
                title="글쓰기 수준 변경"
            >
                <GraduationCap size={14} className="flex-shrink-0" />
                <span className="truncate">{getWritingGradeName()}</span>
            </button>
        </div>

        {/* YouTube Search Section */}
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">동화 찾기</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchYouTube()}
                    placeholder="동화 제목을 입력하세요"
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-red-100 bg-white focus:border-red-300 focus:ring focus:ring-red-50 outline-none transition-all placeholder-gray-400 text-gray-700"
                />
                <button
                    type="button"
                    onClick={handleSearchYouTube}
                    className="px-4 py-2 rounded-lg border-2 border-red-100 bg-red-50 text-red-500 font-bold hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap text-sm"
                >
                    <Youtube size={20} />
                    <span>유튜브 검색</span>
                </button>
            </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 ml-1">유튜브 링크 입력 (필수)</label>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:ring focus:ring-indigo-100 outline-none transition-all"
            />
            
            <div className="grid grid-cols-2 gap-2">
               <div className="flex flex-col gap-1">
                   <label className="text-xs font-bold text-gray-500 ml-1">줄거리 길이</label>
                   <select
                        value={summaryLength}
                        onChange={(e) => setSummaryLength(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm font-bold text-center"
                    >
                        {[2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}문장</option>
                        ))}
                    </select>
               </div>
               <div className="flex flex-col gap-1">
                   <label className="text-xs font-bold text-gray-500 ml-1">느낀점 길이</label>
                   <select
                        value={thoughtsLength}
                        onChange={(e) => setThoughtsLength(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm font-bold text-center"
                    >
                        {[2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}문장</option>
                        ))}
                    </select>
               </div>
            </div>

            <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url}
                className="w-full mt-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                <span>독서감상문 만들기</span>
            </button>
          </div>
          {error && <p className="text-red-500 text-sm ml-1 bg-red-50 p-2 rounded-lg inline-block">{error}</p>}
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-700 font-medium leading-relaxed">
            💡 위쪽 검색창에서 동화를 찾아보고,<br/>
            주소(링크)를 복사해서 아래 칸에 붙여넣어주세요.
        </div>
      </div>
    </div>
  );
};