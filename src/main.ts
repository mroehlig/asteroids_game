import Phaser from "phaser";

import Game from "./Game";

export default new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 768,
  height: 640,
  backgroundColor: "#4488aa",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true,
      debugShowBody: true,
      debugShowStaticBody: true,
      debugShowVelocity: true,
      debugVelocityColor: 0xffff00,
      debugBodyColor: 0x0000ff,
      debugStaticBodyColor: 0xffffff,
    },
  },
  pixelArt: true,
  // zoom: 1.5,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // ...
  },
  input: {
    gamepad: true,
  },
  scene: [Game],
});
