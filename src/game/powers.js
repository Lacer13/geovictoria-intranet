// Durations and cooldowns are simulation ticks (60 per second).
export const POWERS = {
  dash: {
    id: "dash",
    name: "Esquiva",
    cooldown: 150,
    duration: 10,
    description: "Un impulso breve que evita impactos.",
  },
  barrier: {
    id: "barrier",
    name: "Barrera",
    cooldown: 540,
    duration: 180,
    description: "Coloca una barrera que bloquea disparos durante 3 segundos.",
  },
  recover: {
    id: "recover",
    name: "Recuperación",
    cooldown: 840,
    duration: 45,
    description: "Recupera una vida. Se activa cuando te falta alguna.",
  },
  burst: {
    id: "burst",
    name: "Ráfaga",
    cooldown: 600,
    duration: 180,
    description: "Duplica la cadencia de disparo durante 3 segundos.",
  },
  slow: {
    id: "slow",
    name: "Tiempo lento",
    cooldown: 720,
    duration: 240,
    description: "Ralentiza enemigos y proyectiles durante 4 segundos.",
  },
  closing: {
    id: "closing",
    name: "Gran cierre",
    cooldown: 600,
    duration: 36,
    description:
      "Lanza un disparo especial con cuatro veces el impacto normal.",
  },
  pulse: {
    id: "pulse",
    name: "Campanada",
    cooldown: 720,
    duration: 45,
    description:
      "Una onda elimina enemigos cercanos y daña al jefe si está a su alcance.",
  },
  reflect: {
    id: "reflect",
    name: "Reflejo",
    cooldown: 660,
    duration: 240,
    description: "Devuelve los proyectiles que se acercan durante 4 segundos.",
  },
  pierce: {
    id: "pierce",
    name: "Prisma",
    cooldown: 600,
    duration: 240,
    description:
      "Tus disparos atraviesan hasta tres objetivos durante 4 segundos.",
  },
  calm: {
    id: "calm",
    name: "Calma",
    cooldown: 480,
    duration: 60,
    description: "Aleja enemigos y despeja los proyectiles cercanos.",
  },
  radar: {
    id: "radar",
    name: "Radar",
    cooldown: 600,
    duration: 240,
    description: "Guía tus disparos hacia los enemigos durante 4 segundos.",
  },
  magnet: {
    id: "magnet",
    name: "Imán",
    cooldown: 480,
    duration: 240,
    description: "Atrae las mejoras cercanas durante 4 segundos.",
  },
};

export const CHARACTER_POWERS = {
  tecnoia: "dash",
  ordenia: "barrier",
  balance: "recover",
  conectia: "burst",
  norte: "slow",
  cierreia: "closing",
  festivia: "pulse",
  aliania: "reflect",
  prisma: "pierce",
  armonia: "calm",
  radaria: "radar",
  agilia: "magnet",
};

export function powerForCharacter(id) {
  return POWERS[CHARACTER_POWERS[id] || "dash"];
}
export function activePower(player, id) {
  return player.power === id && player.powerTimer > 0;
}

export function activatePower(
  state,
  { announce, defeatEnemy, hitBoss, random },
) {
  const p = state.player,
    power = POWERS[p.power] || POWERS.dash;
  if (p.powerCooldown > 0 || state.phase !== "playing") return false;
  if (power.id === "recover" && p.hp >= 3) {
    announce(state, "VIDAS COMPLETAS");
    return false;
  }
  p.powerCooldown = power.cooldown;
  p.powerTimer = power.duration;
  p.powerAnimation = power.id === "dash" ? 0 : 36;
  p.activation++;
  p.activatedAt = state.tick;
  state.events.push(power.id === "dash" ? "dash" : "power");
  announce(state, power.name.toUpperCase());
  if (power.id === "dash") {
    p.dash = 10;
    p.dashCooldown = power.cooldown;
  }
  if (power.id === "recover") p.hp = Math.min(3, p.hp + 1);
  if (power.id === "closing")
    state.bullets.push({
      x: p.x + p.width - 10,
      y: p.y + p.height / 2,
      width: 44,
      height: 12,
      vx: 14,
      vy: 0,
      enemy: false,
      damage: 4,
      pierce: 1,
    });
  if (power.id === "barrier")
    state.barrier = {
      x: p.x + p.width + 22,
      y: Math.max(8, p.y - 35),
      width: 18,
      height: 180,
      life: power.duration,
    };
  const center = { x: p.x + p.width / 2, y: p.y + p.height / 2 };
  const distance = (entity) =>
    Math.hypot(
      entity.x + entity.width / 2 - center.x,
      entity.y + entity.height / 2 - center.y,
    );
  if (power.id === "pulse") {
    for (const e of state.enemies)
      if (distance(e) <= 420) defeatEnemy(state, e, random);
    if (state.boss && distance(state.boss) <= 420) hitBoss(state, 3, random);
  }
  if (power.id === "calm") {
    for (const e of state.enemies)
      if (!e.dead && distance(e) <= 300) e.x = Math.min(980, e.x + 210);
    state.bullets = state.bullets.filter((b) => !b.enemy || distance(b) > 300);
    p.grace = Math.max(p.grace, 45);
  }
  return true;
}
