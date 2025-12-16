import React, { useState, useEffect, useRef } from 'react';
import { StoryEntry, YouTubeAnalysisResult, FontFamily, FontSize, DrawingLevel, WritingGrade } from '../types';
import { generateId, base64ToArrayBuffer } from '../utils';
import { generateSceneImage, generateStorySpeech } from '../services/geminiService';
import { Book, Calendar, PlayCircle, Image as ImageIcon, FileText, MessageCircle, Palette, Loader2, Download, RefreshCw, Eye, Pencil, Volume2, StopCircle } from 'lucide-react';
import { StoryCard } from './StoryCard';
// @ts-ignore
import html2canvas from 'html2canvas';

interface StoryWorkspaceProps {
  initialData: {
    videoId: string;
    url: string;
    analysis: YouTubeAnalysisResult;
  } | null;
  onSave: (entry: StoryEntry) => void;
  savedEntries: StoryEntry[];
  onDeleteEntry: (id: string) => void;
  fontFamily: FontFamily;
  fontSize: FontSize;
  drawingLevel: DrawingLevel;
  writingGrade: WritingGrade;
}

export const StoryWorkspace: React.FC<StoryWorkspaceProps> = ({ 
  initialData, 
  onSave, 
  fontFamily,
  fontSize,
  drawingLevel,
  writingGrade
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [favoriteScene, setFavoriteScene] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio State for Summary
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);
  const [isGeneratingSummarySpeech, setIsGeneratingSummarySpeech] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Preview Mode State
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // State for loaded entry management (internal tracking for edit mode)
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [loadedVideoUrl, setLoadedVideoUrl] = useState<string>('');
  const [loadedVideoId, setLoadedVideoId] = useState<string>('');
  
  // Refs for capture and auto-resize
  const workspaceRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const thoughtsRef = useRef<HTMLTextAreaElement>(null);
  
  // When initialData changes (new analysis from sidebar), reset everything and use that data
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.analysis.title);
      setSummary(initialData.analysis.summary);
      setFavoriteScene(initialData.analysis.recommendedScene);
      setThoughts(initialData.analysis.recommendedThoughts);
      setGeneratedImage(null);
      
      // Reset loaded state because this is a new "Draft"
      setLoadedId(null);
      setLoadedVideoUrl(initialData.url);
      setLoadedVideoId(initialData.videoId);

      setError(null);
      setIsPreviewMode(false); // Reset to edit mode
      stopAudio(); // Stop any previous audio
    }
  }, [initialData]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Auto-resize textareas
  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.style.height = 'auto';
      summaryRef.current.style.height = `${summaryRef.current.scrollHeight}px`;
    }
  }, [summary, fontFamily, fontSize]);

  useEffect(() => {
    if (thoughtsRef.current) {
      thoughtsRef.current.style.height = 'auto';
      thoughtsRef.current.style.height = `${thoughtsRef.current.scrollHeight}px`;
    }
  }, [thoughts, fontFamily, fontSize]);

  // Styles helpers for WYSIWYG editing in textarea
  const getHeaderFontClass = () => {
    switch (fontFamily) {
      case 'cute': return "font-['Jua']";
      case 'hand': return "font-['Nanum_Pen_Script']";
      case 'dongle': return "font-['Dongle']";
      case 'gamja': return "font-['Gamja_Flower']";
      case 'poor': return "font-['Poor_Story']";
      default: return "font-handwritten";
    }
  };

  const getBodyFontClass = () => {
    switch (fontFamily) {
      case 'cute': return "font-['Jua']";
      case 'hand': return "font-['Nanum_Pen_Script']";
      case 'dongle': return "font-['Dongle']";
      case 'gamja': return "font-['Gamja_Flower']";
      case 'poor': return "font-['Poor_Story']";
      default: return "font-sans";
    }
  };

  const getTextSizeClass = (baseSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl') => {
     const sizeMap: Record<string, Record<FontSize, string>> = {
        'sm': { 'x-small': 'text-[10px]', 'small': 'text-xs', 'medium': 'text-sm', 'large': 'text-base', 'x-large': 'text-lg' },
        'base': { 'x-small': 'text-xs', 'small': 'text-sm', 'medium': 'text-base', 'large': 'text-lg', 'x-large': 'text-xl' },
        'lg': { 'x-small': 'text-sm', 'small': 'text-base', 'medium': 'text-lg', 'large': 'text-xl', 'x-large': 'text-2xl' },
        'xl': { 'x-small': 'text-base', 'small': 'text-lg', 'medium': 'text-xl', 'large': 'text-2xl', 'x-large': 'text-3xl' },
        '2xl': { 'x-small': 'text-lg', 'small': 'text-xl', 'medium': 'text-2xl', 'large': 'text-3xl', 'x-large': 'text-4xl' },
        '3xl': { 'x-small': 'text-xl', 'small': 'text-2xl', 'medium': 'text-3xl', 'large': 'text-4xl', 'x-large': 'text-5xl' },
        '4xl': { 'x-small': 'text-2xl', 'small': 'text-3xl', 'medium': 'text-4xl', 'large': 'text-5xl', 'x-large': 'text-6xl' },
      };
      return sizeMap[baseSize]?.[fontSize] || `text-${baseSize}`;
  };

  const handleDrawScene = async () => {
    if (!favoriteScene && !summary) {
      setError('장면을 설명하거나 내용이 있어야 그림을 그릴 수 있어요!');
      return;
    }
    
    setIsDrawing(true);
    setError(null);
    
    try {
      const imageBase64 = await generateSceneImage(favoriteScene, title, summary, drawingLevel);
      setGeneratedImage(imageBase64);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDrawing(false);
    }
  };

  // Audio Logic
  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // ignore if already stopped
        }
        sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
        // We don't necessarily need to close it, but suspending or closing saves resources
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
    }
    setIsSpeakingSummary(false);
  };

  const handlePlaySummary = async () => {
    if (isSpeakingSummary) {
        stopAudio();
        return;
    }

    if (!summary) {
        setError("읽어줄 줄거리 내용이 없어요.");
        return;
    }

    setIsGeneratingSummarySpeech(true);
    setError(null);

    try {
        const base64Audio = await generateStorySpeech(summary);
        
        // Setup Audio Context safely
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        // Close existing context if any to avoid stacking or limit issues
        if (audioContextRef.current) {
            await audioContextRef.current.close();
        }
        
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Important: Resume context to comply with autoplay policies
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        const audioBuffer = await audioContext.decodeAudioData(base64ToArrayBuffer(base64Audio));
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
            setIsSpeakingSummary(false);
            sourceNodeRef.current = null;
        };
        
        sourceNodeRef.current = source;
        source.start(0);
        setIsSpeakingSummary(true);

    } catch (err) {
        console.error(err);
        setError("음성을 들려주는데 실패했어요. 다시 시도해주세요.");
        stopAudio();
    } finally {
        setIsGeneratingSummarySpeech(false);
    }
  };

  const getCurrentEntry = (): StoryEntry => {
     let finalSceneText = favoriteScene;
    if (!finalSceneText && generatedImage) {
        finalSceneText = "AI가 줄거리를 바탕으로 상상하여 그린 장면입니다.";
    }

    // Maintain existing ID if loaded, or generate new one
    return {
      id: loadedId || generateId(),
      videoUrl: loadedVideoUrl,
      videoId: loadedVideoId,
      title: title || '제목 없음',
      summary: summary || "줄거리 없음",
      favoriteScene: finalSceneText || '내용 없음',
      thoughts: thoughts || '내용 없음',
      generatedImageUrl: generatedImage || undefined,
      styleConfig: { fontFamily, fontSize, drawingLevel, writingGrade },
      createdAt: Date.now()
    };
  };

  const generateCardImage = async () => {
    // Determine which element to print based on mode
    // We safely use the hidden printRef
    if (!printRef.current) return null;
    return await html2canvas(printRef.current, {
        scale: 2, // High quality
        backgroundColor: null,
        logging: false,
        useCORS: true,
    });
  };

  const handleDownloadImage = async () => {
    setIsSavingImage(true);
    try {
      const canvas = await generateCardImage();
      if (!canvas) throw new Error("Canvas generation failed");
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${title || '독서감상문'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onSave(getCurrentEntry());
    } catch (err) {
      console.error("Image save failed", err);
      setError("이미지 저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsSavingImage(false);
    }
  };

  // Determine if we have active content (either from AI analysis or loaded from library)
  const hasContent = initialData !== null || loadedId !== null;

  if (!hasContent) {
    return (
      <div className="bg-white rounded-xl shadow-md border-2 border-dashed border-orange-200 p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="flex flex-col items-center gap-2">
            <Book size={48} className="text-orange-200" />
            <p className="text-xl font-handwritten">왼쪽에서 동화를 찾아 요약해보세요!</p>
            <p className="text-sm">여기에 독서감상문 종이가 나타납니다.</p>
        </div>
      </div>
    );
  }

  const date = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <>
        {/* Full Screen Preview Mode */}
        {isPreviewMode && (
            <div className="fixed inset-0 z-50 bg-[#FFF7ED] overflow-y-auto animate-in fade-in duration-200">
                <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-screen flex flex-col">
                   {/* Toolbar */}
                   <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-0 bg-[#FFF7ED]/95 backdrop-blur-sm p-4 rounded-xl border border-orange-100 shadow-sm z-10">
                       <div className="flex items-center gap-2 text-orange-800 font-bold text-xl font-handwritten">
                           <Eye size={24} />
                           <span>완성된 모습 확인하기</span>
                       </div>
                       
                       <div className="flex gap-3">
                           <button
                                onClick={handleDownloadImage}
                                disabled={isSavingImage}
                                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 text-sm md:text-base"
                            >
                                {isSavingImage ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                저장하기
                            </button>
                           <button 
                                onClick={() => setIsPreviewMode(false)}
                                className="px-6 py-2.5 bg-white text-gray-700 border-2 border-orange-100 hover:bg-orange-50 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 text-sm md:text-base"
                            >
                                <Pencil size={18} />
                                다시 수정하기
                            </button>
                       </div>
                   </div>

                   {/* The Card */}
                   <div className="flex-1 flex justify-center pb-12">
                       <div className="w-full shadow-2xl rounded-xl overflow-hidden ring-1 ring-gray-900/5 bg-white">
                            <StoryCard entry={getCurrentEntry()} readOnly={true} />
                       </div>
                   </div>
                </div>
            </div>
        )}

        {/* Edit Mode Workspace (Hidden when preview is on) */}
        {!isPreviewMode && (
            <div ref={workspaceRef} className="bg-white rounded-xl shadow-xl border border-orange-200 overflow-hidden relative transition-all ring-4 ring-orange-50">
            {/* Header */}
            <div className="bg-orange-100 border-b border-orange-200 p-4 flex justify-between items-center">
                <div className={`flex items-center gap-2 text-orange-900 font-bold ${getHeaderFontClass()} ${getTextSizeClass('xl')}`}>
                <Book size={20} />
                <span>독서감상문 쓰기</span>
                </div>
                <div className="flex items-center gap-3">
                <div className={`text-gray-600 flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full border border-orange-100 ${getTextSizeClass('sm')}`}>
                    <Calendar size={14} />
                    {date}
                </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Title Input with Label and Inline Button */}
                <div className="border-b-2 border-dashed border-gray-100 pb-5">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                        {/* Label */}
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100 flex-shrink-0">
                            <span className="text-lg">👑</span>
                            <span className="font-bold text-orange-800 font-handwritten whitespace-nowrap">동화 제목</span>
                        </div>
                        
                        {/* Input & Button Container */}
                        <div className="flex-1 w-full flex items-center justify-center gap-2">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`flex-1 w-full text-center font-bold text-gray-800 border-none focus:ring-2 focus:ring-orange-200 rounded-lg py-2 bg-transparent placeholder-gray-300 ${getHeaderFontClass()} ${getTextSizeClass('2xl')}`}
                                placeholder="동화 제목을 입력하세요"
                            />
                            
                            {/* Video Button (Next to title input) */}
                            {loadedVideoUrl && (
                                <a 
                                    href={loadedVideoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex-shrink-0 inline-flex items-center gap-1.5 font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors ${getTextSizeClass('sm')}`}
                                    data-html2canvas-ignore
                                >
                                    <PlayCircle size={16} /> 
                                    <span className="hidden sm:inline">영상 보기</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Scene & Drawing */}
                <div className="space-y-3">
                    <div className={`flex items-center justify-between border-b border-pink-100 pb-2`}>
                        <div className={`flex items-center gap-2 text-pink-600 font-bold ${getHeaderFontClass()} ${getTextSizeClass('lg')}`}>
                            <ImageIcon size={20} />
                            <span>기억에 남는 장면</span>
                        </div>
                        <button
                        type="button"
                        onClick={handleDrawScene}
                        disabled={isDrawing}
                        className="text-xs bg-pink-500 text-white hover:bg-pink-600 px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                        data-html2canvas-ignore // Don't print the draw button
                        >
                        {isDrawing ? <Loader2 className="animate-spin" size={14} /> : <Palette size={14} />}
                        {generatedImage ? "다시 그리기" : "그림 그리기"}
                        </button>
                    </div>
                    
                    <div className="bg-pink-50/30 p-4 rounded-2xl border border-pink-100 flex flex-col gap-4">
                    <div className="relative group min-h-[200px] flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-pink-200 overflow-hidden">
                        {generatedImage ? (
                            <>
                                <img src={generatedImage} alt="Scene" className="w-full h-auto object-cover" />
                                <button
                                    onClick={() => setGeneratedImage(null)}
                                    className="absolute top-2 right-2 bg-white/80 text-red-500 p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                                    data-html2canvas-ignore
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </>
                        ) : (
                            <span className="text-pink-300 text-sm font-handwritten">
                                {isDrawing ? "그림을 그리는 중..." : "버튼을 눌러 그림을 그려보세요!"}
                            </span>
                        )}
                    </div>
                    <textarea
                        value={favoriteScene}
                        onChange={(e) => setFavoriteScene(e.target.value)}
                        placeholder="어떤 장면이 기억에 남나요?"
                        rows={3}
                        className={`w-full bg-white/50 border border-pink-200 rounded-lg p-3 focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none resize-none font-medium text-gray-700 ${getBodyFontClass()} ${getTextSizeClass('sm')}`}
                    />
                    </div>
                </div>

                {/* Right: Summary & Thoughts */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-green-600 font-bold border-b border-green-100 pb-2 ${getHeaderFontClass()} ${getTextSizeClass('lg')}`}>
                        <FileText size={20} />
                        <span>줄거리 쓰기</span>
                        {/* Audio Button for Summary */}
                        <button 
                            onClick={handlePlaySummary}
                            disabled={isGeneratingSummarySpeech}
                            className="ml-2 text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-full p-1 transition-colors disabled:opacity-50"
                            title="줄거리 듣기"
                            data-html2canvas-ignore
                        >
                             {isGeneratingSummarySpeech ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : isSpeakingSummary ? (
                                <StopCircle size={16} />
                            ) : (
                                <Volume2 size={16} />
                            )}
                        </button>
                    </div>
                    <textarea
                        ref={summaryRef}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="이야기의 줄거리를 적어주세요."
                        className={`w-full bg-green-50/30 border border-green-200 rounded-xl p-3 focus:ring-2 focus:ring-green-200 focus:border-green-300 outline-none resize-none text-gray-700 leading-relaxed overflow-hidden ${getBodyFontClass()} ${getTextSizeClass('lg')}`}
                        style={{ minHeight: '150px' }}
                    />
                    </div>

                    <div className="space-y-2 flex flex-col">
                    <div className={`flex items-center gap-2 text-blue-600 font-bold border-b border-blue-100 pb-2 ${getHeaderFontClass()} ${getTextSizeClass('lg')}`}>
                        <MessageCircle size={20} />
                        <span>나의 생각과 느낌 쓰기</span>
                    </div>
                    <textarea
                        ref={thoughtsRef}
                        value={thoughts}
                        onChange={(e) => setThoughts(e.target.value)}
                        placeholder="이 이야기를 읽고 어떤 생각이 들었나요?"
                        className={`w-full bg-blue-50/30 border border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none resize-none text-gray-700 leading-relaxed overflow-hidden ${getHeaderFontClass()} ${getTextSizeClass('lg')}`}
                        style={{ minHeight: '120px' }}
                    />
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}

        {error && <p className="mt-4 text-center text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}

        {/* Action Buttons (Only visible in Edit Mode) */}
        {!isPreviewMode && (
            <div className="flex gap-4 mt-6">
                <button
                    onClick={() => setIsPreviewMode(true)}
                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <Eye size={24} />
                    완성된 모습 보기 (미리보기)
                </button>
                <button
                    onClick={handleDownloadImage}
                    disabled={isSavingImage}
                    className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isSavingImage ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                    파일로 저장하기 (이미지)
                </button>
            </div>
        )}

        {/* Hidden Container for Image Generation (Always exists for html2canvas) */}
        <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '1200px' }} ref={printRef}>
             <StoryCard entry={getCurrentEntry()} readOnly={true} />
        </div>
    </>
  );
};