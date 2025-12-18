
import { GoogleGenAI, Type } from "@google/genai";
import type { Artifact, SemanticScores, NotaryReport } from '../types';
import { calculateMusicHAS, type MusicAnalysisResult } from '../core/musicScoring';
import { sealCertificate } from './notary';
import { PPM_MODEL_POLICY } from '../constants';

// --- SCHEMAS ---

// Step A: Ledger Parser
const ledgerParserSchema = {
    type: Type.OBJECT,
    properties: {
        intended_lyrics: { type: Type.STRING, description: "Lyrics explicitly requested by the user." },
        intended_style: { type: Type.STRING, description: "Musical style, genre, or instruments requested." },
        complexity_score: { type: Type.NUMBER, description: "Complexity of user instructions (IC) [0.0-1.0]." },
        process_depth: { type: Type.NUMBER, description: "Depth of iteration (PD) [0.0-1.0]." }
    },
    required: ["intended_lyrics", "intended_style", "complexity_score", "process_depth"]
};

// Step B: Audio Blind Sensor
const audioBlindSensorSchema = {
    type: Type.OBJECT,
    properties: {
        heard_lyrics: { type: Type.STRING, description: "Full transcription of lyrics heard in the audio." },
        detected_genre: { type: Type.STRING, description: "The musical genre identified." },
        detected_instruments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of instruments heard." },
        detected_bpm: { type: Type.STRING, description: "Approximate BPM or tempo description." },
        originality_score: { type: Type.NUMBER, description: "Perceived originality (ORG) [0.0-1.0]." }
    },
    required: ["heard_lyrics", "detected_genre", "detected_instruments", "detected_bpm", "originality_score"]
};

// Step C & D: Forensic Match & Plagiarism
const forensicMatchSchema = {
    type: Type.OBJECT,
    properties: {
        lyric_alignment_score: { type: Type.NUMBER, description: "How well heard lyrics match intended lyrics [0.0-1.0]." },
        style_match_score: { type: Type.NUMBER, description: "How well detected genre/instruments match intended style [0.0-1.0]." },
        plagiarism_detected: { type: Type.BOOLEAN, description: "True if lyrics appear to be from a pre-existing famous song." },
        integrity_score: { type: Type.NUMBER, description: "Overall integrity of the claim [0.0-1.0]." }
    },
    required: ["lyric_alignment_score", "style_match_score", "plagiarism_detected", "integrity_score"]
};

async function callGemini<T>(
    modelName: string, 
    systemInstruction: string, 
    prompt: string, 
    schema: any, 
    media?: { mimeType: string, data: string },
    tools: any[] = []
): Promise<T> {
    if (!process.env.API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [{ text: prompt }];
    if (media) {
        parts.push({ inlineData: { mimeType: media.mimeType, data: media.data } });
    }

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                tools: tools.length > 0 ? tools : undefined
            }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text) as T;
    } catch (e) {
        console.error("Gemini API Error:", e);
        throw new Error(`Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

export async function verifyMusic(
    audioArtifact: Artifact, 
    ledgerText: string
): Promise<NotaryReport> {

    // 1. STEP A: PARSE LEDGER (Text Model)
    const ledgerAnalysis = await callGemini<any>(
        'gemini-2.5-flash',
        "You are a music production auditor. Analyze the chat logs to extract user intent.",
        `Analyze this production ledger:\n\n${ledgerText}`,
        ledgerParserSchema
    );

    // 2. STEP B: BLIND AUDIO SENSOR (Complex Multimodal Model)
    // We use gemini-3-pro-preview for high fidelity audio understanding
    const audioAnalysis = await callGemini<any>(
        'gemini-3-pro-preview',
        "You are an expert musicologist. Listen to the audio file and extract details blindly.",
        "Transcribe the lyrics and identify the style/genre/instruments.",
        audioBlindSensorSchema,
        { mimeType: audioArtifact.mimeType, data: audioArtifact.data }
    );

    // 3. STEP C & D: GROUNDED SEARCH & FORENSIC MATCH (Complex Model with Tools)
    const matchAnalysis = await callGemini<any>(
        'gemini-3-pro-preview',
        "You are a forensic copyright auditor. Check for plagiarism and verify user intent.",
        `
        INTENDED LYRICS: ${ledgerAnalysis.intended_lyrics}
        INTENDED STYLE: ${ledgerAnalysis.intended_style}
        
        HEARD LYRICS: ${audioAnalysis.heard_lyrics}
        DETECTED STYLE: ${audioAnalysis.detected_genre}
        
        Task:
        1. Search the HEARD LYRICS on Google to check for plagiarism.
        2. Compare Intended vs Heard data.
        `,
        forensicMatchSchema,
        undefined,
        [{ googleSearch: {} }] // Enable Google Search for plagiarism check
    );

    // 4. SCORING
    const analysisData: MusicAnalysisResult = {
        plagiarism_detected: matchAnalysis.plagiarism_detected,
        lyric_alignment_score: matchAnalysis.lyric_alignment_score,
        scores: {
            HI: matchAnalysis.style_match_score,
            PD: ledgerAnalysis.process_depth,
            IC: ledgerAnalysis.complexity_score,
            ORG: audioAnalysis.originality_score,
            INTEG: matchAnalysis.integrity_score
        }
    };

    const math = calculateMusicHAS(analysisData);
    const { cert_id, artifact_sha256, issued_at } = await sealCertificate(audioArtifact);

    const scores: SemanticScores = {
        ORG: analysisData.scores.ORG,
        COH: matchAnalysis.style_match_score,
        COMP: analysisData.scores.IC, // Mapping IC to COMP for display
        HI: analysisData.scores.HI,
        PD: analysisData.scores.PD,
        REF: analysisData.scores.PD, // PD doubles as refinement in music
        ALIGN: matchAnalysis.lyric_alignment_score,
        INTEG: analysisData.scores.INTEG,
        CITE: null,
        IC: analysisData.scores.IC
    };

    return {
        HAS: math.HAS,
        VER: math.VER,
        HAS_base: math.HAS_base,
        P_total: math.P_total,
        L: math.L,
        cert_id,
        artifact_sha256,
        issued_at,
        PPM_MODEL_POLICY: `${PPM_MODEL_POLICY} (Audio-G3)`,
        parser_source: 'gemini-3-pro-preview',
        turns_confidence: 1,
        fallback_used: false,
        scores,
        is_music: true,
        plagiarism_detected: analysisData.plagiarism_detected,
        lyric_alignment: analysisData.lyric_alignment_score
    };
}
