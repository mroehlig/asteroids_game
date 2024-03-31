import Phaser from "phaser";

import Title from "./scenes/Title";
import Game from "./scenes/Game";
import Hud from "./scenes/Hud";

export default new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 800,
  height: 600,
  backgroundColor: "#333333",
  physics: {
    default: "matter",
    matter: {
      debug: false,
      "plugins.wrap": true,
      // plugins: {
      //   wrap: true,
      // },
      gravity: {
        x: 0,
        y: 0,
      },
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
  scene: [Title, Game, Hud],
});
