"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
class BasicButton extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, 0, 0, config.key, 2);
        this._enabled = false;
        this.config = config;
        if (!config.scene)
            throw new Error("config.scene is not set");
        if (!config.key)
            throw new Error("config.key is not set");
        if (!config.enabled)
            config.enabled = 1;
        if (!config.disabled)
            config.disabled = 2;
        if (!config.over)
            config.over = 0;
        if (config.x)
            this.x = config.x;
        if (config.y)
            this.y = config.y;
        config.scene.add.existing(this);
        this.setInteractive();
        this.on("pointerdown", this.onDown, this);
        this.on("pointerover", this.onOver, this);
        this.on("pointerout", this.onOut, this);
        this.setDisabled();
        this.setOrigin(0, 0);
    }
    get enabled() {
        return this._enabled;
    }
    onDown() {
        this.setFrame(this.config.enabled);
    }
    onOver() {
        if (this._enabled)
            this.setFrame(this.config.enabled);
        else
            this.setFrame(this.config.over);
    }
    onOut() {
        if (this._enabled)
            this.setFrame(this.config.enabled);
        else
            this.setFrame(this.config.disabled);
    }
    setEnabled() {
        this._enabled = true;
        this.setFrame(this.config.enabled);
    }
    setDisabled() {
        this._enabled = false;
        this.setFrame(this.config.disabled);
    }
}
class ABCRaceLoadScene extends Phaser.Scene {
    constructor() {
        super({ key: ABCRaceLoadScene.Key });
    }
    create() {
        this.scene.start(ABCRaceMenuScene.Key);
    }
    preload() {
        for (const letter of ABCRace.LowercaseLetters)
            this.load.image(letter, `images/lower/${letter}.svg`);
        for (const letter of ABCRace.UppercaseLetters)
            this.load.image(letter, `images/upper/${letter}.svg`);
        for (const number of ["three", "two", "one"])
            this.load.image(number, `images/numbers/${number}.svg`);
        this.load.image("logo", "images/logo.png");
        this.load.spritesheet("lowercase_buttons", "images/lowercase_buttons.png", { frameHeight: 160, frameWidth: 210 });
        this.load.spritesheet("random_buttons", "images/random_buttons.png", { frameHeight: 160, frameWidth: 210 });
        this.load.spritesheet("uppercase_buttons", "images/uppercase_buttons.png", { frameHeight: 160, frameWidth: 210 });
        this.load.spritesheet("start_buttons", "images/start_buttons.png", { frameHeight: 210, frameWidth: 610 });
        this.load.audio("menu_bgm", "sounds/menu_bgm.ogg");
        this.load.audio("countdown", "sounds/countdown.ogg");
        this.load.audio("menu_switch", "sounds/menu_switch.ogg");
        this.load.audio("ng", "sounds/ng.ogg");
        this.load.audio("ok", "sounds/ok.ogg");
        this.load.audio("start", "sounds/start.ogg");
    }
}
ABCRaceLoadScene.Key = "LOAD";
class ABCRaceMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: ABCRaceMenuScene.Key });
    }
    create() {
        const logo = this.add.sprite(0, 0, "logo").setOrigin(0, 0);
        this.sound.play("menu_bgm", { loop: true });
        const lowercaseButton = new BasicButton({
            "key": "lowercase_buttons",
            "scene": this,
            "x": 40,
            "y": 205
        });
        const uppercaseButton = new BasicButton({
            "key": "uppercase_buttons",
            "scene": this,
            "x": 295,
            "y": 205
        });
        const randomButton = new BasicButton({
            "key": "random_buttons",
            "scene": this,
            "x": 550,
            "y": 205
        });
        lowercaseButton.on("pointerdown", () => {
            this.sound.play("menu_switch");
            lowercaseButton.setEnabled();
            uppercaseButton.setDisabled();
            randomButton.setDisabled();
        });
        uppercaseButton.on("pointerdown", () => {
            this.sound.play("menu_switch");
            lowercaseButton.setDisabled();
            uppercaseButton.setEnabled();
            randomButton.setDisabled();
        });
        randomButton.on("pointerdown", () => {
            this.sound.play("menu_switch");
            lowercaseButton.setDisabled();
            uppercaseButton.setDisabled();
            randomButton.setEnabled();
        });
        uppercaseButton.setEnabled();
        const startButton = new BasicButton({
            "key": "start_buttons",
            "scene": this,
            "x": 95,
            "y": 380
        });
        startButton.on("pointerup", () => {
            let args;
            if (lowercaseButton.enabled) {
                args = {
                    mode: "lowercase"
                };
            }
            else if (uppercaseButton.enabled) {
                args = {
                    mode: "uppercase"
                };
            }
            else if (randomButton.enabled) {
                args = {
                    mode: "random"
                };
            }
            else {
                throw new Error("Something went wrong. We don't know what game mode to use.");
            }
            this.sound.stopByKey("menu_bgm");
            this.scene.start(ABCRacePlayScene.Key, args);
        });
    }
}
ABCRaceMenuScene.Key = "MENU";
class ABCRacePlayScene extends Phaser.Scene {
    constructor() {
        super({ key: ABCRacePlayScene.Key });
    }
    create() {
        this.countdown = this.time.delayedCall(3000, this.startGame, [], this);
        let columns = 1;
        let rows = 1;
        while (columns * rows < 26) {
            const columnWidth = ABCRace.WIDTH / columns;
            const rowHeight = ABCRace.HEIGHT / rows;
            if (columnWidth > rowHeight)
                columns *= 2;
            else
                rows *= 2;
        }
        const boxes = [...this.letters];
        while (boxes.length < columns * rows)
            boxes.push(undefined);
        shuffle(boxes);
        const timerHeight = 200;
        const columnWidth = ABCRace.WIDTH / columns;
        const rowHeight = (ABCRace.HEIGHT - timerHeight) / rows;
        console.log(`${columns} columns with width ${columnWidth}`);
        console.log(`${rows} rows with height ${rowHeight}`);
        let minScale = 1;
        for (let i = 0; i < columns * rows; i++) {
            const box = boxes[i];
            if (!box)
                continue;
            const x = (i % columns * columnWidth) + columnWidth / 2;
            const y = timerHeight + (Math.floor(i / columns) * rowHeight) + rowHeight / 2;
            const letterSprite = this.add.sprite(x, y, box);
            this.sprites.push(letterSprite);
            const scale = Math.min(rowHeight / letterSprite.height, columnWidth / letterSprite.width) * 0.9;
            if (minScale > scale)
                minScale = scale;
            const rotation = getRandomNumber(-15, 15) * (Math.PI / 180);
            letterSprite.setRotation(rotation);
            letterSprite.setInteractive();
            letterSprite.on("pointerdown", () => {
                const hit = letterSprite.texture.key;
                const target = this.letters[this.currentLetter];
                if (target == hit) {
                    letterSprite.removeInteractive();
                    this.tweens.add({
                        alpha: 0.75,
                        duration: 250,
                        ease: Phaser.Math.Easing.Sine.InOut,
                        targets: [letterSprite]
                    });
                    const black = Phaser.Display.Color.ValueToColor(0x000000);
                    const red = Phaser.Display.Color.ValueToColor(0xFF0000);
                    const green = Phaser.Display.Color.ValueToColor(0x00FF00);
                    this.tweens.addCounter({
                        duration: 250,
                        ease: Phaser.Math.Easing.Sine.InOut,
                        from: 0,
                        onUpdate: (tween) => {
                            const value = tween.getValue();
                            const newColor = Phaser.Display.Color.Interpolate.ColorWithColor(black, green, 100, value);
                            const newColorN = Phaser.Display.Color.GetColor(newColor.r, newColor.g, newColor.b);
                            letterSprite.setTintFill(newColorN);
                            letterSprite.setAlpha(1 - 0.2 * value / 100);
                        },
                        to: 100,
                    });
                    this.currentLetter += 1;
                    this.sound.play("ok");
                    if (this.lastCorrect) {
                        const toFade = this.lastCorrect;
                        this.tweens.addCounter({
                            duration: 250,
                            ease: Phaser.Math.Easing.Sine.InOut,
                            from: 0,
                            onUpdate: (tween) => {
                                const value = tween.getValue();
                                toFade.setAlpha(1 - 0.8 * value / 100);
                            },
                            to: 100,
                        });
                    }
                    this.lastCorrect = letterSprite;
                    console.log(this.currentLetter);
                    if (this.currentLetter == 26) {
                        this.scene.start(ABCRaceMenuScene.Key);
                    }
                    this.numMistakesConcurrent = 0;
                }
                else {
                    console.log(`Hit ${hit}, but wanted ${target}`);
                    this.sound.play("ng");
                    this.numMistakes += 1;
                    this.numMistakesConcurrent += 1;
                }
            });
            letterSprite.disableInteractive();
        }
        for (const sprite of this.sprites)
            sprite.setScale(minScale);
        this.countdownCover = this.add.rectangle(0, 0, ABCRace.WIDTH, ABCRace.HEIGHT, 0xFFFFFF).setOrigin(0, 0);
        this.countdownCover.setDepth(1);
    }
    init(data) {
        this.lastCorrect = undefined;
        this.sprites = [];
        this.currentLetter = 0;
        this.numMistakes = 0;
        this.numMistakesConcurrent = 0;
        switch (data.mode) {
            case "lowercase": {
                this.letters = ABCRace.LowercaseLetters;
                break;
            }
            case "random": {
                const letters = [];
                for (let i = 0; i < 26; i++) {
                    const random = Math.round(Math.random());
                    if (random < 0.5) {
                        letters.push(ABCRace.LowercaseLetters[i]);
                    }
                    else {
                        letters.push(ABCRace.UppercaseLetters[i]);
                    }
                }
                this.letters = letters;
                break;
            }
            case "uppercase": {
                this.letters = ABCRace.UppercaseLetters;
                break;
            }
        }
    }
    update(time, delta) {
        if (this.countdown) {
            const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
            const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
            const countdownImages = ["three", "two", "one"];
            const countdownProgress = this.countdown.getProgress();
            const countdownProgressI = Math.floor(countdownImages.length * countdownProgress);
            const countdownProgressToNextI = (countdownImages.length * countdownProgress) - countdownProgressI;
            this.countdownCover.setAlpha(1 - countdownProgress);
            if (this.countdownImageI === undefined) {
                this.countdownImageI = countdownProgressI;
                this.countdownImage = this.add.sprite(screenCenterX, screenCenterY, countdownImages[this.countdownImageI]);
                this.sound.play("countdown");
                this.countdownImage.setDepth(2);
                this.countdownImage.setScale(1 - countdownProgressToNextI);
                this.countdownImage.setAlpha(1 - countdownProgressToNextI);
            }
            else if (countdownProgressI == countdownImages.length) {
                this.countdownImage.destroy(true);
                delete this.countdown;
                this.sound.play("start");
                this.startTime = Date.now();
                for (const sprite of this.sprites)
                    sprite.setInteractive();
            }
            else {
                if (this.countdownImageI !== countdownProgressI) {
                    this.countdownImage.destroy(true);
                    this.countdownImageI = countdownProgressI;
                    this.countdownImage = this.add.sprite(screenCenterX, screenCenterY, countdownImages[this.countdownImageI]);
                    this.sound.play("countdown");
                    this.countdownImage.setDepth(2);
                }
                this.countdownImage.setScale(1 - countdownProgressToNextI);
                this.countdownImage.setAlpha(1 - countdownProgressToNextI);
            }
        }
    }
    startGame() {
        this.countdownImage;
    }
}
ABCRacePlayScene.Key = "PLAY";
class ABCRace {
    constructor() {
        this.game = new Phaser.Game({
            backgroundColor: 0xFFFFFF,
            height: ABCRace.HEIGHT,
            scale: {
                autoCenter: Phaser.Scale.CENTER_BOTH,
                mode: Phaser.Scale.ScaleModes.FIT
            },
            scene: [ABCRaceLoadScene, ABCRaceMenuScene, ABCRacePlayScene],
            type: Phaser.AUTO,
            width: ABCRace.WIDTH
        });
    }
}
ABCRace.LowercaseLetters = [..."abcdefghijklmnopqrstuvwxyz"];
ABCRace.UppercaseLetters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
ABCRace.WIDTH = 800;
ABCRace.HEIGHT = 600;
window.onload = () => {
    new ABCRace();
};