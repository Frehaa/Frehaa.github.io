class BreakoutGameState {
    constructor(physicsEngine) {
        const Vector = exports.Matter.Vector;
        this.activeBallsSet = new Set();
        this.hasLost = false;
        this.isInitialized = false;
        this.settings = {
            ball: {
                radius: 5,
                limit: 10,
                initialPosition: Vector.create(400, 400),
                initialSpeed: 10
            }
        }
        this.remainingLives = 3; // TODO: This is set by the level in question
        this.freeBallIds = [];
        this.idToBall = new Map();
        this.ballIds = new Set();
        this.controlBall = null;
        this.idToBlock = new Map();
        this.currentLevel = {};
        this.walls = {
            left: null,
            top: null,
            right: null,
            bottom: null,
        };
        this.objectsToDraw = new Map();
        this.runPhysics = true;
        this.physicsEngine = physicsEngine;
        this.timeStamp = 0;
    }
    addBall() {
        // Add ball for physics engine and drawing, and track its id
        // Alternatively we just create 10 balls and track which ones we use. Then we never have to dynamically add a new ball as long as we limit the maximum number of balls to 10.
        
        // Take some wall which is not currently active. Put it in the starting position and give it the starting velocity. Put a timer on it and let it go.

        const Composite = exports.Matter.Composite;
        const Body = exports.Matter.Body;
        const Vector = exports.Matter.Vector;

        const initialSpeed = this.settings.ball.initialSpeed;

        const freeBallId = this.freeBallIds.pop();
        const initialVelocity = Vector.create(1, -initialSpeed);
        const gameBall = this.idToBall.get(freeBallId);
        const ballBody = gameBall.rigidBody;
        this.activeBallsSet.add(freeBallId);
        Composite.add(this.physicsEngine.world, ballBody);
        Body.setPosition(ballBody, this.settings.ball.initialPosition);
        Body.setVelocity(ballBody, initialVelocity);

        return gameBall;
    }
    removeBall(gameBall) {
        const World = exports.Matter.World;
        World.remove(this.physicsEngine, gameBall.rigidBody);
        gameBall.rigidBody.position.x = -100; // Move out of the way until we need to use again
    }
    getGameBall(id) {
        return this.idToBall.get(id);
    }
    initialize() {
        if (this.isInitialized) return true;

        const Composite = exports.Matter.Composite;
        const World = exports.Matter.World;
        const Bodies = exports.Matter.Bodies;
        this.isInitialized = true;
        {
            // Create play balls
            const ballsToCreate = 1;// this.settings.ball.limit;
            const ballRadius = this.settings.ball.radius;
            for (let i = 0; i < ballsToCreate; i++) {
                const ballBody = Bodies.circle(-100, -100, ballRadius, {
                    friction: 0, 
                    frictionAir: 0, 
                    frictionStatic: 0,
                });
                const gameBall = new GameBall(ballBody);
                this.idToBall.set(ballBody.id, gameBall);
                this.freeBallIds.push(ballBody.id);
                this.objectsToDraw.set(ballBody.id, ctx => {
                    ctx.beginPath();
                    ctx.arc(ballBody.position.x, ballBody.position.y, ballRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = 'blue';
                    ctx.fill();                    
                });
            }
        }
        {
            // Control Ball
            const startPositionX = 300;
            const startPositionY = 400;
            const radius = 40;
            const controlBall = Bodies.circle(startPositionX, startPositionY, radius, {
                friction: 0,
                isStatic: true,
                frictionAir: 0,
                frictionStatic: 0,
            });
            this.controlBall = controlBall;
            this.objectsToDraw.set(controlBall.id, (ctx) => {
                ctx.beginPath();
                ctx.arc(controlBall.position.x, controlBall.position.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'green';
                ctx.fill();                    
            });
            Composite.add(this.physicsEngine.world, controlBall);
        }
        {
            // X and Y coordinates for the wall boundaries as seen from inside.
            const leftX = 0;
            const rightX = canvas.width;
            const topY = 0;
            const bottomY = canvas.height;
            const wallWidth = 100; // Increase to avoid tunneling.

            const leftWall = Bodies.rectangle(leftX -wallWidth/2, 0, wallWidth, 10_000, { isStatic: true  });
            this.walls.left = leftWall;
            Composite.add(this.physicsEngine.world, leftWall);

            const rightWall = Bodies.rectangle(rightX + wallWidth/2, 0, wallWidth, 10_000, { isStatic: true });
            this.walls.right = rightWall;
            Composite.add(this.physicsEngine.world, rightWall);

            const topWall = Bodies.rectangle(0, topY -wallWidth/2, 10_000, wallWidth, { isStatic: true });
            this.walls.top = topWall;
            Composite.add(this.physicsEngine.world, topWall);

            const bottomWall = Bodies.rectangle(0, bottomY+wallWidth/2, 10_000, wallWidth, { isStatic: true });
            this.walls.bottom = bottomWall;
            Composite.add(this.physicsEngine.world, bottomWall);

            this.objectsToDraw.set(leftWall.id, (ctx) => {
                ctx.beginPath();
                ctx.rect(leftX, 0, wallWidth, canvas.height);
                ctx.fillStyle = 'black';
                ctx.fill();
            });
            this.objectsToDraw.set(rightWall.id, (ctx) => {
                ctx.beginPath();
                ctx.rect(rightX, 0, wallWidth, canvas.height);
                ctx.fillStyle = 'black';
                ctx.fill();
            });
            this.objectsToDraw.set(topWall.id, (ctx) => {
                ctx.beginPath();
                ctx.rect(0, topY, canvas.width, wallWidth);
                ctx.fillStyle = 'black';
                ctx.fill();
            });                
            this.objectsToDraw.set(bottomWall.id, (ctx) => {
                ctx.beginPath();
                ctx.rect(0, bottomY, canvas.width, wallWidth);
                ctx.fillStyle = 'black';
                ctx.fill();
            });
        }

        this._applyBreakoutCollisionHandler();
    } 
    addBlock() {
        // We need to have an on collision which removes the block when hit
        const block = Bodies.rectangle(600, 100, 30, 20, { isStatic: true });
    }
    removeBlock(block) {

    }
    // The way this is coded now implies that we only lose lives when we lose a ball. 
    // This may be fine, but there can be reasons to decouple them.
    loseLife() {
        this.remainingLives -= 1;
        assert(this.remainingLives >= 0, 'Remaining lives turned negative.');
        if (this.remainingLives == 0)  {
            this.triggerLostEvent();
        }
    }
    triggerBallHitBottomEvent() {
        this.loseLife();
        if (this.hasLost == false) {
            this.currentLevel.triggerBallHitBottomEvent(this);
        }
    }
    triggerLostEvent() {
        this.hasLost = false;
        console.log("Game over");
    }
    update(deltaTime) {

    }
    draw(ctx) {
        for (const objectToDraw of this.objectsToDraw) {
            objectToDraw.draw(ctx); 
        }

        // Draw UI
    }
    isBall(body) {
        return this.idToBall.has(body.id);
    }
    isControl(body) {
        return body.id === this.controlBall.id;
    }
    isWall(body) {
        return body.id === this.walls.left.id || 
                body.id === this.walls.right.id || 
                body.id === this.walls.top.id || 
                body.id === this.walls.bottom.id;
    }
    isBlock(body) {
        return this.idToBlock.has(body.id);
    }
    _applyBreakoutCollisionHandler() {
        const Events = exports.Matter.Events;
        const self = this;

        Events.on(this.physicsEngine, 'collisionStart', function(event) {
            event.pairs.forEach(pair => {
                pair.isActive = false;
                const {bodyA, bodyB, collision} = pair;
                console.log('Collision start', bodyA, bodyB)
                if (self.isBall(bodyA)) { 
                    if (self.isBall(bodyB)) {
                        ballHitsBall(bodyA, bodyB)
                    } else if (self.isControl(bodyB)) {
                        ballHitsControl(bodyA, bodyB, collision, self);
                    } else if (self.isWall(bodyB)) {
                        ballHitsWall(bodyA, bodyB, self);
                    } else if (self.isBlock(bodyA)) {
                        ballHitsBlock(bodyA, bodyB, collision, self);
                    }
                } else if (self.isBall(bodyB)) {
                    if (self.isControl(bodyA)) {
                        ballHitsControl(bodyB, bodyA, collision, self);
                    } else if (self.isWall(bodyA)) {
                        ballHitsWall(bodyB, bodyA, self);
                    } else if (self.isBlock(bodyA)) {
                        ballHitsBlock(bodyB, bodyA, collision, self);
                    }
                } 
                else if (self.isControl(bodyA) || self.isControl(bodyB)) {
                    console.log("Control hit something not a ball?", bodyA, bodyB)
                }

                else if (self.isBlock(bodyA) && self.isBlock(bodyB)) {
                    blockHit(bodyA, self);
                    blockHit(bodyB, self);
                }
                
                // Neither bodyA nor bodyB are balls
                // If block hits block
                // If block hits control
                // If control hits wall?
                // If block hits bottom
                // The only other thing that can move are the control ball and the blocks

            });
        });
        // Events.on(this.physicsEngine, 'collisionActive', function(event) {
        //     console.log(event);
        // })
        // Events.on(this.physicsEngine, 'collisionEnd', function(event) {
        //     console.log(event);
        // })


    }
    moveControlBall(x) {
        const Body = exports.Matter.Body;
        const Vector = exports.Matter.Vector;
        // x = clamp(x, this.controlBall.radius, this.walls.rightWall - this.controlBall.radius)
        Body.setPosition(this.controlBall, Vector.create(x, this.controlBall.position.y));
    }
}

class GameBlock {
    constructor(rigidBody, hitPoints = 1) {
        this.rigidBody = rigidBody;
        this.hitPoints = hitPoints;
    }

    draw(ctx) {
        const width = this.rigidBody.width;
        const height = this.rigidBody.height;
        const left = this.rigidBody.position.x - width/2;
        const top = this.rigidBody.position.y - height/2;
        ctx.beginPath();
        ctx.strokeRect(left, top, width, height);
    }

    triggerOnHitEvent(gameState) {
        // Don't do anything for the most basic block type
        // Split for split type
        // Fall for fall type
    }
}

// What if a ball hits 2 blocks at the same time? With a simple enough physics system, then this should be impossible.
// Invariants: 
//  1. Balls have at least a speed of X at all times (and X * 1/C when slowed).
//  2. 

function bounceBall(ballBody, direction) {
    console.log("Bounce ball");
    
    const Body = exports.Matter.Body;
    const Vector = exports.Matter.Vector;

    const currentVelocity = Body.getVelocity(ballBody);
    const dot = Vector.dot(currentVelocity, direction);
    const newVelocity = Vector.sub(currentVelocity, Vector.mult(direction, 2 * dot)); // Formula for reflecting based on normal
    console.log(newVelocity);
    
    Body.setVelocity(ballBody, newVelocity);
    console.log(ballBody.velocity);
    
    makeSureBallBehavesWell(ballBody);
}

function ballHitsWall(ball, wall, gameState) {
    console.log('Ball hit wall');
    
    const Vector = exports.Matter.Vector;
    switch (wall.id) {
        case gameState.walls.bottom.id: {
            bounceBall(ball, Vector.create(0, -1)); 
            // gameState.triggerBallHitBottomEvent(ball);
        } break;
        case gameState.walls.top.id: {
            bounceBall(ball, Vector.create(0, 1)); 
        } break;
        case gameState.walls.left.id: {
            bounceBall(ball, Vector.create(1, 0)); 
        } break;
        case gameState.walls.right.id: {
            bounceBall(ball, Vector.create(-1, 0));
        } break;
        default: 
            throw new Error("Wall argument does not match any walls in the state.");
    }
}

function makeSureBallBehavesWell(ball) {
    const Body = exports.Matter.Body;
    const Vector = exports.Matter.Vector;
    assert(ball.speed > 0, "For some reason the ball speed was 0.");
    const velocity = Body.getVelocity(ball);
    if (velocity.y === 0) {
        const angleLimit = 0.1;
        const upWardsAngle = Math.random() * angleLimit;
        const newVelocity = Vector.create(velocity.x, upWardsAngle);
        Body.setVelocity(ball, newVelocity);
    }

    const ballSpeedLowerThreshold = 10; // TODO: Move outside to some level based settings
    if (ball.speed < ballSpeedLowerThreshold) {
        const velocity = Body.getVelocity(ball);
        const increaseFactor = ballSpeedLowerThreshold / ball.speed;
        const newVelocity = Vector.mult(velocity, increaseFactor);
        Body.setVelocity(ball, newVelocity);
    }
}

function ballHitsBall(ballA, ballB) {
    const Vector = exports.Matter.Vector;
    // TODO: Handle the following corner case. I guess the best bet is to look at previous positions and calculate from there
    assert(ballA.position.x != ballB.position.x || ballA.position.y != ballB.position.y, "Ball collision at exact same locations.");
    const direction = Vector.sub(ballA.position, ballB.position); 
    bounceBall(ballA, direction);
    makeSureBallBehavesWell(ballA)
    bounceBall(ballB, direction);
    makeSureBallBehavesWell(ballB)
}

function ballHitsBlock(ball, block, collision, gameState) {
    bounceBall(ball, collision.normal);
    blockHit(block, gameState);
}

// TODO: This structure of block suggests that all the game logic of the block is attached to the physics block body
function blockHit(blockBody, state) {
    const gameBlock = state.getBlockData(blockBody.id);
    gameBlock.reduceLife();
    if (gameBlock.remainingLives === 0) {
        state.removeBlock(gameBlock);
    } else {
        gameBlock.triggerOnHitEvent(state);
    }
}

function ballHitsControl(ballBody, controlBody, collision, gameState) {
    
    const Body = exports.Matter.Body;
    const Vector = exports.Matter.Vector;
    const gameBall = gameState.getGameBall(ballBody.id);
    const controlBallHitCooldown = gameState.settings.ball.controlBallHitCooldown;

    if (gameBall.lastControlBallHitTimestamp + controlBallHitCooldown < gameState.timeStamp) return; // Don't handle colision

    // Handle Bounce direction
    let bounceDirection = collision.normal;
    if (bounceDirection.y < 0) {
        bounceDirection.y += 0.3;
    }
    bounceBall(ballBody, bounceDirection);
    const ballVelocity = Body.getVelocity(ballBody);
    assert(ballVelocity.y < 0, "After bouncing off control ball the ball does not have upward direction.");


    // Handle potential bounce speed increase
    const controlBallSpeed = Vector.magnitude(Vector.sub(controlBody.position, controlBody.positionPrev));
    if (controlBallSpeed > ballBody.speed) {
        const speedIncreaseFactor = controlBallSpeed / ballBody.speed;
        const newVelocity = Vector.mult(ballVelocity, speedIncreaseFactor);
        Body.setVelocity(ballBody, newVelocity);
    }

    gameBall.lastControlBallHitTimestamp = gameState.timeStamp;
}

function ballClicked(ball, now) {
    // If ball recently clicked 
    //      return
    // slow down ball speed
    // Update slowdown time to now
}

// What are the actions that can happen? 
// 0. Walls can exist
// 1. Ball moves (update position)
// 2. Ball hits wall (update direction)
// 3. Ball hits ball (update directions)
// 4. Ball hits block (update direction + trigger on hit)
// 5. Ball hits control ball (update direction + increase speed + add touch cooldown)
// 6. Ball can be clicked to be slowed (toggle flag + (start cooldown + start duration))

function blockClicked(block, state, now) {
    // If block position y > threshold
    //      set block health 1 
    //      trigger block hit
}

// 7. Block can be hit (trigger on hit + remove life)
// 8. Block can be clicked when close (remove all life / destroy)
// 9. Block can move (update position)

// 10. Control ball moves (update position) (TBD: Does the ball have velocity or just a position?)
// 11. Control ball can be dragged to move it
// 12. TBD What happens if the control ball is hit by a block? (Stun? Destroy the block? Both? Lose a life? I don't like lossing life since life should be the bottom of screen. )

class ControllerBall {
    constructor(rigidBody) {
        this.rigidBody = rigidBody;
    }

    draw(ctx) {
        const centerX = this.rigidBody.position.x;
        const centerY = this.rigidBody.position.y;
        const radius = this.rigidBody.radius;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill()
    }
}

class GameBall {
    constructor(rigidBody) {
        this.rigidBody = rigidBody;
        
        this.controlBallCollision = false; // If the ball can hit the control ball
        this.isSlowed = false; 
        this.slowCoefficient = 0.3;
        this.slowCooldown = 0;
        this.spawnAnimationTime = 0;
    }

    draw(ctx) {
        const centerX = this.rigidBody.position.x;
        const centerY = this.rigidBody.position.y;
        const radius = this.rigidBody.radius;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();

        assert(this.position[0] - this.radius >= state.walls.left, `Draw outside left wall ${this.position[0]}`);
        assert(this.position[1] - this.radius >= state.walls.top, `Draw outside top wall ${this.position[1]}`);
        assert(this.position[0] + this.radius <= state.walls.right, `Draw outside right wall ${this.position[0]}`);
        assert(this.position[1] - this.radius <= state.walls.bottom, `Draw outside bottom wall ${this.position[1]}`);
    }
} 


function test_matter() {
    // module aliases
    const Engine = exports.Matter.Engine,
        Render = exports.Matter.Render,
        Events = exports.Matter.Events;
    const Vector = exports.Matter.Vector;
    const Composite = exports.Matter.Composite;
    const Bodies = exports.Matter.Bodies;
    const Body = exports.Matter.Body;

    // create an engine
    const engine = Engine.create({
        gravity: {
            scale: 0
        }
    });

    const gameState = new BreakoutGameState(engine);
    gameState.initialize()
    const ball = gameState.addBall();

    // bounceBall(ball.rigidBody, Vector.create(0, -1));
    
    // gameState.removeBall(ball);

    // create a renderer
    var render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false

        }
    });

    // const ball = Bodies.circle(100, 100, 10, {
    //     friction: 0, 
    //     frictionAir: 0, 
    //     frictionStatic: 0,
    // });

    // const v = Vector.create(10, 10);
    // Body.setVelocity(ball, v);
    // Composite.add(engine.world, ball);
 

    Events.on(engine, 'collisionActive', function(event) {
        // console.log("Active", event);
        
    });
    Events.on(engine, 'collisionEnd', function(event) {
        console.log("End", event);
            // Runner.stop(runner)
    })


    // run the renderer
    Render.run(render);

    let lastTime = 0;
    function update(time) {
        const deltaTime = lastTime - time;
        const timeStep = 16;
        gameState.update(timeStep);
        
        Engine.update(engine, timeStep);
        requestAnimationFrame(update);
    }

    requestAnimationFrame(time => {
        lastTime = time;
        update(time);
    });

    canvas.addEventListener('mousemove', e => {
        const x = (e.pageX - e.target.offsetLeft) * (canvas.width / canvas.clientWidth);
        gameState.moveControlBall(x);
    });
}


