"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backgrounds = [
    {
        file: "images/backgrounds/dirt.png",
        name: "dirt",
    }
];
const characters = [
    {
        name: "character1_1",
        spritesheet: {
            file: "images/characters/1_1.png",
            frameHeight: 48,
            frameWidth: 48,
        }
    },
];
const monsters = {
    "goo": {
        name: "goo",
        spritesheet: {
            file: "images/monsters/goo.png",
            frameWidth: 15,
            frameHeight: 19,
        },
        attack: 1,
        hp: 10
    }
};
const WHITE = new Phaser.Display.Color(255, 255, 255);
const RED = new Phaser.Display.Color(255, 0, 0);
class CharacterSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.load();
    }
    load() {
        const data = localStorage.getItem("character");
        if (data !== null) {
            const parsedData = JSON.parse(data);
            for (const key in parsedData) {
                this[key] = parsedData[key];
            }
        }
        if (this.attack == undefined || this.attack < 1)
            this.attack = 1;
        if (this.hp == undefined || this.hp < 5)
            this.hp = 5;
        if (this.level == undefined || this.level < 1)
            this.level = 1;
        if (this.xp == undefined || this.xp < 1)
            this.xp = 0;
        if (this.gold == undefined || this.gold < 0)
            this.gold = 0;
        this.save();
    }
    save() {
        localStorage.setItem("character", JSON.stringify({
            attack: this.attack,
            gold: this.gold,
            hp: this.hp,
            level: this.level,
            xp: this.level
        }));
    }
}
class LoadGameScene extends Phaser.Scene {
    constructor() {
        super({ key: LoadGameScene.Key });
    }
    create() {
        this.anims.create({
            key: "character_idle_sword",
            frameRate: 3,
            frames: this.anims.generateFrameNumbers("character1_1", { start: 9, end: 11 }),
            repeat: -1
        });
        this.anims.create({
            key: "character_attack_sword",
            frameRate: 9,
            frames: this.anims.generateFrameNumbers("character1_1", { start: 3, end: 5 }),
            repeat: 0,
            yoyo: true
        });
        this.anims.create({
            key: "character_fail",
            frameRate: 9,
            frames: this.anims.generateFrameNumbers("character1_1", { start: 36, end: 38 }),
            repeat: 0
        });
        this.anims.create({
            key: "monster_idle",
            frameRate: 3,
            frames: this.anims.generateFrameNumbers("goo", { start: 0, end: 2 }),
            repeat: -1,
            yoyo: true
        });
        const data = {
            background: "dirt",
            monster: monsters["goo"],
            wordlist: "wordlist_js5l2"
        };
        this.scene.start(FightScene.Key, data);
    }
    preload() {
        const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, "Loading...");
        loadingText.setOrigin(0.5, 0.5);
        loadingText.setColor("#000000");
        loadingText.setFontFamily("Arial");
        loadingText.setFontSize(30);
        this.loadingBack = this.add.graphics();
        this.loadingBack.fillStyle(0x000000, 1);
        this.loadingBack.fillRect(240, 270, 320, 50);
        this.loadingFill = this.add.graphics();
        this.load.on("progress", (value) => {
            this.loadingFill.clear();
            this.loadingFill.fillStyle(LoadGameScene.LOAD_BAR_COLOR, 1);
            this.loadingFill.fillRect(250, 280, 300 * value, 30);
        });
        this.load.json("wordlist_js5l2", "../wordlists/JuniorSunshine5/lesson2.json");
        for (const background of backgrounds)
            this.load.image(background.name, background.file);
        for (const character of characters)
            this.load.spritesheet(character.name, character.spritesheet.file, character.spritesheet);
        for (const monsterName in monsters) {
            const monster = monsters[monsterName];
            this.load.spritesheet(monsterName, monster.spritesheet.file, monster.spritesheet);
        }
        this.load.html("answer_input", "answer_input.html");
    }
}
LoadGameScene.Key = "LOAD";
LoadGameScene.LOAD_BAR_COLOR = 0x00AEEF;
class FightScene extends Phaser.Scene {
    constructor() {
        super({ key: FightScene.Key });
    }
    create() {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY;
        this.add.sprite(x, y, this.background).setScale(4.5);
        this.monsterObject = this.add.sprite(x + 100, y + 65, this.monster.name).setScale(6);
        this.monsterHP = this.monster.hp;
        this.monsterObject.play("monster_idle");
        this.characterObject = new CharacterSprite(this, x - 100, y, "character1_1").setScale(6).setFlipX(true).setDepth(1);
        this.add.existing(this.characterObject);
        this.characterHP = this.characterObject.hp;
        this.characterObject.play("character_idle_sword");
        this.HPObject = this.add.graphics().setDepth(2);
        this.updateHP();
        this.changeCurrentWordByIndex();
        const answer = this.add.dom(x, VocabRPGGame.HEIGHT - 30).createFromCache("answer_input");
        const checkAnswer = () => {
            const answerField = document.getElementById("answerField");
            const input = answerField.value;
            if (!input)
                return;
            if (input !== this.word.en) {
                this.add.tween({
                    duration: 250,
                    targets: this.monsterObject,
                    ease: "Cubic",
                    repeat: 0,
                    x: "-=100",
                    yoyo: true
                });
                this.add.tween({
                    duration: 250,
                    targets: this.characterObject,
                    ease: "Cubic",
                    x: "+=0",
                    onComplete: () => {
                        this.characterHP -= this.monster.attack;
                        this.updateHP();
                    },
                    onUpdate: (tween) => {
                        let e = tween.elapsed / (tween.duration / 2);
                        if (e > 2)
                            e = 0;
                        else if (e > 1)
                            e = 2 - e;
                        const t = Phaser.Display.Color.Interpolate.ColorWithColor(WHITE, RED, 1, e);
                        this.characterObject.tint = Phaser.Display.Color.GetColor(t.r, t.g, t.b);
                    },
                    repeat: 0,
                    yoyo: true
                });
                this.playCharacterAnimation("character_fail");
                return;
            }
            const checkButton = document.getElementById("check");
            if (checkButton.disabled)
                return;
            this.add.tween({
                duration: 250,
                targets: this.characterObject,
                ease: "Cubic",
                repeat: 0,
                x: "+=100",
                yoyo: true
            });
            this.add.tween({
                duration: 250,
                targets: this.monsterObject,
                ease: "Cubic",
                x: "+=0",
                onComplete: () => {
                    this.monsterHP -= this.monster.attack;
                    this.updateHP();
                },
                onUpdate: (tween) => {
                    let e = tween.elapsed / (tween.duration / 2);
                    if (e > 2)
                        e = 0;
                    else if (e > 1)
                        e = 2 - e;
                    const t = Phaser.Display.Color.Interpolate.ColorWithColor(WHITE, RED, 1, e);
                    this.monsterObject.tint = Phaser.Display.Color.GetColor(t.r, t.g, t.b);
                },
                repeat: 0,
                yoyo: true
            });
            this.playCharacterAnimation("character_attack_sword");
            this.characterObject.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                answerField.value = "";
                this.changeCurrentWordByIndex();
            });
        };
        answer.addListener("click");
        answer.on("click", (data) => {
            if (data.target.id !== "check")
                return;
            checkAnswer();
        });
        this.enterKey.on("down", () => {
            checkAnswer();
        }, this);
    }
    init(data) {
        this.wordlist = this.cache.json.get(data.wordlist);
        this.word = undefined;
        this.background = data.background;
        this.monster = data.monster;
        this.enterKey = this.input.keyboard.addKey("ENTER");
    }
    playCharacterAnimation(animation) {
        const answerField = document.getElementById("answerField");
        const checkButton = document.getElementById("check");
        this.characterObject.play(animation);
        answerField.disabled = true;
        checkButton.disabled = true;
        this.enterKey.enabled = false;
        this.characterObject.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.characterObject.play("character_idle_sword");
            answerField.disabled = false;
            checkButton.disabled = false;
            answerField.focus();
            this.enterKey.enabled = true;
            this.enterKey.reset();
        });
    }
    changeCurrentWordByIndex(next = Phaser.Math.Between(0, this.wordlist.length - 1)) {
        const x = this.cameras.main.centerX;
        this.word = this.wordlist[next];
        if (this.wordObject)
            this.wordObject.destroy();
        let display;
        if (this.word.ja.kanji == this.word.ja.hiragana) {
            display = this.word.ja.kanji;
        }
        else {
            display = `${this.word.ja.kanji}【${this.word.ja.hiragana}】`;
        }
        this.wordObject = this.add.dom(x, 30, "div", "background-color: rgba(255,255,255,0.7); width: 800px; font-family='UD デジタル 教科書体 NK-B'; font-size: 48px; text-align: center", display);
    }
    updateHP() {
        this.HPObject.clear();
        if (this.monsterHP <= 0) {
            this.scene.start(FightScene.Key);
            this.characterObject.xp += 1;
            this.characterObject.gold += Phaser.Math.Between(0, 2);
            this.characterObject.save();
            return;
        }
        if (this.characterHP <= 0) {
            this.scene.start(FightScene.Key);
            this.characterObject.xp = Math.min(0, this.characterObject.xp - 1);
            this.characterObject.save();
            return;
        }
        this.HPObject.fillStyle(0x000000);
        this.HPObject.fillRect(this.characterObject.x - 50, this.characterObject.y + 130, 100, 20);
        this.HPObject.fillStyle(0xFF0000);
        this.HPObject.fillRect(this.characterObject.x - 48, this.characterObject.y + 132, 96 * (this.characterHP / 5), 16);
        this.HPObject.fillStyle(0x000000);
        this.HPObject.fillRect(this.monsterObject.x - 50, this.monsterObject.y + 65, 100, 20);
        this.HPObject.fillStyle(0xFF0000);
        this.HPObject.fillRect(this.monsterObject.x - 48, this.monsterObject.y + 67, 96 * (this.monsterHP / this.monster.hp), 16);
    }
}
FightScene.Key = "FIGHT";
class VocabRPGGame {
    constructor() {
        this.game = new Phaser.Game({
            backgroundColor: 0xFFFFFF,
            dom: {
                createContainer: true
            },
            height: VocabRPGGame.HEIGHT,
            scale: {
                autoCenter: Phaser.Scale.CENTER_BOTH,
                mode: Phaser.Scale.ScaleModes.FIT,
                parent: "game"
            },
            pixelArt: true,
            scene: [LoadGameScene, FightScene],
            type: Phaser.AUTO,
            width: VocabRPGGame.WIDTH
        });
    }
}
VocabRPGGame.WIDTH = 800;
VocabRPGGame.HEIGHT = 600;
window.onload = () => {
    new VocabRPGGame();
};