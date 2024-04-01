import Phaser from "phaser";

interface BulletConfig {
  name: string;
  width: number;
  height: number;
}

export default class Bullet extends Phaser.Physics.Matter.Sprite {
  public static readonly types = {
    small: { name: "bullet-small", type: "bullet", width: 8, height: 4 },
    long: { name: "bullet-long", type: "enemy", width: 16, height: 8 },
    bomb: { name: "bullet-bomb", type: "bomb", width: 8, height: 8 },
  };

  static preload(scene: Phaser.Scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    for (const type of Object.values(Bullet.types)) {
      g.clear();
      g.fillStyle(0x333333, 1);
      g.lineStyle(1, 0x999999, 1.0);

      g.fillRoundedRect(0, 0, type.width, type.height, type.height / 2);
      g.strokeRoundedRect(0, 0, type.width, type.height, type.height / 2);

      g.generateTexture(type.name, type.width, type.height);
    }

    g.destroy();
  }

  static getShape(config: BulletConfig) {
    return {
      type: "rectangle",
      width: config.width,
      height: config.height,
    };
  }

  public config: BulletConfig;
  public damage = 1;
  private lifespan: number = 1000;
  private lifeTimer: number = 0;

  constructor(
    world: Phaser.Physics.Matter.World,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig,
    config: BulletConfig,
    damage: number = 1,
    lifespan: number = 1000
  ) {
    bodyOptions.shape = bodyOptions.shape || Bullet.getShape(config);
    super(world, 0, 0, config.name, null, bodyOptions);

    this.config = config;
    this.damage = damage;
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

  handleHit(_damage: number = 1) {
    this.setActive(false);
    this.setVisible(false);
    this.world.remove(this.body, true);
    this.lifeTimer = 0;
  }
}
