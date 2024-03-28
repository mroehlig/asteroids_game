import Phaser from "phaser";

import Entity from "./Entity";

export default class Enemy extends Entity {
  private static readonly name = "enemy";
  private static readonly radius = 32;

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

  constructor(
    world: Phaser.Physics.Matter.World,
    width: number,
    height: number,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Enemy.getShape();
    super(world, 0, 0, Enemy.name, bodyOptions);

    this.setFrictionAir(0);
    this.setOrigin(0.5, 0.5);
    this.reset(width, height);
  }

  reset(width: number, height: number) {
    this.lives = 10;

    this.setPosition(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(0, height)
    );

    const angle = Phaser.Math.Between(0, 360);
    this.setAngle(angle);
    const speed = Phaser.Math.FloatBetween(1, 3);
    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));
    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));

    this.setActive(true);
    this.setVisible(true);
    this.world.add(this.body);

    this.play(this.states.idle, true);
  }
}
