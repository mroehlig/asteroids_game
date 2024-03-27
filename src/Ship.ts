export default class Ship extends Phaser.Physics.Matter.Sprite {
  private static readonly name = "ship";
  private static readonly width = 32;
  private static readonly height = 16;

  static preload(scene: Phaser.Scene) {
    const name = Ship.name;
    const width = Ship.width;
    const height = Ship.height;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.lineStyle(1, 0xff0000, 1.0);

    g.fillTriangle(0, 0, width, height / 2, 0, height);
    g.strokeTriangle(0, 0, width, height / 2, 0, height);

    g.generateTexture(name, width, height);
    g.destroy();
  }

  static getShape() {
    return {
      type: "fromVertices",
      verts: [
        { x: 0, y: 0 },
        { x: Ship.width, y: Ship.height / 2 },
        { x: 0, y: Ship.height },
      ],
    };
  }

  constructor(
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    texture: string,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Ship.getShape();
    super(world, x, y, texture, null, bodyOptions);

    this.setFrictionAir(0.02);
    this.setFixedRotation();
    this.setAngle(-90);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }
}