// TODO: Different Levels with different mechanics
//  Juggling levels: More and more balls. The player can freeze?/slow down? balls by pressing on them. Short duration and cooldown (Maybe show whether a ball can be slowed based on its color). We can have as many levels as we want. The goal is not to lose too many balls. Maybe we have 3 lives or something. If a ball is lost it is replaced.
//  Falling Blocks levels: Blocks can fall and damage the player. Introduce some mechanic to destroy blocks. Based on the control ball? Press the block when close? Fire a projectile? Avoid it and let it pass? Have it stun the control ball?
//  Endless
//  Regenerating blocks, Blocks which split into other blocks.
//  Accelerating ball 
//  Custom: Ball count, speed, blocks

const levelsData = [
    {
        gridPosition: {x: 0, y: 0}, 
        levelName: "test",
        levelSettings: {
            blockSetupConstructor: () => {},
            balls: 1,
            ballMinSpeed: 1,
            ballMaxSpeed: 2,
        },
    },
    {
        gridPosition: {x: 1, y: 0}, 
        levelName: "test",
        levelSettings: {
            blockSetupConstructor: () => {},
            balls: 1,
            ballMinSpeed: 1,
            ballMaxSpeed: 2,
        },
    },    
    {
        gridPosition: {x: -1, y: 0}, 
        levelName: "test",
        levelSettings: {
            blockSetupConstructor: () => {},
            balls: 1,
            ballMinSpeed: 1,
            ballMaxSpeed: 2,
        },
    },
];

