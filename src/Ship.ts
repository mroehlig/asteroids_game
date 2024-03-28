import Phaser from "phaser";

import Entity from "./Entity";
import Bullet from "./Bullet";

interface Input {
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
  shoot: boolean;
}

export default class Ship extends Entity {
  private static readonly name = "ship";
  private static readonly nameThrust = "ship-thrust";
  private static readonly width = 32;
  private static readonly height = 16;

  static preload(scene: Phaser.Scene) {
    const width = Ship.width;
    const height = Ship.height;
    const thrustRadius = height / 4;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    // Create the ship shape.
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(width, height / 2);
    g.lineTo(0, height);
    g.lineTo(width / 4, height / 2);
    g.closePath();
    g.save();

    // Draw the ship idle.
    g.fillStyle(0x333333, 1);
    g.lineStyle(1, 0x999999, 1.0);
    g.fillPath();
    g.strokePath();
    g.generateTexture(Ship.name + "-idle", width, height);

    // Draw the ship hit.
    g.restore();
    g.fillStyle(0x666666, 1);
    g.lineStyle(1, 0xdddddd, 1.0);
    g.fillPath();
    g.strokePath();
    g.generateTexture(Ship.name + "-hit", width, height);

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

  constructor(
    scene: Phaser.Scene,
    world: Phaser.Physics.Matter.World,
    width: number,
    height: number,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    bodyOptions.shape = bodyOptions.shape || Ship.getShape();
    super(world, 0, 0, Ship.name, bodyOptions);

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

    this.setFrictionAir(0.02);
    this.setFixedRotation();
    this.setOrigin(0.5, 0.5);

    this.reset(width, height);
  }

  reset(width: number, height: number) {
    this.lives = 3;

    this.setPosition(width / 2, height / 2);
    this.setAngle(-90);
    this.setVelocity(0, 0);

    this.setActive(true);
    this.setVisible(true);
    this.world.add(this.body);

    this.play(this.states.idle, true);
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
      this.setAngularVelocity(-0.05);
    } else if (input.down.right) {
      this.setAngularVelocity(0.05);
    } else {
      this.setAngularVelocity(0);
    }

    const isThrusting = input.down.forward || input.down.backward;
    if (input.down.forward) {
      this.thrust(0.0001);
    } else if (input.down.backward) {
      this.thrust(-0.0001);
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
}
