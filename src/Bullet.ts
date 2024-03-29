import Phaser from "phaser";

export default class Bullet extends Phaser.Physics.Matter.Sprite {
  private static readonly nameIdle = "bullet";
  private static readonly width = 8;
  private static readonly height = 4;

  static preload(scene: Phaser.Scene) {
    const width = Bullet.width;
    const height = Bullet.height;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);

    g.fillRoundedRect(0, 0, width, height, height / 2);
    g.strokeRoundedRect(0, 0, width, height, height / 2);

    g.generateTexture(Bullet.nameIdle, width, height);
    g.destroy();
  }

  static getShape() {
    return {
      type: "rectangle",
      width: Bullet.width,
      height: Bullet.height,
    };
  }

  private lifespan: number = 1000;
  private lifeTimer: number = 0;

  constructor(
    world: Phaser.Physics.Matter.World,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig,
    lifespan: number = 1000
  ) {
    bodyOptions.shape = bodyOptions.shape || Bullet.getShape();
    super(world, 0, 0, Bullet.nameIdle, null, bodyOptions);

    this.lifespan = lifespan;

    this.setFrictionAir(0);
    this.setFixedRotation();
    this.setActive(false);
    this.setOrigin(0.5, 0.5);

    this.world.remove(this.body, true);
  }

  fire(x: number, y: number, angle: number, speed: number) {
    this.world.add(this.body);

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.setRotation(angle);
    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));

    this.lifeTimer = this.lifespan;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    this.lifeTimer -= delta;

    if (this.lifeTimer <= 0) {
      this.setActive(false);
      this.setVisible(false);
      this.world.remove(this.body, true);
    }
  }
}
