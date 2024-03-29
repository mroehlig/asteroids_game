import Phaser from "phaser";

import Entity from "./Entity";

export default class Asteroid extends Entity {
  public static readonly name = "asteroid";
  public static readonly width = 32;
  public static readonly height = 32;

  static preload(scene: Phaser.Scene) {
    const width = Asteroid.width;
    const height = Asteroid.height;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // Idle asteroid.
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillRect(0, 0, width, height);
    g.strokeRect(0, 0, width, height);
    g.generateTexture(Asteroid.name + "-idle", width, height);

    // Hit asteroid.
    g.fillStyle(0x666666, 1);
    g.lineStyle(1, 0xdddddd, 1.0);
    g.fillRect(0, 0, width, height);
    g.strokeRect(0, 0, width, height);
    g.generateTexture(Asteroid.name + "-hit", width, height);

    g.destroy();
  }

  static getShape() {
    return {
      type: "rectangle",
      width: Asteroid.width,
      height: Asteroid.height,
    };
  }

  constructor(
    world: Phaser.Physics.Matter.World,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Asteroid.getShape();
    super(world, 0, 0, Asteroid.name, bodyOptions);

    this.setFrictionAir(0);
    this.setBounce(0.5);
    this.setOrigin(0.5, 0.5);
  }

  spawn(width: number, height: number) {
    this.lives = 4;
    this.score = 10;

    // Spawn the asteroid outside the screen.
    const x = Phaser.Math.Between(0, 1) ? -this.width : width + this.width;
    const y = Phaser.Math.Between(0, 1) ? -this.height : height + this.height;
    this.setPosition(x, y);

    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.FloatBetween(1, 3);
    this.setAngle(angle);
    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));
    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));

    this.setActive(true);
    this.setVisible(true);
    this.world.add(this.body);

    this.play(this.states.get("idle").name, true);
  }
}
