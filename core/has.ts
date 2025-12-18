// FIX: Import TurnCounts type to resolve TypeScript error.
import type { SemanticScores, ModeDecision, TurnCounts } from '../types';
import { ETHICAL_CAP } from '../constants';

export function clamp(x: number, min: number, max: number) { return Math.max(min, Math.min(max, x)); }

export function decideMode(
    ledger_text: string, 
    turns: TurnCounts | undefined, 
    sim_score: number | null
): ModeDecision {
    const hasLedger = !!(ledger_text && ledger_text.trim().length > 100);
    if (!hasLedger) return { mode: 'artifact_only', htr: 0 };

    // Point 3: Noise Control. If similarity is very low on a short ledger, it's irrelevant.
    if (sim_score !== null && sim_score < 0.10 && ledger_text.length < 500) {
        console.warn(`[decideMode] Low sim (${sim_score.toFixed(3)}) on short ledger (<500 chars). Forcing artifact_only.`);
        return { mode: 'artifact_only', htr: 0 };
    }
    
    // Point 2: Prioritize valid (long) ledger. Always treat as hybrid.
    if (ledger_text.length > 1000) {
        let htr = 0.25; // Default for confident hybrid
        if (turns && (turns.human + turns.ai) > 0 && turns.confidence >= 0.6) {
             // Use calculated htr if available and confident
             htr = turns.human / (turns.human + turns.ai);
        }
        return { mode: 'hybrid', htr };
    }

    // Original logic for medium-length ledgers.
    if (turns && (turns.human + turns.ai) > 0 && turns.confidence >= 0.6) {
        const htr = turns.human / (turns.human + turns.ai);
        // If HTR is high enough, use it for a more precise hybrid calculation.
        if (htr > 0.1) {
             return { mode: 'hybrid', htr };
        }
    }
    
    // Fallback for any other case where a ledger exists but parsing was inconclusive or HTR was low.
    return { mode: 'hybrid', htr: 0.25 };
}

export function calculateHybridHAS(
    scores: SemanticScores, 
    md: ModeDecision
) {
    const { htr } = md;
    
    const cappedHTR = Math.min(htr, 0.7);
    const HAS_base = 100 * (0.25 * scores.HI + 0.18 * scores.PD + 0.15 * scores.REF + 0.12 * scores.ALIGN +
        0.10 * scores.ORG + 0.08 * scores.COH + 0.07 * scores.COMP + 0.05 * cappedHTR);
    
    const P_fab = 30 * (1 - scores.INTEG);
    const P_cite = scores.CITE !== null ? 15 * (1 - scores.CITE) : 0;
    const P_der = 12 * Math.max(0, 0.6 - scores.ORG);
    const P_inc = 8 * Math.max(0, 0.5 - scores.ALIGN) * scores.PD;
    const P_total = Math.min(P_fab + P_cite + P_der + P_inc, 45);

    const L = clamp(0.9 + 0.2 * Math.min(scores.HI, scores.PD, scores.REF), 0.9, 1.15);
    
    const HAS_raw = (HAS_base - P_total) * L;
    const HAS_capped = clamp(HAS_raw, 0, ETHICAL_CAP);
    const HAS = Math.round(HAS_capped);

    const VER_val = (HAS < 40 || scores.INTEG < 0.4) ? 'VER-0'
        : (HAS < 60) ? 'VER-1'
        : (HAS < 75 || scores.INTEG < 0.85) ? 'VER-2'
        : 'VER-3';

    const VER = VER_val as 'VER-0' | 'VER-1' | 'VER-2' | 'VER-3';

    return { HAS, VER, HAS_base, P_total, L };
}