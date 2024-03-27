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
      const bullet = new Bullet(this.matter.world, 0, 0, "bullet", {
        collisionFilter: {
          category: this.bulletCollisionCategory,
          mask: this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
        },
        plugin: wrapBounds,
      });
      bullet.setOnCollide(this.hitBullet);
      this.add.existing(bullet);
      this.bullets.push(bullet);
    }

    // Create the ship.
    this.ship = new Ship(this.matter.world, width / 2, height / 2, "ship", {
      collisionFilter: {
        category: this.shipCollisionCategory,
        mask: this.enemiesCollisionCategory | this.asteroidsCollisionCategory,
      },
      plugin: wrapBounds,
    });
    this.add.existing(this.ship);

    // Create the enemies.
    this.enemies = [];
    for (let i = 0; i < 6; i++) {
      const enemy = new Enemy(
        this.matter.world,
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        "enemy",
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
    for (let i = 0; i < 16; i++) {
      const asteroid = new Asteroid(
        this.matter.world,
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        "asteroid",
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

    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.world.remove(enemy.body, true);
  }

  update(time: number) {
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-0.15);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(0.15);
    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.ship.thrust(0.0002);
    } else if (this.cursors.down.isDown) {
      this.ship.thrust(-0.0002);
    }

    if (this.cursors.space.isDown) {
      this.ship.fire(this.bullets, time);
    }
  }
}
