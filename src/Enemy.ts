export default class Enemy extends Phaser.Physics.Matter.Sprite {
  private static readonly nameIdle = "enemy-idle";
  private static readonly nameHit = "enemy-hit";
  private static readonly radius = 32;

  static preload(scene: Phaser.Scene) {
    const radius = Enemy.radius;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // Idle enemy.
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillCircle(radius, radius, radius);
    g.strokeCircle(radius, radius, radius);
    g.generateTexture(Enemy.nameIdle, radius * 2, radius * 2);

    // Hit enemy.
    g.fillStyle(0x666666, 1);
    g.lineStyle(1, 0xdddddd, 1.0);
    g.fillCircle(radius, radius, radius);
    g.strokeCircle(radius, radius, radius);
    g.generateTexture(Enemy.nameHit, radius * 2, radius * 2);

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
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Enemy.getShape();
    super(world, x, y, Enemy.nameIdle, null, bodyOptions);

    this.setFrictionAir(0);

    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.FloatBetween(1, 3);

    this.setAngle(angle);

    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));

    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));

    // Create animations.
    this.anims.create({
      key: Enemy.nameIdle,
      frames: [{ key: Enemy.nameIdle }],
    });

    this.anims.create({
      key: Enemy.nameHit,
      frames: [{ key: Enemy.nameHit }],
      frameRate: 20,
      repeat: 0,
    });

    // Listen for animation complete event.
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + Enemy.nameHit,
      () => {
        this.play(Enemy.nameIdle, true);
      }
    );

    this.play(Enemy.nameIdle, true);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }

  handleHit() {
    // this.setActive(false);
    // this.setVisible(false);
    // this.world.remove(this.body, true);

    this.play(Enemy.nameHit, true);

    return false;
  }
}
