function name(room, uid) {
  return room?.players?.[uid]?.name ?? 'Unknown';
}

function best(room, stats, key) {
  const list = Object.values(room?.players ?? {});
  if (!list.length) return '—';
  list.sort((a, b) => (stats?.[b.uid]?.[key] ?? 0) - (stats?.[a.uid]?.[key] ?? 0) || a.name.localeCompare(b.name));
  const top = list[0];
  return `${top.name} (${stats?.[top.uid]?.[key] ?? 0})`;
}

class Victory {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.node = document.querySelector('#victory');
    this.title = document.querySelector('#victorytitle');
    this.body = document.querySelector('#victorybody');
    this.red = document.querySelector('#redbreaker');
    this.blue = document.querySelector('#bluebreaker');
    this.kills = document.querySelector('#mostkills');
    this.deaths = document.querySelector('#mostdeaths');
    this.leave = document.querySelector('#leaveroom');
    this.restart = document.querySelector('#newgame');
    this.shown = false;
    this.leavefn = () => this.handlers.leave?.();
    this.restartfn = () => this.handlers.restart?.();
    this.leave.addEventListener('click', this.leavefn);
    this.restart.addEventListener('click', this.restartfn);
  }

  open(room, state, uid) {
    if (!state?.winner) return;
    this.shown = true;
    this.node.hidden = false;
    const winner = state.winner === 'red' ? 'Red' : 'Blue';
    this.title.textContent = `${winner} wins`;
    this.body.replaceChildren();
    const stats = state.stats ?? {};
    const list = Object.values(room?.players ?? {}).sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
    for (const player of list) {
      const score = stats[player.uid] ?? { kills: 0, deaths: 0, beds: 0 };
      const row = document.createElement('div');
      row.className = `victoryrow ${player.team}`;
      const playername = document.createElement('strong');
      playername.textContent = player.name;
      const team = document.createElement('span');
      team.textContent = player.team === 'red' ? 'Red' : 'Blue';
      const values = document.createElement('span');
      values.textContent = `${score.kills} K · ${score.deaths} D · ${score.beds} Bed`;
      row.append(playername, team, values);
      this.body.append(row);
    }
    this.red.textContent = state.breakers?.red ? name(room, state.breakers.red) : 'Not destroyed';
    this.blue.textContent = state.breakers?.blue ? name(room, state.breakers.blue) : 'Not destroyed';
    this.kills.textContent = best(room, stats, 'kills');
    this.deaths.textContent = best(room, stats, 'deaths');
    const host = room?.host === uid;
    this.restart.hidden = !host;
    this.leave.hidden = host;
    document.exitPointerLock?.();
  }

  close() {
    this.shown = false;
    this.node.hidden = true;
  }

  closeall() {
    this.close();
    this.leave.removeEventListener('click', this.leavefn);
    this.restart.removeEventListener('click', this.restartfn);
  }
}

export { Victory };
