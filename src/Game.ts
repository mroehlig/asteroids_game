import Phaser from "phaser";

import Ship from "./Ship";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import Asteroid from "./Asteroid";

export default class Game extends Phaser.Scene {
  private ship: Ship;
  private bullets: Bullet[];
  private enemies: Enemy[];
  private asteroids: Asteroid[];

  // Explosion emitter.
  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionTexture: Phaser.Textures.Texture;

  private shipCollisionCategory: number;
  private bulletCollisionCategory: number;
  private enemiesCollisionCategory: number;
  private asteroidsCollisionCategory: number;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  preload() {
    // Create game textures.
    Ship.preload(this);
    Bullet.preload(this);
    Enemy.preload(this);
    Asteroid.preload(this);
  }

  create() {
    // Get game width and height.
    const { width, height } = this.game.canvas;

    // Create world bounds wrap.
    const wrapBounds = {
      wrap: {
        min: { x: 0, y: 0 },
        max: { x: width, y: height },
      },
    };

    // Create the collision categories.
    this.enemiesCollisionCategory = this.matter.world.nextCategory();
    this.shipCollisionCategory = this.matter.world.nextCategory();
    this.bulletCollisionCategory = this.matter.world.nextCategory();
    this.asteroidsCollisionCategory = this.matter.world.nextCategory();

    // Create the bullets.
    this.bullets = [];
    for (let i = 0; i < 64; i++) {
      const bullet = new Bullet(this.matter.world, 0, 0, {
        collisionFilter: {
          category: this.bulletCollisionCategory,
          mask: this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
        },
        plugin: wrapBounds,
      });
      bullet.setOnCollide(
        (collisionData: Phaser.Types.Physics.Matter.MatterCollisionData) =>
          this.hitBullet(collisionData)
      );
      this.add.existing(bullet);
      this.bullets.push(bullet);
    }

    // Create the ship.
    this.ship = new Ship(this, this.matter.world, width / 2, height / 2, {
      collisionFilter: {
        category: this.shipCollisionCategory,
        mask: this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
      },
      plugin: wrapBounds,
    });
    this.add.existing(this.ship);

    // Create the enemies.
    this.enemies = [];
    for (let i = 0; i < 1; i++) {
      const enemy = new Enemy(
        this.matter.world,
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        {
          collisionFilter: {
            category: this.enemiesCollisionCategory,
            mask:
              this.shipCollisionCategory |
              this.bulletCollisionCategory |
              this.asteroidsCollisionCategory |
              this.enemiesCollisionCategory,
          },
          plugin: wrapBounds,
        }
      );
      this.add.existing(enemy);
      this.enemies.push(enemy);
    }

    // Create the asteroids.
    this.asteroids = [];
    for (let i = 0; i < 4; i++) {
      const asteroid = new Asteroid(
        this.matter.world,
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        {
          collisionFilter: {
            category: this.asteroidsCollisionCategory,
            mask:
              this.shipCollisionCategory |
              this.bulletCollisionCategory |
              this.asteroidsCollisionCategory |
              this.enemiesCollisionCategory,
          },
          plugin: wrapBounds,
        }
      );
      this.add.existing(asteroid);
      this.asteroids.push(asteroid);
    }

    // Create the explosion texture.
    const explosionName = "explosion";
    const explosionRadius = 5;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillRect(0, 0, explosionRadius * 2, explosionRadius * 2);
    g.strokeRect(0, 0, explosionRadius * 2, explosionRadius * 2);
    g.generateTexture(explosionName, explosionRadius * 2, explosionRadius * 2);
    g.destroy();

    // Create the explosion emitter.
    this.explosionEmitter = this.add.particles(0, 0, explosionName, {
      emitZone: {
        type: "random",
        source: new Phaser.Geom.Circle(10, 10, 20),
        quantity: 16,
      },
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { min: 0.0, max: 1.0 },
      lifespan: 1000,
      blendMode: "ADD",
      emitting: false,
    });

    // Create the input.
    this.cursors = this.input.keyboard.createCursorKeys();
    // this.input.keyboard.on("keydown-SPACE", () => {
    //   this.ship.fire(this.bullets, this.game.getTime());
    // });
  }

  hitBullet(collisionData: Phaser.Types.Physics.Matter.MatterCollisionData) {
    const bullet = collisionData.bodyA.gameObject;
    const enemy = collisionData.bodyB.gameObject;

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.world.remove(bullet.body, true);

    const destroyed = enemy.handleHit();

    // Emit explosion.
    if (destroyed) {
      this.explosionEmitter.explode(16, enemy.x, enemy.y);
    }
  }

  update(time: number) {
    this.ship.update(this, this.cursors, this.bullets, time);
  }
}