function testDifferentScreens() {
    const titleScreen = {
        state: {
        },
        draw(ctx) {

            ctx.fillStyle = '#281E5D';
            ctx.fillRect(0, 0, 1000, 1000);


        }, 
        onPress() {

        },
        onDrag() {

        },
        onRelease() {

        }
    };
    const settingsScreen = {
        state: {

        }, 
        draw(ctx) {

        }, 
        onKeyDown(key) {
            
        }, 
        onMouseMove() {

        },
        onMouseUp() {

        }
    }

    const state = {
        currentScreen: null,
    };

}

// TODO: We draw all balls
// TODO: Draw Walls
// TODO: We draw the control thingy
// TODO: Move the control thingy
// TODO: 

// DESIGN GOAL: Only the game should be on screen. No need for for text UI etc. to display information
//                 How should lives then be communicated? 

function onbodyload() {
    // return;
    // return test_matter_self_draw();
    return test_matter();
    // 1. Flying ball(s)
    // 2. (Moving) Blocks 
    // 3. Player ball?bat?collidable thingy
    // 4. Collision detection
    // 5. Collision response
    // 
    

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    console.log(ctx);
    
    const controllerBall = new ControllerBall();

    const ball = new GameBall();
    ball.position[0] = 100; 
    ball.position[1] = 100; 

    ball.velocity[0] = 0.512;
    ball.velocity[1] = 0.600;

    const leftMargin = 5;
    const topMargin = 5;
    const offsetX = 3;
    const offsetY = 3;
    const blocks = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 20; j++) {
            const block = new GameBlock(leftMargin + j * (GameBlock.SIZE[0] + offsetX), topMargin + i * (GameBlock.SIZE[1] + offsetY));
            blocks.push(block);
        }
    }

    const state = {
        balls: [ball],
        controlBall: controllerBall,
        blocks: blocks,
        mousePosition: [0, 0],
        walls: {
            left: 5,
            top: 5,
            right:canvas.width - 5,
            bottom: canvas.height - 5
        }
    };
    console.log(state);
    
    window.state = state;
    controllerBall.position[1] = state.walls.bottom - controllerBall.radius;

    canvas.addEventListener('mousemove', e => {
        state.mousePosition[0] = e.clientX;
    });

    const animationFrameRequestManager = new AnimationFrameRequestManager((deltaTime, time) => {
        ctx.clearRect(0, 0, canvas.gclientWidth, canvas.clientHeight);

        const maxUpdateStepMs = 5;
        let dt = deltaTime;
        while (dt > maxUpdateStepMs) {
            update(state, maxUpdateStepMs);
            dt -= maxUpdateStepMs;
        }
        update(state, dt);

        // We want to check for collision and interpenetration
        // While we are interpenetrating we subdivide the time. 
        // If no collision or interpenetration happens then we simply move forward.
        // If we collide then we handle the collision.

        for (const block of blocks) {
            // block.draw(ctx); 
        }

        ball.draw(ctx);

        // controllerBall.draw(ctx);

        ctx.strokeRect(state.walls.left, state.walls.top, state.walls.right - state.walls.left, state.walls.bottom - state.walls.top);
    })

    document.addEventListener('keydown', e => {
        if (e.code == "KeyP") {
            animationFrameRequestManager.togglePause();
        }
    })

    animationFrameRequestManager.start(ctx);
}

