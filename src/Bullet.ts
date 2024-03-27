import Phaser from "phaser";

export default class Bullet extends Phaser.Physics.Matter.Sprite {
  private static readonly nameIdle = "bullet";
  private static readonly radius = 2;

  static preload(scene: Phaser.Scene) {
    const radius = Bullet.radius;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);

    g.fillCircle(radius, radius, radius);
    g.strokeCircle(radius, radius, radius);

    g.generateTexture(Bullet.nameIdle, radius * 2, radius * 2);
    g.destroy();
  }

  static getShape() {
    return {
      type: "circle",
      radius: Bullet.radius,
    };
  }

  private lifespan: number = 0;

  constructor(
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Bullet.getShape();
    super(world, x, y, Bullet.nameIdle, null, bodyOptions);

    this.setFrictionAir(0);
    this.setFixedRotation();
    this.setActive(false);

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

    this.lifespan = 1000;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    this.lifespan -= delta;

    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
      this.world.remove(this.body, true);
    }
  }
}
