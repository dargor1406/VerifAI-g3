import { ARTIFACT_ONLY_CAP, PPM_MODEL_POLICY } from '../constants';
import type { NotaryReport, SemanticScores, Artifact } from '../types';
import { getHybridLLMScoresAndTurns, runArtifactAuditSensor, runArtifactQualitySensor } from './llmSensor';
import { decideMode, calculateHybridHAS } from '../core/has';
import { sealCertificate } from './notary';
import { verifyMusic } from './musicVerifier';

export async function analyzeWork(notaryArtifact: Artifact, llmArtifact: Artifact, ledger_text: string): Promise<NotaryReport> {
  
  // ROUTER: Check for Audio Artifacts (Music Mode)
  if (notaryArtifact.mimeType.startsWith('audio/')) {
      if (!ledger_text || ledger_text.trim().length < 50) {
          throw new Error("Music Verification requires a valid Production Ledger (Chat Logs).");
      }
      return await verifyMusic(notaryArtifact, ledger_text);
  }

  // --- STANDARD TEXT/IMAGE LOGIC BELOW ---

  const ledgerPresent = ledger_text && ledger_text.trim().length > 100;

  if (ledgerPresent) {
    // --- HYBRID MODE (V1 Logic with Ledger) ---
    const sensorResponse = await getHybridLLMScoresAndTurns(llmArtifact, ledger_text);
    const md = decideMode(ledger_text, sensorResponse.turns, sensorResponse.sim_score);
    
    const { HAS, VER, HAS_base, P_total, L } = calculateHybridHAS(sensorResponse.scores, md);
    const { cert_id, artifact_sha256, issued_at } = await sealCertificate(notaryArtifact);

    return {
      HAS, VER, HAS_base, P_total, L,
      cert_id, artifact_sha256, issued_at,
      PPM_MODEL_POLICY: `${PPM_MODEL_POLICY} (G3)`,
      parser_source: 'gemini-3-pro-preview',
      turns_confidence: sensorResponse.turns?.confidence ?? 0,
      fallback_used: false,
      scores: sensorResponse.scores,
    };

  } else {
    // --- ARTIFACT-ONLY MODE (V2 Logic without Ledger) ---
    const [audit, qualityResponse] = await Promise.all([
        runArtifactAuditSensor(llmArtifact),
        runArtifactQualitySensor(llmArtifact)
    ]);
    const quality = qualityResponse.scores;

    // 1. Calculate a base Quality Score
    const quality_score = (quality.ORG * 0.6 + quality.INTEG * 0.4) * 100;

    // 2. Calculate an Academic Bonus based on structure & grounding
    let academic_bonus = 0;
    if (audit.has_structure) academic_bonus += 5;
    if (audit.has_citations) academic_bonus += 5;
    if (audit.has_references) academic_bonus += 5;
    
    // EXTRA GROUNDING BONUS: Verified Citations
    if (audit.citations_verified) academic_bonus += 15;
    
    // PENALTY: Hallucinations detected via Search
    if (audit.hallucination_detected) academic_bonus -= 30;
    
    // 3. Calculate final HAS and apply the artifact-only cap
    const final_has_raw = (quality_score * 0.5) + academic_bonus;
    const HAS = Math.round(Math.min(final_has_raw, ARTIFACT_ONLY_CAP));
    
    // Define scores object to be used in VER calculation and final report
    const scores: SemanticScores = {
        ORG: quality.ORG,
        INTEG: audit.hallucination_detected ? 0.2 : quality.INTEG,
        COMP: quality.COMP,
        COH: 0, HI: 0, PD: 0, REF: 0, ALIGN: audit.citations_verified ? 1 : 0, CITE: audit.has_citations ? 1 : null,
    };

    // 4. Determine VER level
    const VER = (HAS < 40 || scores.INTEG < 0.4) ? 'VER-0'
        : (HAS < 60) ? 'VER-1'
        : (HAS < 75 || scores.INTEG < 0.85) ? 'VER-2'
        : 'VER-3';
    
    const { cert_id, artifact_sha256, issued_at } = await sealCertificate(notaryArtifact);

    return {
        HAS, VER,
        HAS_base: HAS, 
        P_total: 0,    
        L: 1,          
        cert_id, artifact_sha256, issued_at,
        PPM_MODEL_POLICY: `${PPM_MODEL_POLICY} (Grounded-G3)`,
        parser_source: 'gemini-3-pro-preview',
        turns_confidence: 0,
        fallback_used: false, 
        scores,
    };
  }
}