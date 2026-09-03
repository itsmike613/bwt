const limit = 10;
const teamlimit = 5;
const teams = ['none', 'red', 'blue'];

function code(value) {
  return value.trim().toUpperCase();
}

function clean(value) {
  return value.trim();
}

function form(name, skin, invite, known) {
  const errors = {};
  const nick = clean(name);
  const room = code(invite);

  if (!nick) errors.user = 'Enter a username.';
  else if (nick.length > 16) errors.user = 'Username must be 16 characters or fewer.';

  if (!known.includes(skin)) errors.skin = 'Choose a valid skin.';

  if (!room) errors.invite = 'Enter an invite code.';
  else if (room.length < 2 || room.length > 20) errors.invite = 'Invite code must be 2–20 characters.';
  else if (!/^[A-Z0-9-]+$/.test(room)) errors.invite = 'Use only letters, numbers, and hyphens.';

  return { ok: Object.keys(errors).length === 0, errors, name: nick, skin, code: room };
}

function member(uid, name, skin, stamp = 0) {
  return {
    uid,
    name: clean(name),
    skin,
    team: 'none',
    joined: stamp
  };
}

function players(room) {
  return Object.values(room?.players ?? {});
}

function claim(current, item, stamp = 0) {
  if (current !== null && current !== undefined) return { ok: false, code: 'taken', room: current };
  return {
    ok: true,
    room: {
      host: item.uid,
      state: 'lobby',
      created: stamp,
      players: { [item.uid]: item }
    }
  };
}

function join(current, item) {
  if (!current) return { ok: false, code: 'missing', room: current };
  if (current.state !== 'lobby') return { ok: false, code: 'started', room: current };
  const list = current.players ?? {};
  if (!list[item.uid] && Object.keys(list).length >= limit) return { ok: false, code: 'full', room: current };
  const old = list[item.uid];
  const next = {
    ...item,
    team: old?.team ?? 'none',
    joined: old?.joined ?? item.joined
  };
  return { ok: true, room: { ...current, players: { ...list, [item.uid]: next } } };
}

function target(team) {
  const index = teams.indexOf(team);
  return teams[(index + 1 + teams.length) % teams.length];
}

function cycle(room, uid) {
  const item = room?.players?.[uid];
  if (!item) return { ok: false, code: 'missing', room };
  const next = target(item.team);
  if (next !== 'none') {
    const size = players(room).filter(player => player.team === next).length;
    if (size >= teamlimit) return { ok: false, code: 'teamfull', room };
  }
  return {
    ok: true,
    room: {
      ...room,
      players: {
        ...room.players,
        [uid]: { ...item, team: next }
      }
    }
  };
}

function shuffle(list, roll = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function random(room, roll = Math.random) {
  const list = shuffle(players(room), roll);
  const next = { ...(room.players ?? {}) };
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    next[item.uid] = { ...item, team: i % 2 === 0 ? 'red' : 'blue' };
  }
  return { ...room, players: next };
}

function valid(room) {
  const list = players(room);
  const red = list.filter(item => item.team === 'red').length;
  const blue = list.filter(item => item.team === 'blue').length;
  if (list.length < 2) return { ok: false, code: 'few', red, blue };
  if (list.some(item => item.team === 'none')) return { ok: false, code: 'unassigned', red, blue };
  if (!red || !blue) return { ok: false, code: 'empty', red, blue };
  if (red > teamlimit || blue > teamlimit) return { ok: false, code: 'teamfull', red, blue };
  return { ok: true, code: 'ready', red, blue };
}

function next(room) {
  const list = players(room);
  list.sort((a, b) => (a.joined ?? 0) - (b.joined ?? 0) || a.uid.localeCompare(b.uid));
  return list[0]?.uid ?? null;
}

function elect(room) {
  if (!room) return room;
  if (room.host && room.players?.[room.host]) return room;
  const host = next(room);
  return host ? { ...room, host } : room;
}

function message(code) {
  const map = {
    taken: 'That invite code is already taken.',
    missing: 'Room not found.',
    full: 'That room is full.',
    started: 'That room has already started.',
    teamfull: 'That team already has 5 players.',
    few: 'At least 2 players are required.',
    unassigned: 'Assign every player to a team.',
    empty: 'Red and Blue must each have at least 1 player.',
    ready: ''
  };
  return map[code] ?? 'Something went wrong.';
}

export { claim, code, cycle, elect, form, join, limit, member, message, players, random, teamlimit, valid };
