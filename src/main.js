import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaplayCtx";
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39, //sprite tiles in x (16x16px equals to 1 tile)
  sliceY: 31,
  anims: {
    "idle-down": 964,
    "walk-down": { from: 964, to: 967, loop: true, speed: 8 },
    "idle-side": 1003,
    "walk-side": { from: 1003, to: 1006, loop: true, speed: 8 },
    "idle-up": 1042,
    "walk-up": { from: 1042, to: 1045, loop: true, speed: 8 },
  },
  // anims: {
  //     "idle-down": 936,
  //     "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
  //     "idle-side": 975,
  //     "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
  //     "idle-up": 1014,
  //     "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
  // },
});

k.loadSound("walking", "./walk.mp3");
let walking = null;

k.loadSprite("map", "./map.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;

  const map = k.make([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  k.add(map); // can be directly by changing k.make above to k.add

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }), //16x16
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10), //collision area, 10 is smaller than the sprite
    }),
    k.body(), //kaplay makes the entity a physics body
    k.anchor("center"), //0,5 is the center of the sprite
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false, //if in dialogue, player cannot move
    },
    "player", //tag (?)
  ]);

  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }), //position for hitbox
          k.body({ isStatic: true }), //player cant pass through it
          k.pos(boundary.x, boundary.y), //game object itelf
          boundary.name,
          // {"name" : boundary.name},
        ]);

        if (boundary.name) {
          player.onCollide(
            // player.area
            boundary.name,
            () => {
              player.isInDialogue = true;
              displayDialogue(
                dialogueData[boundary.name],
                () => {
                  player.isInDialogue = false;
                },
                k
              );
            }
          );
        }
      }
      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        //code is generalizable even there only one entity
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * scaleFactor, //map is 0, entity is 72.5454545454545, scale is 4 (multiply everything)
            (map.pos.y + entity.y) * scaleFactor
          );
          k.add(player);
          continue;
        }
      }
    }
  }

  setCamScale(k); //init

  k.onResize(() => {
    setCamScale(k); //on event change (kaplay)
  });

  k.onUpdate(() => {
    //kaplay already make camera object
    k.setCamPos(player.pos.x, player.pos.y + 75);
    // k.camPos(player.worldPos())
  });

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return; //only move if left click

    if (!walking) {
      walking = k.play("walking", {
        volume: 1.5, // set the volume to 50%
        speed: 1.5, // speed up the sound
        loop: true, // loop the sound
      });
    }

    const worldMousePos = k.toWorld(k.mousePos()); //according to canvas not the world
    // https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbFphbFJRX2Y0WDdYbzM1NlBYbGpiLWxnTzVCZ3xBQ3Jtc0ttNFBZM1JvMlh5bGJKMV96Y1RkOVFEYUtBeDUwTDFPTWxhN0R6ZUhVMXNiZnFzSkY4b29XWkxXaFBnLXdFZnEyZjlHTFBnU1cxRFJRRF9IOTZwa2NNVzBQemxCYlpGWDZ1RFFiemVGQnZpanVwY2NJdw&q=https%3A%2F%2Fjslegenddev.substack.com%2Fp%2Fhow-to-implement-player-controls&v=gwtfWORCN0U
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    ) {
      player.direction = "up";
      player.play("walk-up");
      return;
    }

    if (
      mouseAngle > -upperBound &&
      mouseAngle < -lowerBound &&
      player.curAnim() !== "walk-down"
    ) {
      player.direction = "down";
      player.play("walk-down");
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") {
        player.direction = "left";
        player.play("walk-side");
        return;
      }
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") {
        player.direction = "right";
        player.play("walk-side");
        return;
      }
    }
  });

  k.onMouseRelease(() => {stopAnims()});

  function stopAnims() {
    player.stop();
    if (walking) {
      walking.stop();
      walking = null;
    }

    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  }

  if(k.isKeyDown("space") || k.isKeyDown("enter")) {
    document.getElementById("close").click();
  }

  function move(x,y,dir,flip) {
      if (!walking) {
        walking = k.play("walking", {
          volume: 1.5, // set the volume to 50%
          speed: 1.5, // speed up the sound
          loop: true, // loop the sound
        });
      }

    if (player.isInDialogue) return;

    if(dir == "side"){
      player.flipX = flip;
    }

    player.move(x, y);
    player.direction = dir;

    //if key pressed is 2
    // alert(k.isKeyDown())

    if(player.curAnim() !== `walk-${dir}`) player.play(`walk-${dir}`);
  }


  player.onUpdate(() => {
    if (k.isKeyDown("left")) move(-player.speed, 0, "side", true)
    if (k.isKeyDown("right")) move(player.speed, 0, "side")
    if (k.isKeyDown("up")) move(0, -player.speed, "up")
    if (k.isKeyDown("down")) move(0, player.speed, "down")
  })

    // if towo keys are pressed, the player will move diagonally

  k.onKeyRelease(() => {
    stopAnims();
  });
});

k.go("main");
