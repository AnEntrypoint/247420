export const SWEEP_COMMIT_RE = /HiddenSpawn|malicious injection|malware payload|supply-chain compromise|remove vendored .*\.gm|org-wide gm cleanup|declaudeify|regenerate showcase\.json|sync config-source|track claim-audit/i;

export const RELEASE_BUMP_RE = /^(chore(\([^)]*\))?:\s*(auto-)?bump|chore:\s*release|bump version|release v?\d)/i;

export const METADATA_ONLY_RE = /^(MIT license|add(ing)? license|create LICENSE|initial commit)/i;

export const AUTO_REFRESH_RE = /^chore(\([^)]*\))?:\s*refresh/i;

export const isSweep = message => SWEEP_COMMIT_RE.test((message || '').split('\n')[0]);

export const isReleaseBump = message => RELEASE_BUMP_RE.test((message || '').split('\n')[0]);

export const isMetadataOnly = message => METADATA_ONLY_RE.test((message || '').split('\n')[0]);

export const isAutoRefresh = message => AUTO_REFRESH_RE.test((message || '').split('\n')[0]);

export const isSubstantive = message =>
  !isSweep(message) && !isReleaseBump(message) && !isMetadataOnly(message) && !isAutoRefresh(message);
