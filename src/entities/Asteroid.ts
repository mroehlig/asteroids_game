import Phaser from "phaser";

import Entity from "./Entity";

export type AsteroidType = "xxlarge" | "xlarge" | "large" | "medium" | "small";

interface AsteroidConfig {
  type: AsteroidType;
  name: string;
  width: number;
  height: number;
  lives: number;
  score: number;
  speed: number;
  angularVelocity: number;
}

export default class Asteroid extends Entity {
  public static readonly configs = {
    xxlarge: {
      type: "xxlarge",
      name: "asteroid-xxlarge",
      width: 64,
      height: 64,
      lives: 10,
      score: 80,
      speed: 0.5,
      angularVelocity: 0.01,
    } as AsteroidConfig,
    xlarge: {
      type: "xlarge",
      name: "asteroid-xlarge",
      width: 64,
      height: 32,
      lives: 7,
      score: 60,
      speed: 1,
      angularVelocity: 0.02,
    } as AsteroidConfig,
    large: {
      type: "large",
      name: "asteroid-large",
      width: 32,
      height: 32,
      lives: 8,
      score: 40,
      speed: 1.5,
      angularVelocity: 0.03,
    } as AsteroidConfig,
    medium: {
      type: "medium",
      name: "asteroid-medium",
      width: 32,
      height: 16,
      lives: 3,
      score: 20,
      speed: 2,
      angularVelocity: 0.04,
    } as AsteroidConfig,
    small: {
      type: "small",
      name: "asteroid-small",
      width: 16,
      height: 16,
      lives: 1,
      score: 10,
      speed: 3,
      angularVelocity: 0.05,
    } as AsteroidConfig,
  };

  static preload(scene: Phaser.Scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    for (const type of Object.values(Asteroid.configs)) {
      g.clear();

      // Idle asteroid.
      g.fillStyle(0x333333, 1);
      g.lineStyle(1, 0x999999, 1.0);
      g.fillRect(0, 0, type.width, type.height);
      g.strokeRect(0, 0, type.width, type.height);
      g.generateTexture(type.name + "-idle", type.width, type.height);

      // Hit asteroid.
      g.fillStyle(0x666666, 1);
      g.lineStyle(1, 0xdddddd, 1.0);
      g.fillRect(0, 0, type.width, type.height);
      g.strokeRect(0, 0, type.width, type.height);
      g.generateTexture(type.name + "-hit", type.width, type.height);
    }

    g.destroy();
  }

  static getShape(config: AsteroidConfig) {
    return {
      type: "rectangle",
      width: config.width,
      height: config.height,
    };
  }

  public config: AsteroidConfig;

  constructor(
    world: Phaser.Physics.Matter.World,
    bodyOptions: Phaser.Types.Physics.Matter.MatterBodyConfig,
    type: AsteroidType
  ) {
    const config = Asteroid.configs[type];
    bodyOptions.shape = bodyOptions.shape || Asteroid.getShape(config);
    super(world, 0, 0, config.name, bodyOptions);

    this.config = config;

    this.setFrictionAir(0);
    this.setBounce(0.5);
    this.setOrigin(0.5, 0.5);
  }

  spawn(width: number, height: number) {
    super.spawn(width, height);

    this.lives = this.config.lives;
    this.score = this.config.score;

    // Spawn the asteroid outside the screen.
    const x = Phaser.Math.Between(0, 1) ? -this.width : width + this.width;
    const y = Phaser.Math.Between(0, 1) ? -this.height : height + this.height;
    this.setPosition(x, y);

    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.FloatBetween(0.5, this.config.speed);
    this.setAngle(angle);
    this.setAngularVelocity(
      Phaser.Math.FloatBetween(
        -this.config.angularVelocity,
        this.config.angularVelocity
      )
    );
    this.setVelocityX(speed * Math.cos(angle));
    this.setVelocityY(speed * Math.sin(angle));
  }
}
