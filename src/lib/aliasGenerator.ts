const prefixes = [
  'shadow', 'neon', 'atomic', 'silent', 'hidden', 'stealth', 'cyber', 'ghost', 
  'dark', 'nova', 'void', 'obsidian', 'spectral', 'quantum', 'iron', 'frost'
];

const suffixes = [
  'hawk', 'viper', 'raven', 'wolf', 'phantom', 'blade', 'storm', 'orbit',
  'pulse', 'gate', 'vault', 'relay', 'echo', 'strike', 'drift', 'shift'
];

export function generateMaskedAlias(domain: string = 'stealthrelay.com'): string {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  // Adds 3 digits to guarantee collision avoidance
  const digits = Math.floor(Math.random() * 900) + 100;
  
  return `${prefix}-${suffix}-${digits}@${domain}`;
}
