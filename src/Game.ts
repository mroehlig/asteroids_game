import Phaser from "phaser";
import { Bullet, Bullets } from "./Bullet";

export default class Game extends Phaser.Scene {
  private text: Phaser.GameObjects.Text;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private bullets: Bullets;

  preload() {
    // this.load.image("ship", "assets/ship.png");
  }

  create() {
    // Create ship image.
    this.createShipImage();
    this.sprite = this.physics.add.image(400, 300, "ship");

    this.sprite.setDamping(true);
    this.sprite.setDrag(0.99);
    this.sprite.setMaxVelocity(200);

    // Create bullets.
    this.createBulletImage();
    this.bullets = this.add.existing(
      new Bullets(this.physics.world, this, { name: "bullets" })
    );

    this.bullets.createMultiple({
      key: "bullet",
      quantity: 5,
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.text = this.add.text(10, 10, "", {
      font: "16px Courier",
      color: "#00ff00",
    });

    this.physics.world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      (body.gameObject as Bullet).onWorldBounds();
    });
  }

  update() {
    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(
        this.sprite.rotation,
        200,
        this.sprite.body.acceleration
      );
    } else {
      this.sprite.setAcceleration(0);
    }

    if (this.cursors.left.isDown) {
      this.sprite.setAngularVelocity(-300);
    } else if (this.cursors.right.isDown) {
      this.sprite.setAngularVelocity(300);
    } else {
      this.sprite.setAngularVelocity(0);
    }

    // Fire bullets with space key and delay.
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      const x = this.sprite.x;
      const y = this.sprite.y;
      const angle = this.sprite.rotation;
      const speed = this.sprite.body.speed + 200;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.bullets.fire(x, y, vx, vy);
    }

    this.text.setText(`Speed: ${this.sprite.body.speed}`);

    this.physics.world.wrap(this.sprite, 32);
  }

  createShipImage(width: number = 32, height: number = 16) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff, 1);
    g.lineStyle(1, 0xff0000, 1.0);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(width, height / 2);
    g.lineTo(0, height);
    g.lineTo(0, 0);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.generateTexture("ship", width, height);
    g.destroy();
  }

  createBulletImage() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 0, 2);

    g.generateTexture("bullet", 4, 4);
    g.destroy();
  }
}
