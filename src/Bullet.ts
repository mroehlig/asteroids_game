import Phaser from "phaser";

export class Bullet extends Phaser.Physics.Arcade.Image {
  fire(x: number, y: number, vx: number, vy: number) {
    this.enableBody(true, x, y, true, true);
    this.setVelocity(vx, vy);
  }

  onCreate() {
    this.disableBody(true, true);
    this.setCollideWorldBounds(true);
    (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
  }

  onWorldBounds() {
    this.disableBody(true, true);
  }
}

export class Bullets extends Phaser.Physics.Arcade.Group {
  constructor(
    world: Phaser.Physics.Arcade.World,
    scene: Phaser.Scene,
    config: Phaser.Types.Physics.Arcade.PhysicsGroupConfig
  ) {
    super(world, scene, {
      ...config,
      classType: Bullet,
      createCallback: (item: Phaser.GameObjects.GameObject) =>
        this.onCreate(item as Bullet),
    });
  }

  fire(x: number, y: number, vx: number, vy: number) {
    const bullet = this.getFirstDead(false);

    if (bullet) {
      bullet.fire(x, y, vx, vy);
    }
  }

  onCreate(bullet: Bullet) {
    bullet.onCreate();
  }

  poolInfo() {
    return `${this.name} total=${this.getLength()} active=${this.countActive(
      true
    )} inactive=${this.countActive(false)}`;
  }
}
