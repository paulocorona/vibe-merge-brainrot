import { clamp } from "../util/easing";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  age: number;
  size: number;
  color: string;
  drag: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  /**
   * Emits a burst at (x, y). `color` is a hex string; particles are
   * drawn as glowing dots with simple linear physics.
   */
  burst(
    x: number,
    y: number,
    color: string,
    options: {
      count?: number;
      speed?: number;
      size?: number;
      life?: number;
      gravity?: number;
    } = {},
  ): void {
    const count = options.count ?? 18;
    const speed = options.speed ?? 220;
    const size = options.size ?? 6;
    const life = options.life ?? 0.55;
    const gravity = options.gravity ?? 360;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const s = speed * (0.6 + Math.random() * 0.6);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        ax: 0,
        ay: gravity,
        life,
        age: 0,
        size: size * (0.7 + Math.random() * 0.8),
        color,
        drag: 0.9,
      });
    }
  }

  sparkle(x: number, y: number, color = "#ffffff"): void {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        ax: 0,
        ay: 0,
        life: 0.45 + Math.random() * 0.25,
        age: 0,
        size: 3 + Math.random() * 4,
        color,
        drag: 0.86,
      });
    }
  }

  update(dt: number): void {
    if (this.particles.length === 0) return;
    const survivors: Particle[] = [];
    for (const p of this.particles) {
      p.age += dt;
      if (p.age >= p.life) continue;
      p.vx = p.vx * p.drag + p.ax * dt;
      p.vy = p.vy * p.drag + p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      survivors.push(p);
    }
    this.particles = survivors;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      const t = p.age / p.life;
      const alpha = clamp(1 - t, 0, 1);
      const radius = p.size * (1 - t * 0.4);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear(): void {
    this.particles = [];
  }

  isEmpty(): boolean {
    return this.particles.length === 0;
  }
}
