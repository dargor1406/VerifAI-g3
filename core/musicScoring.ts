
import type { SemanticScores } from '../types';

export interface MusicAnalysisResult {
    plagiarism_detected: boolean;
    lyric_alignment_score: number;
    scores: {
        HI: number; // Human Influence (Genre/BPM/Style match)
        PD: number; // Process Direction (Ledger depth)
        IC: number; // Intent Complexity
        ORG: number; // Originality
        INTEG: number; // Integrity
    }
}

export function calculateMusicHAS(analysis: MusicAnalysisResult) {
    const { plagiarism_detected, lyric_alignment_score, scores } = analysis;

    // --- RULE 1: THE KILL SWITCH ---
    // If plagiarism is detected OR lyrics don't match the prompt significantly.
    if (plagiarism_detected || lyric_alignment_score < 0.4) {
        return {
            HAS: 0,
            VER: 'VER-0' as const,
            HAS_base: 0,
            P_total: 100, // Maximum penalty
            L: 0
        };
    }

    // --- RULE 2: WEIGHTED SCORING ---
    // HI (Influence) 35%
    // PD (Process) 25%
    // IC (Complexity) 25%
    // ORG (Originality) 15%
    const HAS_base = 100 * (
        (0.35 * scores.HI) +
        (0.25 * scores.PD) +
        (0.25 * scores.IC) +
        (0.15 * scores.ORG)
    );

    // --- RULE 3: PENALTIES ---
    // Penalize if integrity is low (e.g. model detected hallucinations in description vs audio)
    const P_integ = 20 * (1 - scores.INTEG);
    const P_total = Math.round(P_integ);

    // L factor (Leverage) - slightly boosts high complexity projects
    const L = 1.0; 

    // --- RULE 4: THE ETHICAL CAP ---
    // Max score is 75 for AI generated music, regardless of prompt quality.
    const ETHICAL_CAP_MUSIC = 75;
    
    let HAS_raw = (HAS_base - P_total) * L;
    let HAS = Math.round(Math.max(0, Math.min(HAS_raw, ETHICAL_CAP_MUSIC)));

    const VER: 'VER-0' | 'VER-1' | 'VER-2' | 'VER-3' = (HAS < 40) ? 'VER-0'
        : (HAS < 60) ? 'VER-1'
        : (HAS < 70) ? 'VER-2'
        : 'VER-3';

    return { HAS, VER, HAS_base, P_total, L };
}
