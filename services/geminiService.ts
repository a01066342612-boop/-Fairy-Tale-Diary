import { GoogleGenAI } from "@google/genai";
import { YouTubeAnalysisResult, DrawingLevel } from "../types";
import { extractYouTubeId } from "../utils";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeStoryLink = async (
  url: string, 
  summaryLength: number = 3, 
  thoughtsLength: number = 3,
  writingGrade: number = 1,
  manualTitle?: string
): Promise<YouTubeAnalysisResult> => {
  const ai = getClient();
  
  // Use gemini-2.5-flash for speed and tool support
  const modelId = "gemini-2.5-flash";

  const videoId = extractYouTubeId(url);
  
  // Create a specific search query utilizing the ID to avoid generic results
  // If manualTitle is provided, include it to help finding the right content
  let searchQuery = videoId ? `site:youtube.com "${videoId}"` : url;
  if (manualTitle) {
    searchQuery += ` "${manualTitle}"`;
  }

  const prompt = `
    You are an AI assistant helper for a children's book report app.

    **TASK**: Analyze the specific YouTube video provided and extract its content to help a child write a report.

    **TARGET**:
    - URL: ${url}
    - Video ID: ${videoId || "Unknown"}
    - User Provided Title Hint: ${manualTitle || "None"}
    - Search Query to use: ${searchQuery}
    - Target Audience Level: Elementary School Grade ${writingGrade} (Korean Education System)

    **CRITICAL INSTRUCTIONS (DO NOT IGNORE)**:
    1. **MANDATORY SEARCH**: You MUST use the 'googleSearch' tool. execute the search query provided above to find the *exact* video title and description/content.
    2. **IDENTIFY SPECIFIC VERSION**: 
       - If the user provided a "User Provided Title Hint", prioritize checking if the video matches this title.
       - Do NOT assume the story is the classic original version just by the title. 
       - If the video is "Pinkfong Three Little Pigs", summarize the specific Pinkfong musical version.
       - If it is a parody or a specific cartoon episode (e.g., Pororo, Hello Carbot), summarize THAT specific plot.
       - If the link content does not match the classic fairy tale, follow the link's content.
    3. **NO GUESSING**: If you absolutely cannot find the video details via search, state that you couldn't find the specific video content instead of hallucinating a generic story.
    4. **WRITING STYLE & LEVEL (Grade ${writingGrade})**:
       - **Grade 1-2**: Use very simple sentences, basic vocabulary, friendly and soft tone (해요-che). Avoid difficult words.
       - **Grade 3-4**: Use structured sentences, slightly more descriptive vocabulary.
       - **Grade 5-6**: Use more complex sentences, critical thinking, and mature expressions.
       - **Summary**: Approximately ${summaryLength} sentences.
       - **Thoughts/Feelings**: Approximately ${thoughtsLength} sentences.

    **OUTPUT FORMAT (Korean)**:
    Provide the result in the following format:

    제목: [Exact Video Title found via search, or use the User Provided Title if it matches]
    줄거리: [A ${summaryLength}-sentence summary of the ACTUAL video content, written for Grade ${writingGrade} level]
    장면: [Visual description of a specific scene unique to this video version]
    느낀점: [Educational or emotional thought based on this specific video, approx ${thoughtsLength} sentences, written for Grade ${writingGrade} level]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Simple parsing logic using regex
    const titleMatch = text.match(/제목:\s*(.+)/);
    const summaryMatch = text.match(/줄거리:\s*([\s\S]*?)(?=장면:|$)/);
    const sceneMatch = text.match(/장면:\s*([\s\S]*?)(?=느낀점:|$)/);
    const thoughtsMatch = text.match(/느낀점:\s*([\s\S]*?)$/);

    let title = manualTitle || ""; // Default to manual title if provided and parsing fails
    let summary = "";
    let recommendedScene = "";
    let recommendedThoughts = "";

    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    } else if (!titleMatch && text.length > 10) {
        // Fallback: if regex completely fails but we have text, assume text is mostly summary
        summary = text;
    }

    if (sceneMatch && sceneMatch[1]) {
      recommendedScene = sceneMatch[1].trim();
    }

    if (thoughtsMatch && thoughtsMatch[1]) {
      recommendedThoughts = thoughtsMatch[1].trim();
    }

    // Fallback if parsing failed or model didn't follow format well
    if (!title) title = "동화 제목을 찾을 수 없어요";
    if (!summary) summary = "줄거리를 가져오는데 실패했어요. 링크가 올바른지 확인해주세요.";

    return { title, summary, recommendedScene, recommendedThoughts };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI가 동화를 분석하는 중에 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
  }
};

export const generateSceneImage = async (
    sceneDescription: string, 
    title: string, 
    summary: string,
    level: DrawingLevel = 'low'
): Promise<string> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash-image";

  // If sceneDescription is empty, use the summary to generate a representative image
  const effectiveDescription = sceneDescription.trim() 
    ? sceneDescription 
    : `The most representative and heartwarming scene from the story summary: ${summary}`;

  // Define style guidelines based on level
  let styleGuide = "";
  if (level === 'low') {
      styleGuide = "Style: Simple and cute art. Thick lines, bright primary colors, simple shapes, crayon or marker style, whimsical. Easy to understand for young children.";
  } else if (level === 'medium') {
      styleGuide = "Style: Standard children's book illustration. Colored pencils or soft watercolor. Warm atmosphere, balanced details, friendly characters.";
  } else {
      styleGuide = "Style: High-quality, artistic illustration. Refined details, sophisticated composition, expressive lighting, beautiful digital art or detailed watercolor.";
  }

  const prompt = `
    Context:
    Story Title: ${title}
    Story Summary: ${summary}
    Target Style Level: ${level}
    
    Request:
    Draw a SINGLE illustration for: "${effectiveDescription}"
    
    ${styleGuide}
    
    CRITICAL RESTRICTIONS:
    1. DO NOT include any text, words, letters, or Hangul in the image. The image must be completely text-free.
    2. Draw EXACTLY ONE scene. Do not create a comic strip, multiple panels, or split screens.
    3. Focus on the main characters and action.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
    
    throw new Error("이미지가 생성되지 않았습니다.");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw new Error("그림을 그리는 중 오류가 발생했어요.");
  }
};

export const generateStorySpeech = async (text: string): Promise<string> => {
  const ai = getClient();
  // Using the text-to-speech model
  const modelId = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore, Puck, Charon, Fenrir, Zephyr
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw new Error("음성을 생성하는 중 오류가 발생했어요.");
  }
};