// We assume that after an update, the state is in a valid position, such that the next update can assume it starts in a valid position.
function update(state, deltaTime) {
    // for (let i = 0; i < state.balls.length; i++) {
    //     const ball = state.balls[i];
    //     ball.newPosition[0] = ball.position[0] + ball.velocity[0] * deltaTime;
    //     ball.newPosition[1] = ball.position[1] + ball.velocity[1] * deltaTime;
    // }

    state.controlBall.newPosition[0] = clamp(state.mousePosition[0], state.walls.left + state.controlBall.radius, state.walls.right - state.controlBall.radius);

    // const collisions = [];
    // for (let i = 0; i < state.balls.length; i++) {
    //     const ballA = state.balls[i];
    //     for (let j = i + 1; j < state.balls.length; j++) {
    //         const ballB = state.balls[j];
    //         if (checkBallBallCollision(ballA, ballB)) {
    //             collisions.push(i, j);
    //         }

    //     }
    // }

    // TODO: Handle corner cases where we hit the wall and a block, two blocks, or the wall and the player at the same time. 
    // TODO: Handle corner case where the ball hits the corner of a block.

    const ball = state.balls[0];
    const dx = ball.velocity[0] * deltaTime;
    const dy = ball.velocity[1] * deltaTime;

    ball.newPosition[0] = ball.position[0] + dx;
    ball.newPosition[1] = ball.position[1] + dy;

    const xDist = Math.abs(dx);
    const yDist = Math.abs(dy);

    const walls = state.walls;
    const ballNewLeft = ball.newPosition[0] - ball.radius;
    const ballNewRight = ball.newPosition[0] + ball.radius;
    const ballNewBottom = ball.newPosition[1] + ball.radius;
    const ballNewTop = ball.newPosition[1] - ball.radius;


    const ballLeft = ball.position[0] - ball.radius;
    const ballRight = ball.position[0] + ball.radius;
    const ballBottom = ball.position[1] + ball.radius;
    const ballTop = ball.position[1] - ball.radius;

    // TODO?: I guess there is an issue where if we update our new positions, we may still have an issue with collisions after. A simple extreme case is if we bounce on the left wall and have enough remaining velocity to fly outside the right wall.


    if (ballNewLeft < walls.left) {
        const distanceToWallCollision = ballLeft - walls.left; 
        const remainingVelocity = xDist - distanceToWallCollision;
        assert(remainingVelocity >= 0, `Negative remaining velocity X ${dx} ${ball.position}`);
        ball.newPosition[0] = walls.left + ball.radius + remainingVelocity;
        ball.velocity[0] = -ball.velocity[0];
    } else if (ballNewRight > walls.right) {
        const distanceToWallCollision = walls.right - ballRight;
        const remainingVelocity = xDist - distanceToWallCollision;
        assert(remainingVelocity >= 0, `Negative remaining velocity X ${dx} ${ball.position}`);
        ball.newPosition[0] = walls.right - ball.radius - remainingVelocity;
        ball.velocity[0] = -ball.velocity[0];
    }

    if (ballNewTop < walls.top) {
        const distanceToWallCollision = ballTop - walls.top; 
        const remainingVelocity = yDist - distanceToWallCollision;
        assert(remainingVelocity >= 0, `Negative remaining velocity Y ${dy} ${ball.position}`);
        ball.newPosition[1] = walls.top + ball.radius + remainingVelocity;
        ball.velocity[1] = -ball.velocity[1];
    } else if (ballNewBottom > walls.bottom) {
        const distanceToWallCollision = walls.bottom - ballBottom;
        const remainingVelocity = yDist - distanceToWallCollision;
        assert(remainingVelocity >= 0, `Negative remaining velocity Y ${dy} ${ball.position}`);
        ball.newPosition[1] = walls.bottom - ball.radius - remainingVelocity;
        ball.velocity[1] = -ball.velocity[1];
    }


    for (let i = 0; i < state.balls.length; i++) {
        const ball = state.balls[i];
        ball.position[0] = ball.newPosition[0];
        ball.position[1] = ball.newPosition[1];
    }

    state.controlBall.position[0] = state.controlBall.newPosition[0];
}

function checkBallBallCollision(a, b) {
    const dx = a.newPosition[0] - b.newPosition[0];
    const dy = a.newPosition[1] - b.newPosition[1];
    const distanceSquared = dx*dx + dy*dy;

    const radiusSum = a.radius + b.radius;

    return distanceSquared < radiusSum * radiusSum;
}

function createGridBlockPattern(state, ) {
    const blocks = [];
    

}