import Phaser from "phaser";

export default class Asteroid extends Phaser.Physics.Matter.Sprite {
  private static readonly nameIdle = "asteroid-idle";
  private static readonly nameHit = "asteroid-hit";
  private static readonly width = 32;
  private static readonly height = 32;

  static preload(scene: Phaser.Scene) {
    const width = Asteroid.width;
    const height = Asteroid.height;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // Idle asteroid.
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillRect(0, 0, width, height);
    g.strokeRect(0, 0, width, height);
    g.generateTexture(Asteroid.nameIdle, width, height);

    // Hit asteroid.
    g.fillStyle(0x666666, 1);
    g.lineStyle(1, 0xdddddd, 1.0);
    g.fillRect(0, 0, width, height);
    g.strokeRect(0, 0, width, height);
    g.generateTexture(Asteroid.nameHit, width, height);

    g.destroy();
  }

  static getShape() {
    return {
      type: "rectangle",
      width: Asteroid.width,
      height: Asteroid.height,
    };
  }

  private lives = 4;
  private onDeath: (object: Phaser.Physics.Matter.Sprite) => void;

  constructor(
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Asteroid.getShape();
    super(world, x, y, Asteroid.nameIdle, null, bodyOptions);

    this.setFrictionAir(0);

    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.FloatBetween(1, 3);

    this.setAngle(angle);

    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));

    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));

    // Create animations.
    this.anims.create({
      key: Asteroid.nameIdle,
      frames: [{ key: Asteroid.nameIdle }],
    });

    this.anims.create({
      key: Asteroid.nameHit,
      frames: [{ key: Asteroid.nameHit }],
      frameRate: 20,
      repeat: 0,
    });

    // Listen for animation complete event.
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + Asteroid.nameHit,
      () => {
        this.handleLostLife();
      }
    );

    this.play(Asteroid.nameIdle, true);
  }

  reset(width: number, height: number) {
    this.lives = 4;
    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.FloatBetween(1, 3);
    this.setAngle(angle);
    this.setAngularVelocity(Phaser.Math.FloatBetween(-0.05, 0.05));
    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));
    this.x = Phaser.Math.Between(0, width);
    this.y = Phaser.Math.Between(0, height);

    this.setActive(true);
    this.setVisible(true);
    this.world.add(this.body);

    this.play(Asteroid.nameIdle, true);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }

  setOnDeath(callback: (object: Phaser.Physics.Matter.Sprite) => void) {
    this.onDeath = callback;
  }

  isPlaying(name: string) {
    return this.anims.isPlaying && this.anims.getName() === name;
  }

  handleLostLife() {
    this.lives--;

    if (this.lives <= 0) {
      this.handleDeath();
    } else {
      this.play(Asteroid.nameIdle, true);
    }
  }

  handleHit() {
    if (!this.isPlaying(Asteroid.nameHit)) {
      this.play(Asteroid.nameHit, true);
    }
  }

  handleDeath() {
    if (this.onDeath) {
      this.onDeath(this);
    }

    this.setActive(false);
    this.setVisible(false);
    this.world.remove(this.body, true);
  }
}
