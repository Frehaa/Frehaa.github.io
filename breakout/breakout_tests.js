function breakout_tests() {
    const tests = [
        left_moving_ball_moves_right_after_hitting_left_wall,
        right_moving_ball_moves_left_after_hitting_right_wall,
        up_moving_ball_moves_down_after_hitting_top_wall
    ];

    for (const test of tests) {
        try {
            test(); 
        } catch (error) {
            l(test.name ,error);
        }
    }
}

function defaultTestGameState(engine) {
    return {
        timeStamp: 0,
        update(dt) {
            this.timeStamp += dt;
        },
        triggerBallHitBottomEvent(){

        },
        getBall() {

        },
    };
}

function alwaysFalse() {
    return false;
}

function left_moving_ball_moves_right_after_hitting_left_wall() {
    const Engine = exports.Matter.Engine,
        Vector = exports.Matter.Vector,
        Body = exports.Matter.Body,
        Bodies = exports.Matter.Bodies,
        Composite = exports.Matter.Composite;

    const engine = Engine.create({
        gravity: {
            scale: 0.0,
        }
    });
    const gameState = defaultTestGameState(engine);
    const worldObjects = [];
    {
        // create two boxes and a ground
        const ballRadius = 5;
        const ballPositionX = 30;
        const ballPositionY = 100
        const ball = Bodies.circle(ballPositionX, ballPositionY, ballRadius, {
            friction: 0, 
            frictionAir: 0, 
            frictionStatic: 0,
        });
        const startVelocity = Vector.create(-10, 0);
        Body.setVelocity(ball, startVelocity);
        worldObjects.push(ball);
    }

    {
        const wallHeight = 800;
        const wallWidth = 100; 
        const wallCenterPositionX = -wallWidth/2; // Wall starts at x = 0 and continues in -x direction
        const wallCenterPositionY = wallHeight / 2; // Wall spans from y = 0 and down to y = wallHeight
        const leftWall = Bodies.rectangle(wallCenterPositionX, wallCenterPositionY, wallWidth, wallHeight, { isStatic: true });
        worldObjects.push(leftWall);
    }
    Composite.add(engine.world, worldObjects);

    const ballIds = new Set();
    ballIds.add(worldObjects[0].id);

    function isBall(body) {
        return ballIds.has(body.id);
    }

    function alwaysFalse(body) {
        return false;
    }
    function isWall(body) {
        return body.id === worldObjects[1].id;
    }

    applyBreakoutCollisionHandler(engine, gameState, isBall, alwaysFalse, isWall, alwaysFalse);
    
    const ball = worldObjects[0];
    for (let i = 0; i < 10; i++) {
        Engine.update(engine, 10);
        // assert(ball.position.x >= ball.radius, `Ball inside left wall (${ball.position}) after update`);
    }
    assert(ball.velocity.x > 0);
    const BALL_MINIMUM_SPEED = 10; // Placeholder
    assert(ball.speed >= BALL_MINIMUM_SPEED);

    return [engine, worldObjects];
}


function right_moving_ball_moves_left_after_hitting_right_wall() {
    const Engine = exports.Matter.Engine,
        Vector = exports.Matter.Vector,
        Body = exports.Matter.Body,
        Bodies = exports.Matter.Bodies,
        Composite = exports.Matter.Composite;

    const engine = Engine.create({
        gravity: {
            scale: 0.0,
        }
    });
    const worldObjects = [];
    
    // create two boxes and a ground
    const ballRadius = 5;
    const ballPositionX = 30;
    const ballPositionY = 100
    const ball = Bodies.circle(ballPositionX, ballPositionY, ballRadius, {
        friction: 0, 
        frictionAir: 0, 
        frictionStatic: 0,
    });
    const startVelocity = Vector.create(10, 0);
    Body.setVelocity(ball, startVelocity);
    worldObjects.push(ball);

    const wallHeight = 800;
    const wallWidth = 100; 
    const wallCenterPositionX = 100+wallWidth/2; // Wall starts at x = 100 and continues in x direction
    const wallCenterPositionY = wallHeight / 2; // Wall spans from y = 0 and down to y = wallHeight
    const leftWall = Bodies.rectangle(wallCenterPositionX, wallCenterPositionY, wallWidth, wallHeight, { isStatic: true });
    worldObjects.push(leftWall);

    Composite.add(engine.world, worldObjects);

    const ballIds = new Set();
    ballIds.add(ball.id);

    function isBall(body) {
        return ballIds.has(body.id);
    }

    function isWall(body) {
        return body.id === worldObjects[1].id;
    }

    applyBreakoutCollisionHandler(engine, gameState, isBall, alwaysFalse, isWall, alwaysFalse);
    
    for (let i = 0; i < 10; i++) {
        const dt = 10;
        Engine.update(engine, dt);
        gameState.update(dt);
        // assert(ball.position.x >= ball.radius, `Ball inside left wall (${ball.position}) after update`);
    }
    assert(ball.velocity.x < 0);
    const BALL_MINIMUM_SPEED = 10; // Placeholder
    assert(ball.speed >= BALL_MINIMUM_SPEED);

    return [engine, worldObjects];
}

function up_moving_ball_moves_down_after_hitting_top_wall() {
    const Engine = exports.Matter.Engine,
        Vector = exports.Matter.Vector,
        Body = exports.Matter.Body,
        Bodies = exports.Matter.Bodies,
        Composite = exports.Matter.Composite;

    const engine = Engine.create({
        gravity: {
            scale: 0.0,
        }
    });
    const worldObjects = [];
    
    // create two boxes and a ground
    const ballRadius = 5;
    const ballPositionX = 30;
    const ballPositionY = 100
    const ball = Bodies.circle(ballPositionX, ballPositionY, ballRadius, {
        friction: 0, 
        frictionAir: 0, 
        frictionStatic: 0,
    });
    const startVelocity = Vector.create(0, -10);
    Body.setVelocity(ball, startVelocity);
    worldObjects.push(ball);

    const wallHeight = 100;
    const wallWidth = 800; 
    const wallCenterPositionX = wallWidth/2; // Wall starts at x = 0 and continues in x direction
    const wallCenterPositionY = -wallHeight / 2; // Wall starts from y = 0 and continues in -y direction
    const leftWall = Bodies.rectangle(wallCenterPositionX, wallCenterPositionY, wallWidth, wallHeight, { isStatic: true });
    worldObjects.push(leftWall);

    Composite.add(engine.world, worldObjects);

    const ballIds = new Set();
    ballIds.add(ball.id);

    function isBall(body) {
        return ballIds.has(body.id);
    }

    function isWall(body) {
        return body.id === worldObjects[1].id;
    }

    applyBreakoutCollisionHandler(engine, gameState, isBall, alwaysFalse, isWall, alwaysFalse);
    
    for (let i = 0; i < 10; i++) {
        Engine.update(engine, 10);
        // assert(ball.position.x >= ball.radius, `Ball inside left wall (${ball.position}) after update`);
    }
    assert(ball.velocity.y > 0);
    const BALL_MINIMUM_SPEED = 10; // Placeholder
    assert(ball.speed >= BALL_MINIMUM_SPEED);

    return [engine, worldObjects];
}

// TODO: Write tests for interactions with the control ball. 
// We want to make that if the control ball moves into the ball, then the ball is not stuck inside or something weird.
// Possible fixed. (1) Disable collision for a bit. (2) move control ball using velocity. 