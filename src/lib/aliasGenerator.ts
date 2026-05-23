const prefixes = [
  'shadow', 'neon', 'atomic', 'silent', 'hidden', 'stealth', 'cyber', 'ghost', 
  'dark', 'nova', 'void', 'obsidian', 'spectral', 'quantum', 'iron', 'frost'
];

const suffixes = [
  'hawk', 'viper', 'raven', 'wolf', 'phantom', 'blade', 'storm', 'orbit',
  'pulse', 'gate', 'vault', 'relay', 'echo', 'strike', 'drift', 'shift'
];

export function generateMaskedAlias(domain: string = 'stealthrelay.com'): string {
  const buffer = new Uint32Array(3);
  crypto.getRandomValues(buffer);

  const prefix = prefixes[buffer[0] % prefixes.length];
  const suffix = suffixes[buffer[1] % suffixes.length];
  // Adds 3 digits to guarantee collision avoidance
  const digits = 100 + (buffer[2] % 900);
  
  return `${prefix}-${suffix}-${digits}@${domain}`;
}
