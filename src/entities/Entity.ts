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
  public score = 0;
  public hit = false;
  public dead = true;
  protected onHit: (entity: Entity) => void;
  protected onDeath: (entity: Entity) => void;

  constructor(
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    name: string,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    super(world, x, y, name, null, bodyOptions);

    // Deactivate at beginning.
    this.setActive(false);
    this.setVisible(false);
    this.world.remove(this.body, true);

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

  spawn(_width: number, _height: number) {
    if (this.dead) {
      this.setActive(true);
      this.setVisible(true);

      if (!this.world.has(this.body)) {
        this.world.add(this.body);
      }
    }

    this.lives = 1;
    this.hit = false;
    this.dead = false;

    this.play(this.states.get("idle").name, true);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    if (this.dead || this.lives <= 0) {
      this.setActive(false);
      this.setVisible(false);
      this.world.remove(this.body, true);
    }
  }

  setOnHit(callback: (entity: Entity) => void) {
    this.onHit = callback;
  }

  setOnDeath(callback: (entity: Entity) => void) {
    this.onDeath = callback;
  }

  handleLostLife() {
    if (this.dead) {
      return;
    }

    this.hit = false;
    if (this.lives <= 0) {
      this.handleDeath();
    } else {
      this.play(this.states.get("idle").name, true);
    }
  }

  handleHit(damage: number = 1) {
    if (this.hit || this.dead) {
      return;
    }
    this.hit = true;

    this.lives = Math.max(0, this.lives - damage);
    if (this.onHit) {
      this.onHit(this);
    }

    if (this.lives <= 0) {
      this.handleLostLife();
    } else {
      this.play(this.states.get("hit").name, true);
    }
  }

  handleDeath() {
    if (this.dead) {
      return;
    }
    this.dead = true;
    this.lives = 0;

    if (this.onDeath) {
      this.onDeath(this);
    }

    this.despawn();
  }

  despawn() {
    this.dead = true;
    this.hit = false;
    this.lives = 0;
  }
}
