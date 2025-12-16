import React from 'react';
import { StoryEntry, FontFamily, FontSize } from '../types';
import { Trash2, Calendar, Book, Image as ImageIcon, MessageCircle, PlayCircle, FileText } from 'lucide-react';

interface StoryCardProps {
  entry: StoryEntry;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({ entry, onDelete, readOnly = false }) => {
  const date = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // Default values if styleConfig is missing
  const fontFamily: FontFamily = entry.styleConfig?.fontFamily || 'basic';
  const fontSize: FontSize = entry.styleConfig?.fontSize || 'medium';

  // Helper to get font class
  const getHeaderFontClass = () => {
    switch (fontFamily) {
      case 'cute': return "font-['Jua']";
      case 'hand': return "font-['Nanum_Pen_Script']";
      case 'dongle': return "font-['Dongle']";
      case 'gamja': return "font-['Gamja_Flower']";
      case 'poor': return "font-['Poor_Story']";
      default: return "font-handwritten"; // Gaegu
    }
  };

  const getBodyFontClass = () => {
    switch (fontFamily) {
      case 'cute': return "font-['Jua']";
      case 'hand': return "font-['Nanum_Pen_Script']";
      case 'dongle': return "font-['Dongle']";
      case 'gamja': return "font-['Gamja_Flower']";
      case 'poor': return "font-['Poor_Story']";
      default: return "font-sans"; // Nanum Gothic
    }
  };

  // Helper to get text size class (scaled relative to base)
  // 5 levels: x-small, small, medium, large, x-large
  const getSizeClass = (baseClass: string) => {
    const sizeMap: Record<string, Record<FontSize, string>> = {
      'text-xs': { 
          'x-small': 'text-[8px]', 
          'small': 'text-[10px]', 
          'medium': 'text-xs', 
          'large': 'text-sm', 
          'x-large': 'text-base' 
      },
      'text-sm': { 
          'x-small': 'text-[10px]', 
          'small': 'text-xs', 
          'medium': 'text-sm', 
          'large': 'text-base', 
          'x-large': 'text-lg' 
      },
      'text-base': { 
          'x-small': 'text-xs', 
          'small': 'text-sm', 
          'medium': 'text-base', 
          'large': 'text-lg', 
          'x-large': 'text-xl' 
      },
      'text-lg': { 
          'x-small': 'text-sm', 
          'small': 'text-base', 
          'medium': 'text-lg', 
          'large': 'text-xl', 
          'x-large': 'text-2xl' 
      },
      'text-xl': { 
          'x-small': 'text-base', 
          'small': 'text-lg', 
          'medium': 'text-xl', 
          'large': 'text-2xl', 
          'x-large': 'text-3xl' 
      },
      'text-2xl': { 
          'x-small': 'text-lg', 
          'small': 'text-xl', 
          'medium': 'text-2xl', 
          'large': 'text-3xl', 
          'x-large': 'text-4xl' 
      },
      'text-3xl': { 
          'x-small': 'text-xl', 
          'small': 'text-2xl', 
          'medium': 'text-3xl', 
          'large': 'text-4xl', 
          'x-large': 'text-5xl' 
      },
      'text-4xl': { 
          'x-small': 'text-2xl', 
          'small': 'text-3xl', 
          'medium': 'text-4xl', 
          'large': 'text-5xl', 
          'x-large': 'text-6xl' 
      },
    };
    
    return sizeMap[baseClass]?.[fontSize] || baseClass;
  };

  const headerFont = getHeaderFontClass();
  const bodyFont = getBodyFontClass();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative transition-all hover:shadow-lg">
      {/* Paper Header Styling */}
      <div className="bg-orange-50 border-b border-orange-100 p-4 flex justify-between items-center">
        <div className={`flex items-center gap-2 text-orange-800 font-bold ${headerFont} ${getSizeClass('text-xl')}`}>
           <Book size={fontSize === 'x-large' ? 28 : (fontSize === 'large' ? 24 : 20)} />
           <span>독서감상문</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-gray-500 flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-orange-100 shadow-sm ${getSizeClass('text-sm')}`}>
            <Calendar size={fontSize === 'x-large' ? 18 : (fontSize === 'large' ? 16 : 14)} />
            {date}
          </div>
          {!readOnly && onDelete && (
            <button 
              onClick={() => onDelete(entry.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
              title="삭제하기"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Title Section */}
        <div className="text-center border-b-2 border-dashed border-gray-100 pb-5">
           <div className="flex flex-wrap items-center justify-center gap-3">
              <h3 className={`font-bold text-gray-800 ${headerFont} ${getSizeClass('text-4xl')}`}>
                {entry.title}
              </h3>
              <a 
                href={entry.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex-shrink-0 inline-flex items-center gap-1.5 font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors ${getSizeClass('text-xs')}`}
                // In StoryCard we usually don't mind printing the link, but if we wanted to hide it on print: data-html2canvas-ignore
              >
                <PlayCircle size={14} /> 원본 영상
              </a>
           </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Scene */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-pink-600 font-bold border-b border-pink-100 pb-2 ${headerFont} ${getSizeClass('text-lg')}`}>
              <ImageIcon size={fontSize === 'x-large' ? 28 : (fontSize === 'large' ? 24 : 20)} />
              <span>기억에 남는 장면</span>
            </div>
            
            <div className="bg-pink-50/30 p-4 rounded-2xl border border-pink-100 h-full flex flex-col gap-4">
              {entry.generatedImageUrl ? (
                <div className="rounded-xl overflow-hidden border-4 border-white shadow-sm rotate-1 hover:rotate-0 transition-transform duration-500 bg-white">
                  <img 
                    src={entry.generatedImageUrl} 
                    alt="Scene" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-white rounded-xl border-2 border-dashed border-pink-200 flex items-center justify-center text-pink-300">
                  <span className={`${getSizeClass('text-sm')}`}>그림이 없어요</span>
                </div>
              )}
              <p className={`text-gray-700 font-medium italic text-center px-2 ${bodyFont} ${getSizeClass('text-sm')}`}>
                "{entry.favoriteScene}"
              </p>
            </div>
          </div>

          {/* Right Column: Summary & Thoughts */}
          <div className="flex flex-col gap-6">
            
            {/* Summary Section */}
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-green-600 font-bold border-b border-green-100 pb-2 ${headerFont} ${getSizeClass('text-lg')}`}>
                <FileText size={fontSize === 'x-large' ? 28 : (fontSize === 'large' ? 24 : 20)} />
                <span>줄거리</span>
              </div>
              <div className={`bg-green-50/30 p-4 rounded-2xl border border-green-100 text-gray-700 leading-relaxed whitespace-pre-wrap ${bodyFont} ${getSizeClass('text-lg')}`}>
                {entry.summary}
              </div>
            </div>

            {/* Thoughts Section */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className={`flex items-center gap-2 text-blue-600 font-bold border-b border-blue-100 pb-2 ${headerFont} ${getSizeClass('text-lg')}`}>
                <MessageCircle size={fontSize === 'x-large' ? 28 : (fontSize === 'large' ? 24 : 20)} />
                <span>나의 생각과 느낌</span>
              </div>
              <div className={`bg-blue-50/30 p-4 rounded-2xl border border-blue-100 text-gray-700 leading-relaxed flex-1 whitespace-pre-wrap ${headerFont} ${getSizeClass('text-lg')}`}>
                {entry.thoughts}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};