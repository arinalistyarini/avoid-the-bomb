enchant();
 
//initial
window.onload = function() {
    var currentHeight;
    currentHeight = window.innerHeight;

    var ua = navigator.userAgent.toLowerCase();
    var ios = ( ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1  ) ? true : false;
    var android = ua.indexOf('android') > -1 ? true : false;

    var game = new Game(320, 480);
    game.preload('img/bg.png',
                 'img/bgover.png',
                 'img/bgstart.png',
                 'img/player.png',
                 'img/bomb.png',
                 'sound/Hit.mp3',
                 'sound/bgm.mp3');
    game.fps = 30;
    game.scale = currentHeight/480;
    game.onload = function() {
        var scene = new SceneStartGame();
        game.pushScene(scene);
    }
    window.scrollTo(0,0);
    game.start();   
};

var SceneStartGame = Class.create(Scene, {
    initialize: function(score) {
        var bgStart, startLabel, playLabel;
        Scene.apply(this);
        bgStart = new Sprite(320,480);
        bgStart.image = Game.instance.assets['img/bgstart.png'];

        // start label
        startLabel = new Label("AVOID THE BOMB");
        startLabel.x = 14;
        startLabel.y = 120; 
        startLabel.color = 'white';
        startLabel.font = '35px monospace';
        startLabel.textAlign = 'center';

        //tap to play label
        playLabel = new Label('Tap to Play');
        playLabel.x = 14;
        playLabel.y = 198;       
        playLabel.color = 'white';
        playLabel.font = '20px monospace';
        playLabel.textAlign = 'center';

        // Add BG & labels
        this.addChild(bgStart);
        this.addChild(startLabel);
        this.addChild(playLabel);

        // Background music
        this.bgm = Game.instance.assets['sound/bgm.mp3']; // Add this line
        // Start BGM
        this.bgm.play();

        // listener for tap fto restart
        this.addEventListener(Event.TOUCH_START, this.touchToStartPlaying);
    },

    touchToStartPlaying: function(evt) {
        var game = Game.instance;
        game.replaceScene(new SceneGame());
    },

    update: function(evt) {
        // Loop BGM
        if (this.bgm.currentTime >= this.bgm.duration ){
            this.bgm.play();
        }
    }
});

var SceneGame = Class.create(Scene, {
    // The main gameplay scene.     
    initialize: function() {
        var game, label, bg, player, bombGroup;
 
        Scene.apply(this);
        game = Game.instance;    
        bg = new Sprite(320,480);

        // label
        label = new Label('SCORE: 0');
        label.x = 12;
        label.y = 36;        
        label.color = 'white';
        label.font = '25px monospace';
        label.textAlign = 'center';
        label._style.textShadow ="-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black";
        this.scoreLabel = label;

        //bg
        bg.image = game.assets['img/bg.png'];
        
        //player
        player = new Player();
        player.x = game.width/2 - player.width/2;
        player.y = 320;
        this.player = player;

        //bomb group
        bombGroup = new Group();
        this.bombGroup = bombGroup;

        // add bg & player & bombGroup & labelScore
        this.addChild(bg);
        this.addChild(player);
        this.addChild(bombGroup);
        this.addChild(label);

        // Touch listener
        this.addEventListener(Event.TOUCH_START,this.handleTouchControl);

        this.addEventListener(Event.ENTER_FRAME, this.update);
        this.generateBombTimer = 0;

        this.scoreTimer = 0;
        this.score = 0;

        // Background music
        this.bgm = game.assets['sound/bgm.mp3']; // Add this line
        // Start BGM
        this.bgm.play();
    },

    handleTouchControl: function (evt) {
        var laneWidth, lane;
        laneWidth = 320/3;
        lane = Math.floor(evt.x/laneWidth);
        lane = Math.max(Math.min(2,lane),0);
        this.player.switchToLaneNumber(lane);
    },

    //score
    setScore: function (value) {
        this.score = value;
        this.scoreLabel.text = 'SCORE: ' + this.score;
    },

    // bomb update
    update: function(evt) {
        this.scoreTimer += evt.elapsed * 0.001;
        if (this.scoreTimer >= 0.5) {
            this.setScore(this.score + 1);
            this.scoreTimer -= 0.5;
        }

        this.generateBombTimer += evt.elapsed * 0.001;
        if (this.generateBombTimer >= 0.5) {
            var bomb;
            this.generateBombTimer -= 0.5;
            bomb = new Bomb(Math.floor(Math.random()*3));
            this.bombGroup.addChild(bomb);
        }
        // Check for bomb collision
        for (var i = this.bombGroup.childNodes.length - 1; i >= 0; i--) {
            var bomb;
            bomb = this.bombGroup.childNodes[i];
            if (bomb.intersect(this.player)){
                var game = Game.instance;
                game.assets['sound/Hit.mp3'].play();
                this.bombGroup.removeChild(bomb);

                // Game over
                this.bgm.stop();
                game.replaceScene(new SceneGameOver(this.score));
                break;
            }
        }

        // Loop BGM
        if (this.bgm.currentTime >= this.bgm.duration ){
            this.bgm.play();
        }
    }
});

