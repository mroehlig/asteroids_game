import Phaser from "phaser";

import Ship from "../entities/Ship";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";
import Asteroid from "../entities/Asteroid";

export default class Title extends Phaser.Scene {
  private titleText: Phaser.GameObjects.Text;
  private startText: Phaser.GameObjects.Text;
  private controlsText: Phaser.GameObjects.Text;

  private asteroids: Asteroid[];

  constructor() {
    super("title");
  }

  preload() {
    // Get game width and height.
    const { width, height } = this.game.canvas;

    // Title text.
    this.titleText = this.add.text(width / 2, 200, "Asteroids", {
      font: "32px monospace",
      color: "#dddddd",
    });
    this.titleText.setOrigin(0.5, 0.5);

    // Preload.
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        color: "#dddddd",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: "0%",
      style: {
        font: "18px monospace",
        color: "#dddddd",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xaaaaaa, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
      percentText.setText(Math.floor(value * 100) + "%");
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Create game textures.
    Ship.preload(this);
    Bullet.preload(this);
    Enemy.preload(this);
    Asteroid.preload(this);
  }

  create() {
    // Get game width and height.
    const { width, height } = this.game.canvas;

    // Create world bounds wrap.
    const wrapBounds = {
      wrap: {
        min: { x: 0, y: 0 },
        max: { x: width, y: height },
      },
    };

    // Create asteroids.
    const asteroidsCollisionCategory = this.matter.world.nextCategory();
    this.asteroids = [];
    for (let i = 0; i < 10; i++) {
      const asteroid = new Asteroid(this.matter.world, {
        collisionFilter: {
          category: asteroidsCollisionCategory,
          mask: asteroidsCollisionCategory,
        },
        plugin: wrapBounds,
      });
      asteroid.spawn(width, height);
      this.add.existing(asteroid);
      this.asteroids.push(asteroid);
    }

    // Title text.
    this.children.bringToTop(this.titleText);

    // Start text.
    this.startText = this.add.text(
      width / 2,
      height / 2 - 50,
      "- Press shoot to start -",
      {
        font: "16px monospace",
        color: "#dddddd",
      }
    );
    this.startText.setOrigin(0.5, 0);

    // Start text tween.
    this.tweens.add({
      targets: this.startText,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Controls text.
    this.controlsText = this.add.text(
      width / 2,
      height / 2,
      [
        "Keyboard:",
        "Use [Arrow Keys] or [WASD] to move.",
        "Use [Space] to shoot.",
        "Use [Shift] to boost.",
        "Use [B] to bomb.",
        "Use [P] to pause.",
        "Use [R] to restart.",
        "Use [M] to mute.",
        "",
        "Gamepad:",
        "Use [Left Stick] or [D-Pad] to move.",
        "Use [A] to shoot.",
        "Use [L1] to boost.",
        "Use [X] to bomb.",
        "Use [Start] to pause.",
        "Use [Select] to restart.",
        "Use [Back] to mute.",
      ],
      {
        font: "12px monospace",
        color: "#dddddd",
      }
    );
    this.controlsText.setOrigin(0.5, 0);

    // Start the game.
    this.input.keyboard.once("keydown-SPACE", this.startGame, this);
    this.input.gamepad.once("down", (pad: Phaser.Input.Gamepad.Gamepad) => {
      if (pad.A) {
        this.startGame();
      }
    });
  }

  startGame() {
    this.scene.start("game").launch("hud");
  }
}
