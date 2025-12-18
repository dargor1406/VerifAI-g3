
export interface SemanticScores {
  ORG: number;    // Originality
  COH: number;    // Coherence
  COMP: number;   // Completeness/Composition
  HI: number;     // Human Influence
  PD: number;     // Process Direction
  REF: number;    // Refinement
  ALIGN: number;  // Alignment
  INTEG: number;  // Integrity
  CITE: number | null; // Citation
  IC?: number;    // Intent Complexity (Music specific)
}

export interface TurnCounts {
  human: number;
  ai: number;
  confidence: number;
}

export interface ModeDecision {
  mode: 'hybrid' | 'artifact_only';
  htr: number; // Human Turn Ratio
}

export interface LLMSensorResponse {
  scores: SemanticScores;
  turns: TurnCounts;
  sim_score: number | null;
}

export interface Artifact {
  mimeType: string;
  data: string; // base64 encoded for non-text, raw string for text
  encoding: 'base64' | 'text';
}

export interface NotaryReport {
  HAS: number;
  VER: 'VER-0' | 'VER-1' | 'VER-2' | 'VER-3';
  HAS_base: number;
  P_total: number;
  L: number;
  cert_id: string;
  artifact_sha256: string;
  issued_at: string;
  PPM_MODEL_POLICY: string;
  parser_source: string;
  turns_confidence: number;
  fallback_used: boolean;
  scores: SemanticScores;
  // Music specific fields
  is_music?: boolean;
  plagiarism_detected?: boolean;
  lyric_alignment?: number;
}
