import Phaser from "phaser";

interface EntityState {
  name: string;
  anim: Phaser.Animations.Animation;
}

export default abstract class Entity extends Phaser.Physics.Matter.Sprite {
  protected states: Map<string, EntityState> = new Map([
    ["idle", { name: "idle", anim: null }],
    ["hit", { name: "hit", anim: null }],
  ]);

  public lives = 1;
  protected onHit: (object: Phaser.Physics.Matter.Sprite) => void;
  protected onDeath: (object: Phaser.Physics.Matter.Sprite) => void;

  constructor(
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    name: string,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    super(world, x, y, name, null, bodyOptions);

    // Create animations.
    this.states.forEach((state: EntityState) => {
      const anim = this.anims.create({
        key: state.name,
        frames: [{ key: `${name}-${state.name}` }],
        frameRate: 24,
      });

      if (anim) {
        state.anim = anim;
      }
    });

    // Listen for animation complete event.
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY +
        this.states.get("hit").name,
      () => {
        this.handleLostLife();
      }
    );
  }

  abstract reset(width: number, height: number): void;

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }

  setOnHit(callback: (object: Phaser.Physics.Matter.Sprite) => void) {
    this.onHit = callback;
  }

  setOnDeath(callback: (object: Phaser.Physics.Matter.Sprite) => void) {
    this.onDeath = callback;
  }

  isPlaying(name: string) {
    return this.anims.isPlaying && this.anims.getName() === name;
  }

  handleLostLife() {
    this.lives--;

    if (this.onHit) {
      this.onHit(this);
    }

    if (this.lives <= 0) {
      this.handleDeath();
    } else {
      this.play(this.states.get("idle").name, true);
    }
  }

  handleHit() {
    if (!this.isPlaying(this.states.get("hit").name)) {
      this.play(this.states.get("hit").name, true);
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
