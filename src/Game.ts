import Phaser from "phaser";

import Entity from "./Entity";
import Ship from "./Ship";
import Bullet from "./Bullet";
import Enemy from "./Enemy";
import Asteroid from "./Asteroid";

export default class Game extends Phaser.Scene {
  private ship: Ship;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private enemyBullets: Bullet[] = [];
  private enemiesTimer: number = 0;
  private asteroids: Asteroid[] = [];
  private asteroidTimer: number = 0;

  // Explosion emitter.
  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private shipCollisionCategory: number;
  private bulletCollisionCategory: number;
  private enemiesCollisionCategory: number;
  private enemyBulletCollisionCategory: number;
  private asteroidsCollisionCategory: number;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: object;

  private livesText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private score: number = 0;

  private gameOverText: Phaser.GameObjects.Text;
  private restartText: Phaser.GameObjects.Text;
  private restartTextTween: Phaser.Tweens.Tween;

  constructor() {
    super("game");
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
    this.shipCollisionCategory = this.matter.world.nextCategory();
    this.bulletCollisionCategory = this.matter.world.nextCategory();
    this.enemiesCollisionCategory = this.matter.world.nextCategory();
    this.enemyBulletCollisionCategory = this.matter.world.nextCategory();
    this.asteroidsCollisionCategory = this.matter.world.nextCategory();

    // Create the bullets.
    for (let i = 0; i < 64; i++) {
      const bullet = new Bullet(this.matter.world, {
        collisionFilter: {
          category: this.bulletCollisionCategory,
          mask: this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
        },
        plugin: wrapBounds,
      });
      bullet.setOnCollide(this.hitBullet.bind(this));
      this.add.existing(bullet);
      this.bullets.push(bullet);
    }

    // Create the enemy bullets.
    for (let i = 0; i < 5; i++) {
      const bullet = new Bullet(
        this.matter.world,
        {
          collisionFilter: {
            category: this.enemyBulletCollisionCategory,
            mask: this.shipCollisionCategory,
          },
          plugin: wrapBounds,
        },
        2000
      );
      bullet.setOnCollide(this.hitBullet.bind(this));
      this.add.existing(bullet);
      this.enemyBullets.push(bullet);
    }

    // Create the ship.
    this.ship = new Ship(this, this.matter.world, {
      collisionFilter: {
        category: this.shipCollisionCategory,
        mask:
          this.enemiesCollisionCategory |
          this.enemyBulletCollisionCategory |
          this.asteroidsCollisionCategory,
      },
      plugin: wrapBounds,
    });
    this.ship.setOnCollide(this.ship.handleHit.bind(this.ship));
    this.ship.setOnHit(this.onShipHit.bind(this));
    this.ship.setOnDeath(this.onShipDeath.bind(this));
    this.ship.spawn(width, height);
    this.add.existing(this.ship);

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
    this.keys = this.input.keyboard.addKeys(
      {
        forward: Phaser.Input.Keyboard.KeyCodes.W,
        backward: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        shoot: Phaser.Input.Keyboard.KeyCodes.SPACE,
        bomb: Phaser.Input.Keyboard.KeyCodes.B,
        boost: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        pause: Phaser.Input.Keyboard.KeyCodes.P,
        mute: Phaser.Input.Keyboard.KeyCodes.M,
      },
      true,
      true
    );

    this.input.keyboard.on("keydown-R", () => {
      this.restart();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.restartText.visible) {
        this.restart();
      }
    });

    // Create the lives text.
    this.livesText = this.add.text(16, 16, "Lives: " + this.ship.lives, {
      fontSize: "12px monospace",
      color: "#dddddd",
    });
    this.livesText.setDepth(1);

    // Create the score text.
    this.scoreText = this.add.text(width - 120, 16, "Score: 0", {
      font: "12px monospace",
      color: "#dddddd",
    });
    this.scoreText.setDepth(1);

    // Create the game over text.
    this.gameOverText = this.add.text(width / 2, height / 2, "Game Over", {
      font: "32px monospace",
      color: "#dddddd",
    });
    this.gameOverText.setDepth(1);
    this.gameOverText.setOrigin(0.5, 0.5);
    this.gameOverText.setVisible(false);

    // Create the restart text.
    this.restartText = this.add.text(
      width / 2,
      height / 2 + 32,
      "- Press shoot to restart -",
      {
        font: "16px monospace",
        color: "#dddddd",
      }
    );
    this.restartText.setDepth(1);
    this.restartText.setOrigin(0.5, 0.5);
    this.restartText.setVisible(false);

