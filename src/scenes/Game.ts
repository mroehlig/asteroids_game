import Phaser from "phaser";

import Hud from "./Hud";
import Entity from "../entities/Entity";
import Ship from "../entities/Ship";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";
import Asteroid, { AsteroidType } from "../entities/Asteroid";
import Input from "../Input";

export default class Game extends Phaser.Scene {
  public ship: Ship;
  private bullets: Bullet[] = [];
  private bombs: Bullet[] = [];
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

  public cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  public keys: any;
  private lastInput: Input = {
    left: false,
    right: false,
    forward: false,
    backward: false,
    shoot: false,
    boost: false,
    bomb: false,
  };

  public score: number = 0;
  private paused: boolean = false;

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
      const bullet = new Bullet(
        this.matter.world,
        {
          collisionFilter: {
            category: this.bulletCollisionCategory,
            mask:
              this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
          },
          plugin: wrapBounds,
        },
        Bullet.types.small
      );
      bullet.setOnCollide(this.hitBullet.bind(this));
      this.add.existing(bullet);
      this.bullets.push(bullet);
    }

    // Create the bombs.
    for (let i = 0; i < 1; i++) {
      const bullet = new Bullet(
        this.matter.world,
        {
          collisionFilter: {
            category: this.bulletCollisionCategory,
            mask:
              this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
          },
          plugin: wrapBounds,
        },
        Bullet.types.bomb,
        5,
        5000
      );
      bullet.setOnCollide(this.hitBullet.bind(this));
      this.add.existing(bullet);
      this.bombs.push(bullet);
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
        Bullet.types.long,
        1,
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
    this.ship.setOnCollide(() => this.ship.handleHit());
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
      },
      true,
      true
    );
  }

  spawnAsteroid(type: AsteroidType) {
    const { width, height } = this.game.canvas;

    // Find inactive asteroid.
    const inactiveAsteroid = this.asteroids.find(
      (a) => !a.active && a.config.type === type
    );
    if (inactiveAsteroid) {
      // Respawn asteroid.
      inactiveAsteroid.spawn(width, height);
    } else {
      // Create a new asteroid.
      const asteroid = new Asteroid(
        this.matter.world,
        {
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
        },
        type
      );
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
    this.score = 0;

    // Despawn enemies and asteroids.
    const { width, height } = this.game.canvas;
    this.enemies.forEach((e) => e.despawn());
    this.asteroids.forEach((a) => a.despawn());

    // Respawn ship.
    this.ship.spawn(width, height);

    // Reset timers.
    this.enemiesTimer = this.game.getTime();
    this.asteroidTimer = this.game.getTime();
  }

  hitBullet(collisionData: Phaser.Types.Physics.Matter.MatterCollisionData) {
    const bullet = collisionData.bodyA.gameObject;
    const entity = collisionData.bodyB.gameObject;

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.world.remove(bullet.body, true);

    entity.handleHit(bullet?.damage || 1);
  }

  onEnemyDeath(entity: Entity) {
    // Emit explosion.
    this.explosionEmitter.explode(16, entity.x, entity.y);

    // Update score.
    this.score += entity.score;
    (this.scene.get("hud") as Hud).setScore(this.score);
  }

  onShipHit() {
    (this.scene.get("hud") as Hud).setLives(this.ship.lives);
  }

  onShipDeath(object: Phaser.Physics.Matter.Sprite) {
    // Emit explosion.
    this.explosionEmitter.explode(16, object.x, object.y);

    const hud = this.scene.get("hud") as Hud;
    hud.gameOver();
  }

  getInput(
    gamepad: Phaser.Input.Gamepad.Gamepad,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: any,
    lastInput: Input = null
  ) {
    const inputs = {
      left: cursors.left.isDown || keys.left.isDown || gamepad?.left,
      right: cursors.right.isDown || keys.right.isDown || gamepad?.right,
      forward: cursors.up.isDown || keys.forward.isDown || gamepad?.up,
      backward: cursors.down.isDown || keys.backward.isDown || gamepad?.down,
      shoot: cursors.space.isDown || keys.shoot.isDown || gamepad?.A,
      boost: keys.boost.isDown || gamepad?.L1,
      bomb: keys.bomb.isDown || gamepad?.X,
    };

    let justInputs = null;
    if (lastInput) {
      justInputs = {
        left: inputs.left && !lastInput.left,
        right: inputs.right && !lastInput.right,
        forward: inputs.forward && !lastInput.forward,
        backward: inputs.backward && !lastInput.backward,
        shoot: inputs.shoot && !lastInput.shoot,
        boost: inputs.boost && !lastInput.boost,
        bomb: inputs.bomb && !lastInput.bomb,
      };
    }

    return { down: inputs, just: justInputs };
  }

  update(time: number) {
    if (this.paused) {
      return;
    }

    // Get input.
    const gamepad = this.input.gamepad.getPad(0);
    const input = this.getInput(
      gamepad,
      this.cursors,
      this.keys,
      this.lastInput
    );
    this.lastInput = input.down;

    // Spawn asteroid.
    if (time > this.asteroidTimer + 5000) {
      this.asteroidTimer = time;

      // Random asteroid type.
      const type = Phaser.Math.RND.pick(Object.values(Asteroid.configs)).type;
      this.spawnAsteroid(type);
    }

    // Spawn enemy.
    if (time > this.enemiesTimer + 30000) {
      this.enemiesTimer = time;
      this.spawnEnemy();
    }

    // Update ship.
    this.ship.update(time, input, this.bullets, this.bombs);

    // Update enemies.
    this.enemies.forEach((e) => {
      if (e.active) {
        e.update(time, this.ship, this.enemyBullets);
      }
    });
  }
}
