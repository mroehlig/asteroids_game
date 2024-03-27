import Phaser from "phaser";
import Bullet from "./Bullet";

interface Input {
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
  shoot: boolean;
}

export default class Ship extends Phaser.Physics.Matter.Sprite {
  private static readonly nameIdle = "ship-idle";
  private static readonly nameHit = "ship-hit";
  private static readonly nameThrust = "ship-thrust";
  private static readonly width = 32;
  private static readonly height = 16;

  private thrustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private thrustEmitTime = 0;

  private lastInput: Input = {
    left: false,
    right: false,
    forward: false,
    backward: false,
    shoot: false,
  };
  private fireTime = 0;

  static preload(scene: Phaser.Scene) {
    const width = Ship.width;
    const height = Ship.height;
    const thrustRadius = height / 4;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // Draw the ship idle.
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillTriangle(0, 0, width, height / 2, 0, height);
    g.strokeTriangle(0, 0, width, height / 2, 0, height);
    g.generateTexture(Ship.nameIdle, width, height);

    // Draw the ship hit.
    g.fillStyle(0x666666, 1);
    g.lineStyle(1, 0xdddddd, 1.0);
    g.fillTriangle(0, 0, width, height / 2, 0, height);
    g.strokeTriangle(0, 0, width, height / 2, 0, height);
    g.generateTexture(Ship.nameHit, width, height);

    // Draw the ship thrust.
    g.clear();
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillRect(0, 0, thrustRadius * 2, thrustRadius * 2);
    g.strokeRect(0, 0, thrustRadius * 2, thrustRadius * 2);
    g.generateTexture(Ship.nameThrust, thrustRadius * 2, thrustRadius * 2);

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

  public lives = 3;
  private onHit: (object: Phaser.Physics.Matter.Sprite) => void;
  private onDeath: (object: Phaser.Physics.Matter.Sprite) => void;

  constructor(
    scene: Phaser.Scene,
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Ship.getShape();
    super(world, x, y, Ship.nameIdle, null, bodyOptions);

    this.setFrictionAir(0.02);
    this.setFixedRotation();
    this.setAngle(-90);

    // Create animations.
    this.anims.create({
      key: Ship.nameIdle,
      frames: [{ key: Ship.nameIdle }],
    });

    this.anims.create({
      key: Ship.nameHit,
      frames: [{ key: Ship.nameHit }],
      frameRate: 20,
      repeat: 0,
    });

    // Listen for animation complete event.
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + Ship.nameHit,
      () => {
        this.handleLostLife();
      }
    );

    this.play(Ship.nameIdle, true);

    // Create the thrust emitter.
    this.thrustEmitter = scene.add.particles(0, 0, Ship.nameThrust, {
      lifespan: 500,
      rotate: { min: 0, max: 360 },
      angle: { min: 0, max: 360 },
      speed: { min: 5, max: 15 },
      scale: { start: 1, end: 0.25 },
      emitting: false,
      frequency: 100,
      blendMode: "ADD",
      alpha: { min: 0.0, max: 1.0 },
    });
  }

  reset(width: number, height: number) {
    this.setActive(true);
    this.setVisible(true);
    this.world.add(this.body);
    this.setVelocity(0, 0);
    this.setPosition(width / 2, height / 2);
    this.setAngle(-90);
    this.lives = 3;
  }

  fire(bullets: Bullet[], time: number) {
    if (time < this.fireTime + 100) {
      return;
    }

    const bullet = bullets.find((b) => !b.active);
    if (!bullet) {
      return;
    }

    this.fireTime = time;
    bullet.fire(
      this.x + (Math.cos(this.rotation) * Ship.width) / 2,
      this.y + (Math.sin(this.rotation) * Ship.width) / 2,
      this.rotation,
      5
    );
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }

  getInput(
    scene: Phaser.Scene,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    lastInput: Input
  ) {
    const gamepad = scene.input.gamepad.getPad(0);
    const inputs = {
      left: cursors.left.isDown || gamepad?.left,
      right: cursors.right.isDown || gamepad?.right,
      forward: cursors.up.isDown || gamepad?.up,
      backward: cursors.down.isDown || gamepad?.down,
      shoot: cursors.space.isDown || gamepad?.A,
    };
    const justInputs = {
      left: inputs.left && !lastInput.left,
      right: inputs.right && !lastInput.right,
      forward: inputs.forward && !lastInput.forward,
      backward: inputs.backward && !lastInput.backward,
      shoot: inputs.shoot && !lastInput.shoot,
    };

    return { down: inputs, just: justInputs };
  }

  update(
    scene: Phaser.Scene,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    bullets: Bullet[],
    time: number
  ) {
    if (this.lives <= 0 || !this.active) {
      return;
    }

    const input = this.getInput(scene, cursors, this.lastInput);
    this.lastInput = input.down;

    if (input.down.left) {
      this.setAngularVelocity(-0.1);
    } else if (input.down.right) {
      this.setAngularVelocity(0.1);
    } else {
      this.setAngularVelocity(0);
    }

    const isThrusting = input.down.forward || input.down.backward;
    if (input.down.forward) {
      this.thrust(0.0002);
    } else if (input.down.backward) {
      this.thrust(-0.0002);
    }

    if (input.down.shoot) {
      this.fire(bullets, time);
    }

    if (isThrusting && time > this.thrustEmitTime + 100) {
      this.thrustEmitTime = time;

      this.thrustEmitter.emitParticle(
        1,
        this.x - (Math.cos(this.rotation) * Ship.width) / 2,
        this.y - (Math.sin(this.rotation) * Ship.width) / 2
      );
    }
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
    this.onHit(this);

    if (this.lives <= 0) {
      this.handleDeath();
    } else {
      this.play(Ship.nameIdle, true);
    }
  }

  handleHit(_collisionData: Phaser.Types.Physics.Matter.MatterCollisionData) {
    if (!this.isPlaying(Ship.nameHit)) {
      this.play(Ship.nameHit, true);
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