    this.restartTextTween = this.tweens.add({
      targets: this.restartText,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: 1000,
      persist: true,
      paused: true,
    });
  }

  spawnAsteroid() {
    const { width, height } = this.game.canvas;

    // Find inactive asteroid.
    const inactiveAsteroid = this.asteroids.find((a) => !a.active);
    if (inactiveAsteroid) {
      // Respawn asteroid.
      inactiveAsteroid.spawn(width, height);
    } else {
      // Create a new asteroid.
      const asteroid = new Asteroid(this.matter.world, {
        collisionFilter: {
          category: this.asteroidsCollisionCategory,
          mask:
            this.shipCollisionCategory |
            this.bulletCollisionCategory |
            this.asteroidsCollisionCategory |
            this.enemiesCollisionCategory,
        },
        plugin: {
          wrap: {
            min: { x: 0, y: 0 },
            max: { x: width, y: height },
          },
        },
      });
      asteroid.setOnDeath(this.onEnemyDeath.bind(this));
      asteroid.spawn(width, height);
      this.add.existing(asteroid);
      this.asteroids.push(asteroid);
    }
  }

  spawnEnemy() {
    const { width, height } = this.game.canvas;

    // Find inactive enemy.
    const inactiveEnemy = this.enemies.find((e) => !e.active);
    if (inactiveEnemy) {
      // Respawn enemy.
      inactiveEnemy.spawn(width, height);
    } else {
      // Create a new enemy.
      const enemy = new Enemy(this.matter.world, {
        collisionFilter: {
          category: this.enemiesCollisionCategory,
          mask:
            this.shipCollisionCategory |
            this.bulletCollisionCategory |
            this.asteroidsCollisionCategory |
            this.enemiesCollisionCategory,
        },
        plugin: {
          wrap: {
            min: { x: 0, y: 0 },
            max: { x: width, y: height },
          },
        },
      });
      enemy.setOnDeath(this.onEnemyDeath.bind(this));
      enemy.spawn(width, height);
      this.add.existing(enemy);
      this.enemies.push(enemy);
    }
  }

  restart() {
    this.gameOverText.setVisible(false);
    this.restartText.setVisible(false);
    this.restartTextTween.pause();
    this.score = 0;

    // Despawn enemies and asteroids.
    const { width, height } = this.game.canvas;
    this.enemies.forEach((e) => e.despawn());
    this.asteroids.forEach((a) => a.despawn());

    // Respawn ship and first asteroid.
    this.ship.spawn(width, height);
    this.asteroids[0].spawn(width, height);

    // Update score and lives.
    this.scoreText.setText("Score: " + this.score);
    this.livesText.setText("Lives: " + this.ship.lives);
  }

  hitBullet(collisionData: Phaser.Types.Physics.Matter.MatterCollisionData) {
    const bullet = collisionData.bodyA.gameObject;
    const entity = collisionData.bodyB.gameObject;

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.world.remove(bullet.body, true);

    entity.handleHit();
  }

  onEnemyDeath(entity: Entity) {
    // Emit explosion.
    this.explosionEmitter.explode(16, entity.x, entity.y);

    // Update score.
    this.score += entity.score;
    this.scoreText.setText("Score: " + this.score);
  }

  onShipHit() {
    this.livesText.setText("Lives: " + this.ship.lives);
  }

  onShipDeath(object: Phaser.Physics.Matter.Sprite) {
    // Emit explosion.
    this.explosionEmitter.explode(16, object.x, object.y);

    // Update game over text.
    this.gameOverText.setVisible(true);
    this.tweens.add({
      targets: this.gameOverText,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
    });

    // Update restart text.
    this.restartText.setVisible(true);
    this.restartTextTween.restart();
  }

  update(time: number) {
    // Spawn asteroid.
    // if (time > this.asteroidTimer + 5000) {
    //   this.asteroidTimer = time;
    //   this.spawnAsteroid();
    // }

    // Spawn enemy.
    if (time > this.enemiesTimer + 3000) {
      this.enemiesTimer = time;
      this.spawnEnemy();
    }

    // Update ship.
    this.ship.update(this, this.cursors, this.keys, this.bullets, time);

    // Update enemies.
    this.enemies.forEach((e) => e.update(this.ship, this.enemyBullets, time));
  }
}
