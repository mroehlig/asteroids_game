import Phaser from "phaser";

import Game from "./Game";

export default class Hud extends Phaser.Scene {
  private livesText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;

  private gameOverText: Phaser.GameObjects.Text;
  private restartText: Phaser.GameObjects.Text;
  private restartTextTween: Phaser.Tweens.Tween;
  private pauseText: Phaser.GameObjects.Text;
  private pauseTextTween: Phaser.Tweens.Tween;

  public keys: any;

  constructor() {
    super("hud");
  }

  create() {
    // Get game width and height.
    const { width, height } = this.game.canvas;
    const gameScene = this.scene.get("game") as Game;

    // Create the lives text.
    this.livesText = this.add.text(16, 16, "Lives: " + gameScene.ship.lives, {
      fontSize: "12px monospace",
      color: "#dddddd",
    });
    this.livesText.setDepth(1);

    // Create the score text.
    this.scoreText = this.add.text(width - 120, 16, "Score: 0", {
      font: "12px monospace",
      color: "#dddddd",
    });
    this.scoreText.setDepth(1);

    // Create the game over text.
    this.gameOverText = this.add.text(width / 2, height / 2, "Game Over", {
      font: "32px monospace",
      color: "#dddddd",
    });
    this.gameOverText.setDepth(1);
    this.gameOverText.setOrigin(0.5, 0.5);
    this.gameOverText.setVisible(false);

    // Create the restart text.
    this.restartText = this.add.text(
      width / 2,
      height / 2 + 32,
      "- Press shoot to restart -",
      {
        font: "16px monospace",
        color: "#dddddd",
      }
    );
    this.restartText.setDepth(1);
    this.restartText.setOrigin(0.5, 0.5);
    this.restartText.setVisible(false);

    this.restartTextTween = this.tweens.add({
      targets: this.restartText,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: 1000,
      persist: true,
      paused: true,
    });

    // Create the restart text.
    this.pauseText = this.add.text(width / 2, height / 2, "- Paused -", {
      font: "24px monospace",
      color: "#dddddd",
    });
    this.pauseText.setDepth(1);
    this.pauseText.setOrigin(0.5, 0.5);
    this.pauseText.setVisible(false);

    this.pauseTextTween = this.tweens.add({
      targets: this.pauseText,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      persist: true,
      paused: true,
    });

    // Create the keys.
    this.keys = this.input.keyboard.addKeys(
      {
        shoot: Phaser.Input.Keyboard.KeyCodes.SPACE,
        pause: Phaser.Input.Keyboard.KeyCodes.P,
        mute: Phaser.Input.Keyboard.KeyCodes.M,
        restart: Phaser.Input.Keyboard.KeyCodes.R,
      },
      true
    );

    // Handle pause.
    this.keys.pause.on("down", this.onPause.bind(this));

    this.input.gamepad.on(
      "down",
      (
        _pad: Phaser.Input.Gamepad.Gamepad,
        button: Phaser.Input.Gamepad.Button,
        _value: number
      ) => {
        if (button.index === Phaser.Input.Gamepad.Configs.XBOX_360.START) {
          this.onPause();
        }
      }
    );

    // Handle restart.
    this.keys.restart.on("down", () => {
      this.restart();
    });

    this.keys.shoot.on("down", () => {
      if (this.restartText.visible) {
        this.restart();
      }
    });

    this.input.gamepad.on(
      "down",
      (
        _pad: Phaser.Input.Gamepad.Gamepad,
        button: Phaser.Input.Gamepad.Button,
        _value: number
      ) => {
        if (button.index === Phaser.Input.Gamepad.Configs.XBOX_360.MENU) {
          this.restart();
        }
      }
    );

    this.input.gamepad.on(
      "down",
      (
        pad: Phaser.Input.Gamepad.Gamepad,
        _button: Phaser.Input.Gamepad.Button,
        _value: number
      ) => {
        const input = gameScene.getInput(pad, gameScene.cursors, this.keys);
        if (input.down.shoot && this.restartText.visible) {
          this.restart();
        }
      }
    );
  }

  setScore(score: number) {
    this.scoreText.setText("Score: " + score);
  }

  setLives(lives: number) {
    this.livesText.setText("Lives: " + lives);
  }

  restart() {
    this.gameOverText.setVisible(false);
    this.restartText.setVisible(false);
    this.restartTextTween.pause();

    const gameScene = this.scene.get("game") as Game;
    gameScene.restart();

    // Update score and lives.
    this.scoreText.setText("Score: " + gameScene.score);
    this.livesText.setText("Lives: " + gameScene.ship.lives);
  }

  gameOver() {
    // Update game over text.
    this.gameOverText.setVisible(true);
    this.tweens.add({
      targets: this.gameOverText,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
    });

    // Update restart text.
    this.restartText.setVisible(true);
    this.restartTextTween.restart();
  }

  onPause() {
    if (this.scene.isPaused("game")) {
      this.pauseText.setVisible(false);
      this.pauseTextTween.pause();
      this.scene.resume("game");
    } else {
      this.pauseText.setVisible(true);
      this.pauseTextTween.restart();
      this.scene.pause("game");
    }
  }
}
