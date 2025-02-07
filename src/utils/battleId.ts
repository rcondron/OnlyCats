interface ParsedBattleId {
  year: number;
  month: number;
  day: number;
  hour: number;
  valid: boolean;
}

export function parseBattleId(battleId: string): ParsedBattleId {
  try {
    // Expected format: battle-yyyyMMddHH
    const matches = battleId.match(/^battle-(\d{4})(\d{2})(\d{2})(\d{2})$/);
    if (!matches) {
      console.warn(`Invalid battleId format: ${battleId}`);
      return { valid: false, year: 0, month: 0, day: 0, hour: 0 };
    }

    const [_, year, month, day, hour] = matches;
    return {
      valid: true,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour)
    };
  } catch (error) {
    console.error(`Error parsing battleId: ${battleId}`, error);
    return { valid: false, year: 0, month: 0, day: 0, hour: 0 };
  }
}

export function formatBattleTime(battleId: string): string {
  const parsed = parseBattleId(battleId);
  if (!parsed.valid) return 'Invalid Time';
  
  return new Date(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour
  ).toLocaleString();
} 