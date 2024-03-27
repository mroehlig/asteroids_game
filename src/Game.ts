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

  private shipCollisionCategory: number;
  private bulletCollisionCategory: number;
  private enemiesCollisionCategory: number;
  private asteroidsCollisionCategory: number;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  private livesText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private score: number = 0;
  private gameOverText: Phaser.GameObjects.Text;

  preload() {
    // Get game width and height.
    const { width, height } = this.game.canvas;

    // Preload.
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        color: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "0%",
      style: {
        font: "18px monospace",
        color: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
      percentText.setText(Math.floor(value * 100) + "%");
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

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
    this.ship.setOnCollide(this.ship.handleHit.bind(this.ship));
    this.ship.setOnHit(this.onShipHit.bind(this));
    this.ship.setOnDeath(this.onShipDeath.bind(this));
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
      enemy.setOnDeath(this.onEnemyDeath.bind(this));
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
      asteroid.setOnDeath(this.onEnemyDeath.bind(this));
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
    this.input.keyboard.on("keydown-ENTER", () => {
      // if (this.ship.lives <= 0) {
      this.restart();
      // }
    });

    // Create the lives text.
    this.livesText = this.add.text(16, 16, "Lives: " + this.ship.lives, {
      fontSize: "12px",
      color: "#dddddd",
    });

    // Create the score text.
    this.scoreText = this.add.text(width - 120, 16, "Score: 0", {
      fontSize: "12px",
      color: "#dddddd",
    });

    // Create the game over text.
    this.gameOverText = this.add.text(width / 2, height / 2, "Game Over", {
      fontSize: "32px",
      color: "#dddddd",
    });
    this.gameOverText.setOrigin(0.5, 0.5);
    this.gameOverText.setVisible(false);
  }

  restart() {
    this.gameOverText.setVisible(false);
    this.score = 0;

    const { width, height } = this.game.canvas;
    this.ship.reset(width, height);
    this.enemies.forEach((e) => e.reset(width, height));
    this.asteroids.forEach((a) => a.reset(width, height));

    this.scene.restart();
  }

  hitBullet(collisionData: Phaser.Types.Physics.Matter.MatterCollisionData) {
    const bullet = collisionData.bodyA.gameObject;
    const enemy = collisionData.bodyB.gameObject;

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.world.remove(bullet.body, true);

    enemy.handleHit();
  }

  onEnemyDeath(object: Phaser.Physics.Matter.Sprite) {
    // Emit explosion.
    this.explosionEmitter.explode(16, object.x, object.y);

    // Update score.
    this.score += 100;
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
  }

  update(time: number) {
    this.ship.update(this, this.cursors, this.bullets, time);
  }
}
