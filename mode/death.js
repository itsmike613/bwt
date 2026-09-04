function death(room, uid, killer = null, cause = '') {
  const victim = room?.players?.[uid]?.name ?? 'Player';
  const attacker = killer && killer !== uid ? room?.players?.[killer]?.name : '';
  if (attacker) return `${victim} was killed by ${attacker}`;
  if (cause === 'void') return `${victim} fell into the void`;
  return `${victim} died`;
}

export { death };
