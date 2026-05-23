import Phaser from "phaser";
import "./style.css";
import { GameState, type GameSnapshot, type MapId } from "./gameState";

type Action = "up" | "down" | "left" | "right" | "strike" | "interact";
type Dialogue = {
  speaker: string;
  lines: string[];
  onDone?: () => void;
};

const WORLD_WIDTH = 1440;
const WORLD_HEIGHT = 920;
const HERO_SCALE = 0.48;
const state = new GameState();
const pressedActions = new Set<Action>();

class VillageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private dummies!: Phaser.Physics.Arcade.StaticGroup;
  private collectibles!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private npc?: Phaser.GameObjects.Sprite;
  private gate?: Phaser.GameObjects.Rectangle;
  private gateGlow?: Phaser.GameObjects.Ellipse;
  private trail?: Phaser.GameObjects.Zone;
  private activeMap: MapId = "village";
  private activeDialogue?: Dialogue;
  private dialogueIndex = 0;
  private lastStrike = 0;
  private lastInteract = 0;
  private strikeUntil = 0;

  constructor() {
    super("village");
  }

  preload() {
    this.load.spritesheet("hero", "/assets/hero-spritesheet.png", {
      frameWidth: 144,
      frameHeight: 144,
    });
    this.load.spritesheet("master-npc", "/assets/master-spritesheet.png", {
      frameWidth: 144,
      frameHeight: 144,
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#8fbd72");

    this.createTextures();
    this.createInput();
    this.createAnimations();
    this.loadMap("village", { x: 705, y: 305 });

    this.scale.on("resize", (size: Phaser.Structs.Size) => {
      this.cameras.main.setZoom(size.width < 720 ? 1.0 : 1.1);
    });

    updateHud(state.snapshot());
  }

  update(time: number) {
    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown || this.keys.a.isDown || pressedActions.has("left")) velocity.x -= 1;
    if (this.cursors.right.isDown || this.keys.d.isDown || pressedActions.has("right")) velocity.x += 1;
    if (this.cursors.up.isDown || this.keys.w.isDown || pressedActions.has("up")) velocity.y -= 1;
    if (this.cursors.down.isDown || this.keys.s.isDown || pressedActions.has("down")) velocity.y += 1;

    velocity.normalize().scale(this.activeDialogue ? 0 : 190);
    this.player.setVelocity(velocity.x, velocity.y);
    if (velocity.x !== 0) this.player.setFlipX(velocity.x < 0);

    this.playHeroAnimation(velocity, time);

    const spacePressed = Phaser.Input.Keyboard.JustDown(this.keys.space);
    const interactPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.e) || pressedActions.has("interact");
    const strikePressed = pressedActions.has("strike");

    if ((spacePressed || interactPressed) && time - this.lastInteract > 240) {
      this.lastInteract = time;
      this.smartInteract(time);
      pressedActions.delete("interact");
      return;
    }

    if (strikePressed && time - this.lastStrike > 260) {
      this.lastStrike = time;
      this.strike(time);
      pressedActions.delete("strike");
    }
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private createAnimations() {
    this.anims.create({
      key: "idle-front",
      frames: [{ key: "hero", frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-front",
      frames: [
        { key: "hero", frame: 1 },
        { key: "hero", frame: 2 },
      ],
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-back",
      frames: [
        { key: "hero", frame: 4 },
        { key: "hero", frame: 5 },
      ],
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-side",
      frames: [{ key: "hero", frame: 6 }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "strike-staff",
      frames: [{ key: "hero", frame: 3 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "victory",
      frames: [{ key: "hero", frame: 7 }],
      frameRate: 1,
      repeat: -1,
    });
  }

  private playHeroAnimation(velocity: Phaser.Math.Vector2, time: number) {
    if (state.snapshot().phase === "complete") {
      this.player.anims.play("victory", true);
      return;
    }

    if (time < this.strikeUntil) {
      this.player.anims.play("strike-staff", true);
      return;
    }

    if (velocity.lengthSq() === 0) {
      this.player.anims.play("idle-front", true);
      return;
    }

    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      this.player.anims.play("walk-side", true);
      return;
    }

    this.player.anims.play(velocity.y < 0 ? "walk-back" : "walk-front", true);
  }

  private loadMap(map: MapId, start: { x: number; y: number }) {
    this.activeMap = map;
    this.children.removeAll(true);
    this.physics.world.colliders.destroy();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(this.scale.width < 720 ? 1.0 : 1.1);
    closeDialogue();

    if (map === "village") {
      this.drawVillageWorld();
      this.createVillageEntities(start);
    } else {
      this.drawBambooWorld();
      this.createBambooEntities(start);
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    updateHud(state.snapshot());
  }

  private createVillageEntities(start: { x: number; y: number }) {
    this.obstacles = this.physics.add.staticGroup();
    this.addObstacle(450, 150, 360, 84);
    this.addObstacle(1020, 180, 330, 92);
    this.addObstacle(236, 680, 360, 86);
    this.addObstacle(1130, 715, 350, 88);
    this.addObstacle(722, 802, 230, 130);
    this.addObstacle(1360, 460, 72, 650);
    this.addObstacle(78, 460, 72, 650);

    this.npc = this.add.sprite(725, 226, "master-npc", 1).setScale(0.5).setDepth(4);
    this.physics.add.existing(this.npc, true);

    this.gateGlow = this.add.ellipse(724, 112, 114, 46, 0xffdf72, 0.18).setDepth(1);
    this.gate = this.add.rectangle(724, 86, 170, 54, 0x8c5230, 1).setStrokeStyle(3, 0xffe6a6).setDepth(2);
    this.add.text(665, 72, "ĐÌNH LÀNG", {
      color: "#fff4cb",
      fontFamily: "ui-sans-serif, system-ui",
      fontSize: "13px",
      fontStyle: "bold",
    }).setDepth(3);

    this.trail = this.add.zone(700, 862, 190, 92);
    this.add.text(620, 840, "Lối xuống bãi tre", {
      color: "#fff6d5",
      fontFamily: "ui-sans-serif, system-ui",
      fontSize: "13px",
      fontStyle: "bold",
      stroke: "#40502e",
      strokeThickness: 3,
    }).setDepth(3);

    this.dummies = this.physics.add.staticGroup();
    [
      [530, 430],
      [630, 520],
      [820, 430],
      [928, 528],
    ].forEach(([x, y]) => this.dummies.create(x, y, "dummy").refreshBody());

    this.collectibles = this.physics.add.staticGroup();
    [
      [310, 244],
      [390, 302],
      [1035, 312],
      [1116, 262],
      [1188, 366],
    ].forEach(([x, y]) => this.collectibles.create(x, y, "lotus").refreshBody());

    this.createPlayer(start.x, start.y);
    this.physics.add.collider(this.player, this.npc);
    this.physics.add.overlap(this.player, this.collectibles, (_, lotus) =>
      this.collectLotus(lotus as Phaser.Physics.Arcade.Sprite),
    );
  }

  private createBambooEntities(start: { x: number; y: number }) {
    this.obstacles = this.physics.add.staticGroup();
    this.addObstacle(90, 460, 100, 760);
    this.addObstacle(1350, 460, 100, 760);
    this.addObstacle(722, 70, 500, 90);
    this.addObstacle(720, 850, 500, 90);

    this.trail = this.add.zone(720, 96, 210, 90);
    this.add.text(642, 104, "Đường về làng", {
      color: "#fff6d5",
      fontFamily: "ui-sans-serif, system-ui",
      fontSize: "13px",
      fontStyle: "bold",
      stroke: "#20381f",
      strokeThickness: 3,
    }).setDepth(3);

    this.dummies = this.physics.add.staticGroup();
    [
      [494, 432],
      [720, 510],
      [944, 412],
    ].forEach(([x, y]) => this.dummies.create(x, y, "bamboo-post").refreshBody());

    this.collectibles = this.physics.add.staticGroup();
    [
      [430, 250],
      [785, 300],
      [1010, 625],
    ].forEach(([x, y]) => this.collectibles.create(x, y, "bamboo-token").refreshBody());

    this.createPlayer(start.x, start.y);
    this.physics.add.overlap(this.player, this.collectibles, (_, token) =>
      this.collectBambooToken(token as Phaser.Physics.Arcade.Sprite),
    );
  }

  private createPlayer(x: number, y: number) {
    this.player = this.physics.add.sprite(x, y, "hero", 0).setScale(HERO_SCALE).setDepth(7);
    this.player.setSize(54, 66).setOffset(45, 70).setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.obstacles);
  }

  private drawVillageWorld() {
    const g = this.add.graphics();
    g.fillStyle(0x91c875, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawRicePlot(g, 260, 135, 360, 170);
    this.drawRicePlot(g, 918, 142, 356, 176);
    this.drawRicePlot(g, 115, 585, 350, 172);
    this.drawRicePlot(g, 963, 624, 360, 166);
    this.drawPond(g, 1035, 290, 265, 170);

    g.lineStyle(46, 0xb9844d, 1);
    g.beginPath();
    g.moveTo(710, 100);
    g.lineTo(700, 310);
    g.lineTo(690, 500);
    g.lineTo(700, 885);
    g.strokePath();
    g.lineStyle(34, 0xc59662, 1);
    g.beginPath();
    g.moveTo(90, 488);
    g.lineTo(360, 486);
    g.lineTo(650, 510);
    g.lineTo(1040, 505);
    g.lineTo(1350, 470);
    g.strokePath();

    g.fillStyle(0x7b5435, 1).fillRect(628, 120, 190, 82);
    g.fillStyle(0x9e332a, 1).fillTriangle(610, 124, 724, 52, 840, 124);
    g.fillStyle(0xf7d989, 1).fillRect(690, 150, 68, 52);
    g.lineStyle(4, 0x633a23, 1).strokeRect(628, 120, 190, 82);

    for (let y = 135; y < 820; y += 52) {
      this.drawBamboo(g, 58, y);
      this.drawBamboo(g, 1382, y + 18);
    }

    for (let x = 120; x < 1320; x += 92) {
      g.fillStyle(0x3c6d39, 0.3).fillCircle(x, 862 + Math.sin(x) * 18, 32);
    }
  }

  private drawBambooWorld() {
    const g = this.add.graphics();
    g.fillStyle(0x557b49, 1).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    g.fillStyle(0x6f8f4d, 1).fillRoundedRect(155, 116, 1130, 690, 18);
    g.lineStyle(44, 0x8d6840, 1);
    g.beginPath();
    g.moveTo(720, 74);
    g.lineTo(720, 846);
    g.strokePath();
    g.lineStyle(28, 0xa47b4b, 1);
    g.beginPath();
    g.moveTo(240, 538);
    g.lineTo(520, 458);
    g.lineTo(865, 548);
    g.lineTo(1200, 442);
    g.strokePath();

    for (let x = 170; x < 1280; x += 82) {
      for (let y = 135; y < 760; y += 128) {
        this.drawBamboo(g, x + Math.sin(y) * 12, y);
      }
    }

    g.fillStyle(0xb9c66b, 0.28);
    for (let i = 0; i < 28; i += 1) {
      g.fillEllipse(220 + i * 38, 255 + Math.sin(i) * 42, 44, 16);
    }
  }

  private drawRicePlot(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number) {
    g.fillStyle(0xadc86b, 1).fillRoundedRect(x, y, width, height, 12);
    g.lineStyle(3, 0x6d8e47, 0.55).strokeRoundedRect(x, y, width, height, 12);
    g.lineStyle(2, 0xe3d784, 0.58);
    for (let row = y + 18; row < y + height - 12; row += 24) {
      g.lineBetween(x + 18, row, x + width - 18, row + 8);
    }
  }

  private drawPond(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number) {
    g.fillStyle(0x5bb3a2, 0.86).fillEllipse(x + width / 2, y + height / 2, width, height);
    g.lineStyle(5, 0xd1c381, 0.8).strokeEllipse(x + width / 2, y + height / 2, width, height);
  }

  private drawBamboo(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.lineStyle(8, 0x2f6e37, 1).lineBetween(x, y + 38, x + 8, y - 38);
    g.fillStyle(0x4d9a4d, 1).fillEllipse(x - 16, y - 18, 40, 16);
    g.fillEllipse(x + 22, y - 28, 42, 17);
    g.fillEllipse(x + 12, y + 2, 34, 14);
  }

  private addObstacle(x: number, y: number, width: number, height: number) {
    const rect = this.add.rectangle(x, y, width, height, 0x52683c, 0).setVisible(false);
    this.physics.add.existing(rect, true);
    this.obstacles.add(rect);
  }

  private collectLotus(lotus: Phaser.Physics.Arcade.Sprite) {
    if (state.snapshot().phase === "intro") {
      state.setPrompt("Nghe thầy Ba giao bài trước rồi hãy hái sen.");
      updateHud(state.snapshot());
      return;
    }
    lotus.disableBody(true, true);
    state.collectLotus();
    this.floatText(lotus.x, lotus.y - 20, "+ sen", "#fff0f7");
    updateHud(state.snapshot());
  }

  private collectBambooToken(token: Phaser.Physics.Arcade.Sprite) {
    token.disableBody(true, true);
    state.collectBambooToken();
    this.floatText(token.x, token.y - 20, "+ thẻ tre", "#fff4b8");
    updateHud(state.snapshot());
  }

  private smartInteract(time: number) {
    if (this.activeDialogue) {
      this.advanceDialogue();
      return;
    }

    const nearMaster =
      this.npc && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < 92;
    const nearGate =
      this.gate && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.gate.x, this.gate.y) < 108;
    const nearTrail =
      this.trail && Phaser.Geom.Rectangle.Contains(this.trail.getBounds(), this.player.x, this.player.y);
    const snapshot = state.snapshot();

    if (nearMaster) {
      this.talkToMaster(snapshot);
      return;
    }

    if (nearGate) {
      if (snapshot.phase === "gate-open") {
        this.openDialogue({
          speaker: "Thầy Ba",
          lines: [
            "Con đã đi đủ hai bài: lễ ở làng, thân pháp ở bãi tre.",
            "Từ hôm nay con là võ sinh của làng Tre. Mai ta sẽ mở đường sang chợ huyện.",
          ],
          onDone: () => {
            state.completeFestival();
            this.gate?.setFillStyle(0xd9a84f);
            this.tweens.add({
              targets: this.gateGlow,
              alpha: 0.72,
              scale: 1.45,
              yoyo: true,
              repeat: 3,
              duration: 360,
            });
            updateHud(state.snapshot());
          },
        });
        return;
      }
      state.setPrompt("Cổng đình chưa mở. Hoàn thành bài ở làng và bãi tre trước.");
      updateHud(snapshot);
      return;
    }

    if (nearTrail) {
      if (this.activeMap === "village") {
        if (snapshot.phase === "bamboo-ready" || snapshot.phase === "gate-open") {
          state.enterMap("bamboo");
          this.loadMap("bamboo", { x: 720, y: 180 });
          return;
        }
        state.setPrompt("Thầy Ba sẽ cho sang bãi tre sau khi con xong bài sân làng.");
        updateHud(state.snapshot());
        return;
      }

      state.enterMap("village");
      this.loadMap("village", { x: 700, y: 780 });
      return;
    }

    this.strike(time);
  }

  private talkToMaster(snapshot: GameSnapshot) {
    if (snapshot.phase === "intro") {
      this.openDialogue({
        speaker: "Thầy Ba",
        lines: [
          "Muốn học võ làng Tre thì trước hết phải biết giữ lễ và giữ nhịp.",
          "Con hái 5 bông sen ven ao làm lễ nhập môn, rồi luyện 4 bù nhìn rơm quanh sân.",
          "Space không chỉ để đánh. Đứng gần người, cổng hoặc lối đi thì Space sẽ nói chuyện hoặc tương tác.",
        ],
        onDone: () => {
          state.acceptQuest();
          this.floatText(this.npc!.x, this.npc!.y - 42, "bắt đầu bài luyện", "#fff5c7");
          updateHud(state.snapshot());
        },
      });
      return;
    }

    if (snapshot.phase === "bamboo-ready") {
      this.openDialogue({
        speaker: "Thầy Ba",
        lines: [
          "Tốt. Bài sân làng đã xong.",
          "Đi xuống lối đất phía nam để sang bãi tre. Ở đó con luyện gậy và nhặt 3 thẻ tre.",
        ],
      });
      return;
    }

    if (snapshot.phase === "gate-open") {
      this.openDialogue({
        speaker: "Thầy Ba",
        lines: ["Đủ bài rồi. Ra cổng đình, Space hoặc E để vào hội làng."],
      });
      return;
    }

    this.openDialogue({
      speaker: "Thầy Ba",
      lines: [
        "Bài này không cần vội. Quan sát đường đất, bụi tre và khoảng cách trước khi vung gậy.",
        `Tiến độ: sen ${snapshot.lotuses}/${snapshot.requiredLotuses}, bù nhìn ${snapshot.dummies}/${snapshot.requiredDummies}, thẻ tre ${snapshot.bambooTokens}/${snapshot.requiredBambooTokens}.`,
      ],
    });
  }

  private openDialogue(dialogue: Dialogue) {
    this.activeDialogue = dialogue;
    this.dialogueIndex = 0;
    showDialogue(dialogue.speaker, dialogue.lines[0], dialogue.lines.length > 1);
  }

  private advanceDialogue() {
    if (!this.activeDialogue) return;
    this.dialogueIndex += 1;

    if (this.dialogueIndex < this.activeDialogue.lines.length) {
      showDialogue(
        this.activeDialogue.speaker,
        this.activeDialogue.lines[this.dialogueIndex],
        this.dialogueIndex < this.activeDialogue.lines.length - 1,
      );
      return;
    }

    const done = this.activeDialogue.onDone;
    this.activeDialogue = undefined;
    closeDialogue();
    done?.();
  }

  private strike(time: number) {
    this.strikeUntil = time + 220;
    this.player.setTint(0xffe28a);
    this.time.delayedCall(100, () => this.player.clearTint());

    const arc = this.add
      .circle(this.player.x + (this.player.flipX ? -34 : 34), this.player.y + 8, 30, 0xfff0a8, 0.28)
      .setDepth(6);
    this.tweens.add({ targets: arc, alpha: 0, scale: 1.6, duration: 130, onComplete: () => arc.destroy() });

    const target = this.dummies.getChildren().find((dummy) => {
      const sprite = dummy as Phaser.Physics.Arcade.Sprite;
      return sprite.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y) < 76;
    }) as Phaser.Physics.Arcade.Sprite | undefined;

    if (!target) {
      state.setPrompt("Đứng gần bù nhìn hoặc cọc tre hơn rồi bấm Space để vung gậy.");
      updateHud(state.snapshot());
      return;
    }

    target.disableBody(true, true);
    if (this.activeMap === "village") state.strikeDummy();
    else state.setPrompt("Gậy tre chạm cọc. Giữ nhịp rồi nhặt đủ thẻ tre.");
    this.floatText(target.x, target.y - 32, "trúng đòn", "#ffe7a6");
    updateHud(state.snapshot());
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const label = this.add
      .text(x, y, text, {
        color,
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: "14px",
        fontStyle: "bold",
        stroke: "#22301f",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 760,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private createTextures() {
    const g = this.add.graphics();

    g.clear();
    g.lineStyle(5, 0x6b4529, 1).lineBetween(18, 18, 18, 54);
    g.lineBetween(4, 34, 32, 34);
    g.fillStyle(0xd3a34d, 1).fillRoundedRect(6, 16, 24, 24, 6);
    g.fillStyle(0x7c4a2b, 1).fillTriangle(6, 16, 30, 16, 18, 4);
    g.generateTexture("dummy", 38, 60);

    g.clear();
    g.lineStyle(6, 0x477139, 1).lineBetween(20, 8, 20, 58);
    g.lineStyle(5, 0x8d6840, 1).lineBetween(8, 26, 32, 26);
    g.fillStyle(0xd2bd5c, 1).fillRoundedRect(10, 18, 20, 26, 4);
    g.generateTexture("bamboo-post", 42, 64);

    g.clear();
    g.fillStyle(0x4a8c4f, 1).fillEllipse(18, 24, 24, 10);
    g.fillStyle(0xe66e9c, 1).fillEllipse(12, 15, 16, 22);
    g.fillEllipse(24, 15, 16, 22);
    g.fillStyle(0xffd5e6, 1).fillEllipse(18, 13, 16, 24);
    g.generateTexture("lotus", 38, 36);

    g.clear();
    g.fillStyle(0xd5b75a, 1).fillRoundedRect(8, 8, 28, 40, 4);
    g.lineStyle(3, 0x7e542b, 1).strokeRoundedRect(8, 8, 28, 40, 4);
    g.lineStyle(2, 0x7e542b, 1).lineBetween(15, 18, 29, 18);
    g.lineBetween(15, 28, 29, 28);
    g.generateTexture("bamboo-token", 44, 56);

    g.destroy();
  }
}

function updateHud(snapshot: GameSnapshot) {
  const title = document.querySelector<HTMLHeadingElement>("#quest-title");
  const prompt = document.querySelector<HTMLDivElement>("#prompt");
  const map = document.querySelector<HTMLElement>("#map-name");
  const lotusCount = document.querySelector<HTMLElement>("#lotus-count");
  const dummyCount = document.querySelector<HTMLElement>("#dummy-count");
  const bambooCount = document.querySelector<HTMLElement>("#bamboo-count");
  const lotusBar = document.querySelector<HTMLSpanElement>("#lotus-bar");
  const dummyBar = document.querySelector<HTMLSpanElement>("#dummy-bar");
  const bambooBar = document.querySelector<HTMLSpanElement>("#bamboo-bar");

  const titleByPhase: Record<GameSnapshot["phase"], string> = {
    intro: "Nghe thầy Ba chỉ bài",
    "village-training": "Bài nhập môn sân làng",
    "bamboo-ready": "Mở đường sang bãi tre",
    "bamboo-training": "Luyện thân pháp bãi tre",
    "gate-open": "Quay về cổng đình",
    complete: "Võ sinh làng Tre",
  };

  if (title) title.textContent = titleByPhase[snapshot.phase];
  if (map) map.textContent = snapshot.map === "village" ? "Làng Tre" : "Bãi Tre";
  if (prompt) prompt.textContent = snapshot.prompt;
  if (lotusCount) lotusCount.textContent = `${snapshot.lotuses}/${snapshot.requiredLotuses}`;
  if (dummyCount) dummyCount.textContent = `${snapshot.dummies}/${snapshot.requiredDummies}`;
  if (bambooCount) bambooCount.textContent = `${snapshot.bambooTokens}/${snapshot.requiredBambooTokens}`;
  if (lotusBar) lotusBar.style.width = `${(snapshot.lotuses / snapshot.requiredLotuses) * 100}%`;
  if (dummyBar) dummyBar.style.width = `${(snapshot.dummies / snapshot.requiredDummies) * 100}%`;
  if (bambooBar) bambooBar.style.width = `${(snapshot.bambooTokens / snapshot.requiredBambooTokens) * 100}%`;
}

function showDialogue(speaker: string, line: string, hasNext: boolean) {
  const panel = document.querySelector<HTMLDivElement>("#dialogue");
  const speakerNode = document.querySelector<HTMLElement>("#dialogue-speaker");
  const textNode = document.querySelector<HTMLElement>("#dialogue-text");
  const hintNode = document.querySelector<HTMLElement>("#dialogue-hint");
  if (!panel || !speakerNode || !textNode || !hintNode) return;
  panel.hidden = false;
  speakerNode.textContent = speaker;
  textNode.textContent = line;
  hintNode.textContent = hasNext ? "Space/E để tiếp tục" : "Space/E để đóng";
}

function closeDialogue() {
  const panel = document.querySelector<HTMLDivElement>("#dialogue");
  if (panel) panel.hidden = true;
}

function bindTouchControls() {
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    const action = button.dataset.action as Action;
    const hold = (event: Event) => {
      event.preventDefault();
      pressedActions.add(action);
    };
    const release = (event: Event) => {
      event.preventDefault();
      if (action !== "interact" && action !== "strike") pressedActions.delete(action);
    };
    button.addEventListener("pointerdown", hold);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });
}

bindTouchControls();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [VillageScene],
});
