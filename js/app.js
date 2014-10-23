var WIDTH = 505;
var HEIGHT = 606;

var BLOCK_WIDTH = WIDTH / 5;
var BLOCK_HEIGHT = 83;


var PLAYER_TOP = -10;
var BUG_TOP = -20;
var ROCK_TOP = -20;


var NROWS = 6;
var NCOLUMNS = 5;

var N_ENEMY_ROWS = 3;
var NENEMIES = 3;

var FINISH_LINE = 5;
//closer to 1 is less forgiving
//cloesr to 0 is more forgiving
var COLLISION_CUSHION = .8;

function invertY(y){
    return Math.abs(y - (NROWS - 1));
}


function computeCoordinates(col, row, top){
    //col, row -> game grid coordinates starting
    //    with 0, 0 on bottom right
    //return canvas coordinates
    return {
        x: col * BLOCK_WIDTH,
        y: invertY(row) * BLOCK_HEIGHT + top
    }
}


function decimalColumn(x){
    //Return the column coordinate given the canvas x coordinate.
    //Decimals return values are allowed and encouraged and
    //represent the quantum state.
    return x / BLOCK_WIDTH;
}


// Enemies our player must avoid
var Enemy = function(row, speed) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images

    //


    this.sprite = 'images/enemy-bug.png';
    this.x = 0;
    this.y = computeCoordinates(0, row, BUG_TOP).y;
    this.row = row;
    // console.log("the grid x of the enemy is " + decimalColumn(this.x));
    this.speed = speed;
}


// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x = (this.x + dt * 20 * this.speed) % WIDTH;
}

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

Enemy.prototype.isCollision = function(col, row){
    if (row != this.row){
        return false;
    }
    return (Math.abs(decimalColumn(this.x) - col) < COLLISION_CUSHION)
        ?
        true:
        false;
}



// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

var Player = function(){
    var col = 0;
    var row = 0;
    var sprite = "images/char-boy.png";

    function enforceBorder(coord, gridsize){
        return Math.max(
            Math.min(coord, gridsize - 1),
            0);
    }

    function move(over, up){
        moveHorizontal(over);
        moveVertical(up);
    }

    function moveHorizontal(over){
        if (!rockInSquare(col + over, row))
            col = enforceBorder(col + over, NCOLUMNS);
    }

    function moveVertical(up){
        if (!rockInSquare(col, row + up))
            row = enforceBorder(row + up, NROWS);
    }

    function isCollision(){
        var rowEnemies = getEnemiesInRow(row);
        if (!rowEnemies){
            return false;
        }
        for (var i = 0; i < rowEnemies.length; i++){
            if (rowEnemies[i].isCollision(col, row)){
                return true;
            }
        }
        return false;
    }

    function getCoordinates(){
        return computeCoordinates(col, row, PLAYER_TOP);
    }

    this.backToSquareOne = function(){
        col = 0;
        row = 0;
    }

    this.up = function(){
        moveVertical(1);
    };

    this.down = function(){
        moveVertical(-1);
    };

    this.right = function(){
        moveHorizontal(1);
    };

    this.left = function(){
        moveHorizontal(-1);
    };

    this.update = function(){
        if (isCollision()){
            deathUp();
            this.backToSquareOne();
        }
        if (row == FINISH_LINE){
            allEnemies.push(new Rock(col, row));
            this.backToSquareOne()
        }
        if (finishedLevel()){
            levelUp();
            restart();
        }
    };

    this.render = function(){
        var coords = getCoordinates();
        ctx.drawImage(Resources.get(sprite), coords.x, coords.y);
    };

    this.handleInput = function(direction){
        console.log("moving in " + direction);
        if (direction)
            this[direction]();
    };
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
function createEnemies(speedFactor, nenemies){
    var enemies = [];
    var rows = []; //holds arrays of enemies who live in each row
    var rocks = {};
    var nEnemieRows = N_ENEMY_ROWS;

    function rowAppend(enemy, y){
        if (!rows[y]){
            rows[y] = [enemy];
        }else{
            rows[y].push(enemy);
        }
    }
    function hash(col, row){
        return col.toString() + row.toString();
    }


    for (var i = 0; i < N_ENEMY_ROWS; i++){
        var row = i + 2;
        var rowsLeft = N_ENEMY_ROWS - i;
        console.log("row = " + row);
        var n = Math.floor(nenemies / rowsLeft);
        console.log("n = " + n);
        nenemies -= n;
        console.log("nenemies = " + nenemies);
        for (var j = 0; j < n; j++){
            //speed formula: (row + j) * speedFactor
            var enemy = new Enemy(row, (row + j) * speedFactor);
            enemies.push(enemy);
            rowAppend(enemy, row);
        }
    }

    enemies.getEnemiesInRow = function (y){
        return rows[y];
    }

    enemies.setRock = function(col, row){
        rocks[hash(col, row)] = true;
    }
    enemies.removeRock = function(col, row){
        rocks[hash(col, row)] = false;
    }
    enemies.rockInSquare = function(col, row){
        return rocks[hash(col, row)];
    }
    return enemies;
}

function getEnemiesInRow(row){
    return allEnemies.getEnemiesInRow(row);
}

function rockInSquare(col, row){
    return allEnemies.rockInSquare(col, row)
}

function Rock(col, row){
    var coords = computeCoordinates(col, row, ROCK_TOP);
    this.x = coords.x;
    this.y = coords.y;
    console.log('making rock in col = ' + col + ' row = ' + row);
    console.log('the coords are ' + this.x + ' ' + this.y);
    allEnemies.setRock(col, row);
    this.render = function(){
        ctx.drawImage(Resources.get('images/Rock.png'), this.x, this.y);
    }
    this.update = function(){};
}

var allEnemies;

var player = new Player();


function finishedLevel(){
    //the rock in each column is added to the enemies array
    return allEnemies.length == getNEnemies() + NCOLUMNS;
}

var _level = 0;
var _deaths = -1;

function levelUp(){
    document.getElementById("level").textContent = ++_level;
}

function deathUp(){
    document.getElementById("deaths").textContent = ++_deaths;
}

levelUp();
deathUp();

function getNEnemies(){
    return 3 + Math.floor(_level / 3);
}

function getSpeedFactor(){
    return (_level % 3) + Math.floor(_level / 3);
}

function restart(){
    allEnemies = createEnemies(getSpeedFactor(), getNEnemies());
    player.backToSquareOne();
}

restart();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
