import Phaser from "phaser";

export default class Asteroid extends Phaser.Physics.Matter.Sprite {
  private static readonly name = "asteroid";
  private static readonly width = 32;
  private static readonly height = 32;

  static preload(scene: Phaser.Scene) {
    const name = Asteroid.name;
    const width = Asteroid.width;
    const height = Asteroid.height;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, width, height);

    g.generateTexture(name, width, height);
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
    x: number,
    y: number,
    texture: string,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Asteroid.getShape();
    super(world, x, y, texture, null, bodyOptions);

    this.setFrictionAir(0);

    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.FloatBetween(1, 3);

    this.setAngle(angle);

    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));

    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }
}