// Player
var Player = Class.create(Sprite, {
    initialize: function() {
        Sprite.apply(this,[90, 87]);
        this.image = Game.instance.assets['img/player.png'];
        this.animationDuration = 0;
        this.addEventListener(Event.ENTER_FRAME, this.updateAnimation);
    },

    updateAnimation: function (evt) {        
        this.animationDuration += evt.elapsed * 0.001;       
        if (this.animationDuration >= 0.25) {
            this.frame = (this.frame + 1) % 2;
            this.animationDuration -= 0.25;
        }
    },

    // moving lane
    switchToLaneNumber: function(lane){     
        var targetX = 160 - this.width/2 + (lane-1)*90;
        this.x = targetX;
    }
});

// Bomb Obstacle
var Bomb = Class.create(Sprite, {
    // The obstacle that the penguin must avoid
    initialize: function(lane) {
        // Call superclass constructor
        Sprite.apply(this,[30, 53]);
        this.image  = Game.instance.assets['img/bomb.png'];      
        this.rotationSpeed = 0;
        this.setLane(lane);
        this.addEventListener(Event.ENTER_FRAME, this.update);
    },

    setLane: function(lane) {
        var game, distance;
        game = Game.instance;        
        distance = 90;
     
        this.rotationSpeed = Math.random() * 100 - 50;
     
        this.x = game.width/2 - this.width/2 + (lane - 1) * distance;
        this.y = -this.height;    
        this.rotation = Math.floor( Math.random() * 360 );    
    },

    update: function(evt) { 
        var ySpeed, game;
     
        game = Game.instance;
        ySpeed = 300;
     
        this.y += ySpeed * evt.elapsed * 0.001;
        this.rotation += this.rotationSpeed * evt.elapsed * 0.001;           
        if (this.y > game.height - 130) {
            this.parentNode.removeChild(this);        
        }
    }
});

// Game Over
var SceneGameOver = Class.create(Scene, {
    initialize: function(score) {
        var bgGameOver, gameOverLabel, scoreLabel, tapLabel;
        Scene.apply(this);
        bgGameOver = new Sprite(320,480);
        bgGameOver.image = Game.instance.assets['img/bgover.png'];

        // Game Over label
        gameOverLabel = new Label("GAME OVER");
        gameOverLabel.x = 8;
        gameOverLabel.y = 120; 
        gameOverLabel.color = 'white';
        gameOverLabel.font = '48px monospace';
        gameOverLabel.textAlign = 'center';

        // Score label
        scoreLabel = new Label('<br>SCORE: ' + score);
        scoreLabel.x = 4;
        scoreLabel.y = 138;       
        scoreLabel.color = 'white';
        scoreLabel.font = '28px monospace';
        scoreLabel.textAlign = 'center';

        //tap label
        tapLabel = new Label('Tap to Restart');
        tapLabel.x = 4;
        tapLabel.y = 228;       
        tapLabel.color = 'white';
        tapLabel.font = '22px monospace';
        tapLabel.textAlign = 'center';

        // Add BG & labels
        this.addChild(bgGameOver);
        this.addChild(gameOverLabel);
        this.addChild(scoreLabel);
        this.addChild(tapLabel);

        // listener for tap fto restart
        this.addEventListener(Event.TOUCH_START, this.touchToRestart);
    },

    touchToRestart: function(evt) {
        var game = Game.instance;
        game.replaceScene(new SceneGame());
    }
});