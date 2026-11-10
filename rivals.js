(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Rivals = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  function create(options = {}) {
    return { rival: { id: 1, type: 'rival', x: finite(options.x, 450), y: finite(options.y, 0),
      hp: 85, maxHp: 85, radius: 18, angle: 0 },
      exit: { x: finite(options.exitX, 900), y: finite(options.exitY, 0), radius: 35 },
      status: 'seeking', targetId: null, heldId: null, cooldown: 0, lastHp: 85, lostCount: 0 };
  }
  function token(state) { return 'rival:' + state.rival.id; }
  function find(cargo, id) { return cargo.items.find(item => item.id === id); }
  function available(cargo,item) {
    return !!item && item.hp > 0 && !item.thrown && !item.owner && item.id !== cargo.heldId;
  }
  function drop(state,cargo,events,reason) {
    const item = find(cargo,state.heldId);
    if (item && item.owner === token(state)) {
      delete item.owner;
      if (!item.thrown && item.id !== cargo.heldId) item.vx = item.vy = 0;
      item.bankTime = 0;
      events.push({type:'rival-drop',id:item.id,x:item.x,y:item.y,reason});
    }
    state.heldId = state.targetId = null;
  }
  function reconcileDamage(state,cargo,events) {
    const rival = state.rival;
    if (rival.hp < state.lastHp) {
      drop(state,cargo,events,'damage');
      state.cooldown = 1.2;
    }
    state.lastHp = rival.hp;
    if (rival.hp <= 0) {
      drop(state,cargo,events,'death');
      state.status = 'dead';
      events.push({type:'rival-defeated',x:rival.x,y:rival.y});
      return true;
    }
    return false;
  }
  function applyDamage(state,cargo,amount) {
    const events = [];
    if (state.status === 'dead' || state.status === 'escaped') return events;
    state.rival.hp -= Math.max(0,finite(amount,0));
    reconcileDamage(state,cargo,events);
    if (state.status !== 'dead') state.status = 'seeking';
    return events;
  }
  function move(rival,target,speed,dt,stop=0) {
    const d = distance(rival,target);
    if (d <= stop) return;
    rival.angle = Math.atan2(target.y-rival.y,target.x-rival.x);
    const step = Math.min(speed*dt,d-stop);
    rival.x += Math.cos(rival.angle)*step;
    rival.y += Math.sin(rival.angle)*step;
  }
  function update(state,cargo,dt) {
    const events = [];
    if (state.status === 'dead' || state.status === 'escaped') return events;
    dt = Math.max(0,Math.min(.25,finite(dt,0)));
    if (reconcileDamage(state,cargo,events)) return events;
    state.cooldown = Math.max(0,state.cooldown-dt);
    let item = find(cargo,state.heldId);
    if (state.heldId !== null && (!item || item.hp <= 0 || item.thrown || item.id === cargo.heldId || item.owner !== token(state))) {
      drop(state,cargo,events,'ownership-changed');
      item = null;
    }
    if (item) {
      state.status = 'hauling';
      const speed = 105 / (1 + item.mass * .18);
      move(state.rival,state.exit,speed,dt);
      const offset = 25 + item.radius;
      item.x = state.rival.x-Math.cos(state.rival.angle)*offset;
      item.y = state.rival.y-Math.sin(state.rival.angle)*offset;
      item.vx = item.vy = item.bankTime = 0;
      if (distance(state.rival,state.exit) <= state.exit.radius && distance(item,state.exit) <= state.exit.radius+offset) {
        const index = cargo.items.indexOf(item);
        if (index >= 0) cargo.items.splice(index,1);
        state.heldId = state.targetId = null;
        state.status = 'escaped';
        state.lostCount++;
        events.push({type:'rival-escaped',id:item.id,x:state.exit.x,y:state.exit.y});
      }
      return events;
    }
    state.status = 'seeking';
    let target = find(cargo,state.targetId);
    if (!available(cargo,target)) state.targetId = null;
    if (state.cooldown > 0 || dt === 0) return events;
    if (state.targetId === null) {
      let best = Infinity;
      for (const candidate of cargo.items) {
        if (!available(cargo,candidate)) continue;
        const score = distance(state.rival,candidate) / Math.max(1,candidate.mass);
        if (score < best) { target = candidate; best = score; }
      }
      if (best === Infinity) return events;
      state.targetId = target.id;
    }
    move(state.rival,target,105,dt,state.rival.radius+target.radius);
    if (available(cargo,target) && distance(state.rival,target) <= state.rival.radius+target.radius+.001) {
      target.owner = token(state);
      target.bankTime = 0;
      state.heldId = target.id;
      state.status = 'hauling';
      events.push({type:'rival-grab',id:target.id,x:target.x,y:target.y});
    }
    return events;
  }
  return {create,update,applyDamage,available};
});
