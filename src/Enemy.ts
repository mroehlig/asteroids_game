export default class Enemy extends Phaser.Physics.Matter.Sprite {
  private static readonly name = "enemy";
  private static readonly radius = 32;

  static preload(scene: Phaser.Scene) {
    const name = Enemy.name;
    const radius = Enemy.radius;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(radius, radius, radius);

    g.generateTexture(name, radius * 2, radius * 2);
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
    x: number,
    y: number,
    texture: string,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Enemy.getShape();
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
