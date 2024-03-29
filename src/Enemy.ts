import Phaser from "phaser";

import Entity from "./Entity";
import Bullet from "./Bullet";
import Ship from "./Ship";

export default class Enemy extends Entity {
  public static readonly name = "enemy";
  public static readonly radius = 32;

  static preload(scene: Phaser.Scene) {
    const radius = Enemy.radius;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // Idle enemy.
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillCircle(radius, radius, radius);
    g.strokeCircle(radius, radius, radius);
    g.generateTexture(Enemy.name + "-idle", radius * 2, radius * 2);

    // Hit enemy.
    g.fillStyle(0x666666, 1);
    g.lineStyle(1, 0xdddddd, 1.0);
    g.fillCircle(radius, radius, radius);
    g.strokeCircle(radius, radius, radius);
    g.generateTexture(Enemy.name + "-hit", radius * 2, radius * 2);

    g.destroy();
  }

  static getShape() {
    return {
      type: "circle",
      radius: Enemy.radius,
    };
  }

  protected fireTime = 0;

  constructor(
    world: Phaser.Physics.Matter.World,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Enemy.getShape();
    super(world, 0, 0, Enemy.name, bodyOptions);

    this.setFrictionAir(0);
    this.setBounce(0.5);
    this.setOrigin(0.5, 0.5);
  }

  spawn(width: number, height: number) {
    this.lives = 10;
    this.score = 100;
    this.fireTime = 0;

    // Spawn the enemy outside the screen.
    const x = Phaser.Math.Between(0, 1) ? -this.width : width + this.width;
    const y = Phaser.Math.Between(0, 1) ? -this.height : height + this.height;
    this.setPosition(x, y);

    const angle = Phaser.Math.Between(0, 360);
    this.setAngle(angle);
    const speed = Phaser.Math.FloatBetween(1, 2);
    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));
    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));

    this.setActive(true);
    this.setVisible(true);
    this.world.add(this.body);

    this.play(this.states.get("idle").name, true);
  }

  update(ship: Ship, bullets: Bullet[], time: number): void {
    // Randomly change direction.
    if (Phaser.Math.Between(0, 100) < 1) {
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.FloatBetween(1, 2);
      this.setVelocityX(
        Phaser.Math.Clamp(this.body.velocity.x + speed * Math.cos(angle), -2, 2)
      );
      this.setVelocityY(
        Phaser.Math.Clamp(this.body.velocity.y + speed * Math.sin(angle), -2, 2)
      );
    }

    // Randomly fire.
    if (Phaser.Math.Between(0, 100) < 1) {
      this.fire(ship, bullets, time);
    }
  }

  fire(ship: Ship, bullets: Bullet[], time: number) {
    if (time < this.fireTime + 1000) {
      return;
    }

    // Check if the ship is close enough.
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      ship.x,
      ship.y
    );
    if (distance > 500) {
      return;
    }

    // Find an inactive bullet.
    const bullet = bullets.find((b) => !b.active);
    if (!bullet) {
      return;
    }

    // Fire the bullet in the direction of the ship.
    const angle = Phaser.Math.Angle.Between(this.x, this.y, ship.x, ship.y);
    bullet.fire(this.x, this.y, angle, 5);
    this.fireTime = time;
  }
}
