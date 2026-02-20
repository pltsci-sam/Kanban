import type { Card } from './card.js';

export type AdapterType = 'ralph' | 'specops' | 'specArtifact';

export interface RalphEnrichment {
  buildProgress?: number;
  phase?: string;
  filesModified?: number;
}

export interface SpecopsEnrichment {
  specPhase?: string;
  completedPhases?: string[];
  lastActivity?: string;
}

export interface SpecArtifactEnrichment {
  openQuestionCount?: number;
  decisionCount?: number;
  hasRequirements?: boolean;
  hasSchema?: boolean;
}

export interface CardEnrichment {
  ralph?: RalphEnrichment;
  specops?: SpecopsEnrichment;
  specArtifact?: SpecArtifactEnrichment;
}

export interface EnrichedCard extends Card {
  enrichment: CardEnrichment;
}
