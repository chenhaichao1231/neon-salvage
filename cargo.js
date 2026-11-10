(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Cargo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const RECYCLER = Object.freeze({ x: 0, y: 0, radius: 65 });
  const GRAB_RANGE = 140;
  const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function create() { return { items: [], heldId: null, nextId: 1, banked: 0, depots: [{ ...RECYCLER }] }; }
  function held(state) { return state.items.find(item => item.id === state.heldId) || null; }
  function remove(state, item) {
    const index = state.items.indexOf(item);
    if (index !== -1) state.items.splice(index, 1);
    if (state.heldId === item.id) state.heldId = null;
  }
  function add(state, x, y, mass = 1) {
    if (state.items.length >= 24) {
      const oldestFree = state.items.find(item => item.id !== state.heldId && !item.thrown && !item.owner && !item.storyId);
      if (!oldestFree) return null;
      remove(state, oldestFree);
    }
    mass = Math.max(1, Math.min(3, Math.round(finite(mass, 1))));
    const item = { id: state.nextId++, x: finite(x), y: finite(y), vx: 0, vy: 0,
      mass, radius: 12 + mass * 4, hp: mass * 30, maxHp: mass * 30,
      thrown: false, flightTime: 0, bankTime: 0 };
    state.items.push(item);
    return item;
  }
  function targetNearest(state, player) {
    let nearest = null;
    let best = GRAB_RANGE;
    for (const item of state.items) {
      if (item.owner || item.thrown || item.id === state.heldId || item.hp <= 0) continue;
      const d = distance(item, player);
      if (d <= best) { nearest = item; best = d; }
    }
    return nearest;
  }
  function action(state, player) {
    const item = held(state);
    if (item) {
      const angle = finite(player.angle);
      item.vx = Math.cos(angle) * 520;
      item.vy = Math.sin(angle) * 520;
      item.thrown = true;
      item.flightTime = 0;
      item.bankTime = 0;
      state.heldId = null;
      return { type: 'throw', id: item.id, x: item.x, y: item.y, mass: item.mass };
    }
    const nearest = targetNearest(state, player);
    if (!nearest) return null;
    state.heldId = nearest.id;
    nearest.bankTime = 0;
    return { type: 'grab', id: nearest.id, x: nearest.x, y: nearest.y, mass: nearest.mass };
  }
  // Fraction of the segment at its first circle intersection, or Infinity.
  function hitTime(ax, ay, bx, by, cx, cy, radius) {
    const dx = bx - ax, dy = by - ay, ox = ax - cx, oy = ay - cy;
    const c = ox * ox + oy * oy - radius * radius;
    if (c <= 0) return 0;
    const a = dx * dx + dy * dy;
    if (!a) return Infinity;
    const b = 2 * (ox * dx + oy * dy);
    const disc = b * b - 4 * a * c;
    if (disc < 0) return Infinity;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    return t >= 0 && t <= 1 ? t : Infinity;
  }
  function update(state, player, enemies = [], shots = [], dt = 0, options = {}) {
    dt = Math.max(0, Math.min(60, finite(dt)));
    const events = [];
    const px = finite(player.x), py = finite(player.y), angle = finite(player.towAngle, finite(player.angle));
    // Bounded substeps keep the spring stable even after a stalled animation frame.
    const steps = Math.max(1, Math.ceil(dt * 120));
    const step = dt / steps;
    for (const item of state.items.slice()) {
      if (item.hp <= 0) { remove(state, item); continue; }
      if (item.owner) continue;
      item.x = finite(item.x); item.y = finite(item.y);
      item.vx = finite(item.vx); item.vy = finite(item.vy);
      let consumed = false;
      for (let i = 0; i < steps; i++) {
        const oldX = item.x, oldY = item.y;
        if (item.id === state.heldId) {
          const towDistance = 32 + item.radius;
          item.vx += ((px - Math.cos(angle) * towDistance - item.x) * 32 - item.vx * 10) * step;
          item.vy += ((py - Math.sin(angle) * towDistance - item.y) * 32 - item.vy * 10) * step;
        } else if (!item.thrown) {
          const friction = Math.exp(-2.8 * step);
          item.vx *= friction; item.vy *= friction;
        }
        item.x += item.vx * step; item.y += item.vy * step;
        if (item.id === state.heldId) {
          const inside = (state.depots || [RECYCLER]).some(depot => Math.hypot(px-depot.x, py-depot.y) <= (depot.radius || 65) && distance(item, depot) <= (depot.radius || 65));
          item.bankTime = inside ? item.bankTime + step : 0;
        }
        if (item.thrown) {
          let target = null, earliest = Infinity;
          for (const enemy of enemies) {
            if (!(enemy.hp > 0)) continue;
            const t = hitTime(oldX, oldY, item.x, item.y, enemy.x, enemy.y,
              item.radius + Math.max(0, finite(enemy.radius, 16)));
            if (t < earliest) { target = enemy; earliest = t; }
          }
          if (target) {
            const damage = 45 * item.mass;
            target.hp -= damage;
            events.push({ type: 'impact', id: item.id, x: oldX + (item.x - oldX) * earliest,
              y: oldY + (item.y - oldY) * earliest, mass: item.mass, damage, enemy: target });
            remove(state, item); consumed = true; break;
          }
          item.flightTime += step;
          if (item.flightTime >= 2.5) {
            events.push({ type: 'shatter', id: item.id, x: item.x, y: item.y, mass: item.mass });
            remove(state, item); consumed = true; break;
          }
        }
      }
      if (consumed) continue;
    }
    // Call after moving projectiles but before their enemy/player collision checks.
    // Optional prevX/prevY provides swept cover detection for fast projectiles.
    for (const shot of shots) {
      shot.cargoHit = null;
      if (!(shot.life > 0)) continue;
      let target = null, earliest = Infinity;
      for (const item of state.items) {
        if (item.thrown || item.hp <= 0) continue;
        const t = hitTime(finite(shot.prevX, shot.x), finite(shot.prevY, shot.y),
          shot.x, shot.y, item.x, item.y, item.radius + Math.max(0, finite(shot.radius, 3)));
        if (t < earliest) { earliest = t; target = item; }
      }
      if (!target) continue;
      if (options.deferShots) { shot.cargoHit = { item: target, t: earliest }; continue; }
      // An entity in front of the cover must resolve first. Preserve the later
      // cover intersection so a piercing shot can still hit it this frame.
      let entityTime = Infinity;
      const candidates = shot.enemy ? (player.hp > 0 && !(player.inv > 0) ? [player] : []) : enemies;
      for (const entity of candidates) {
        if (!(entity.hp > 0) || (!shot.enemy && shot.hits?.has(entity))) continue;
        const t = hitTime(finite(shot.prevX, shot.x), finite(shot.prevY, shot.y), shot.x, shot.y,
          entity.x, entity.y, shot.enemy ? 15 : finite(entity.radius, 16) + 5);
        entityTime = Math.min(entityTime, t);
      }
      if (entityTime < earliest) { shot.cargoHit = { item: target, t: earliest }; continue; }
      const event = blockShot(state, shot, target);
      if (event) events.push(event);
    }
    if (!options.deferBank) {
      const event = bank(state, player);
      if (event) events.push(event);
    }
    return events;
  }
  function blockShot(state, shot, target) {
    if (!(shot.life > 0) || !state.items.includes(target) || target.hp <= 0) return null;
    shot.life = 0;
    target.hp -= shot.enemy ? 10 : Math.max(0, finite(shot.damage, 10));
    const event = { type: 'block', id: target.id, x: target.x, y: target.y, destroyed: target.hp <= 0 };
    if (target.hp <= 0) remove(state, target);
    return event;
  }
  function bank(state, player) {
    // Call after all damage for the frame when integrating a combat loop.
    if (Number.isFinite(player.hp) && player.hp <= 0) return null;
    const cargo = held(state);
    if (!cargo || cargo.bankTime + 1e-9 < 1.5) return null;
    const value = cargo.mass * 12 * Math.max(0, Math.min(1, cargo.hp / cargo.maxHp));
    state.banked += value;
    const event = { type: 'bank', id: cargo.id, x: cargo.x, y: cargo.y, mass: cargo.mass, value };
    remove(state, cargo);
    return event;
  }
  function release(state) {
    const cargo = held(state);
    state.heldId = null;
    if (cargo) cargo.bankTime = 0;
    return cargo;
  }
  function speedFactor(state) { const cargo = held(state); return cargo ? 1 / (1 + cargo.mass * 0.15) : 1; }
  function status(state) {
    const cargo = held(state);
    return { count: state.items.length, heldId: cargo ? cargo.id : null, mass: cargo ? cargo.mass : 0,
      bankProgress: cargo ? Math.min(1, cargo.bankTime / 1.5) : 0, banked: state.banked };
  }
  return { create, add, action, release, update, bank, blockShot, hitTime, held, targetNearest, speedFactor, status, RECYCLER, GRAB_RANGE };
});
