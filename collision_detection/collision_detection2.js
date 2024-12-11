"use strict";
const MOUSE_LEFT_BUTTON = 0
const MOUSE_MIDDLE_BUTTON = 1
const MOUSE_RIGHT_BUTTON = 2

const drawSettings = {
    canvas: null,
    canvasContext: null,
    currentFrame: 0
};

class Entity {
    constructor({position, direction, speed, radius, color}) {
        this.position = position || new Vec2(0, 0);
        this.newPosition = this.position;
        this.direction = direction || new Vec2(0, 0);
        this.speed = speed || 30;
        this.radius = radius || 50;
        this.color = color || 'green';
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
    step(dt) {
        const movement = this.direction.scale(this.speed * dt/1000);
        const newX = (movement.x + this.position.x) % drawSettings.canvas.width;
        const newY = (movement.y + this.position.y) % drawSettings.canvas.height;
        this.position = new Vec2(newX, newY);

        // TODO: MOVE BOX
    }
    computeNewPosition(dt) {
        const movement = this.direction.scale(this.speed * dt/1000);
        const newX = (movement.x + this.position.x) % drawSettings.canvas.width;
        const newY = (movement.y + this.position.y) % drawSettings.canvas.height;
        this.newPosition = new Vec2(newX, newY);
    }
    copy() {
        const copy = new Entity({
            ...this
        });
        return copy;
    }

}

function naive_collision_detect(bodies) {
    const result = [];
    // For every pair. Check for overlap. 
    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];
        for (let j = i+1; j < bodies.length; j++) {
            const bodyB = bodies[j];

            // First we assume everything is just a circle
            const distance = bodyA.newPosition.subtract(bodyB.newPosition).length();
            if (distance < bodyA.radius + bodyB.radius) { // Collision
                result.push([i, j]);
            }

        }
    }
    return result;
}

function draw(bodies, collidingPairs) {
    for (let body of bodies) {
        body.color = 'green';
    }
    for (let [i, j] of collidingPairs) {
        const [bodyA, bodyB] = [bodies[i], bodies[j]];
        bodyA.color = 'red';
        bodyB.color = 'red';
    }

    const ctx = drawSettings.canvasContext;
    ctx.clearRect(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    for (const body of bodies) {
        body.draw(ctx);
    }
}

function initializeBodies() {
    const result = [
        new Entity(100, 200, 30),
        new Entity(300, 300, 30),
    ];

    result[0].velocity = new Vec2(10, 10);
    result[1].velocity = new Vec2(-30, 0);

    return result;
}

function calculateNewPositions(entities, deltaTime) {
    for (const entity of entities) {
        entity.newPosition = entity.velocity.scale(deltaTime/10).add(entity.position);
    }
}

function findCollisions(entities) {
    return naive_collision_detect(entities);
}

function updateEntityPositions(entities) {
    for (const entity of entities) {
        entity.position = entity.newPosition;
    }
}

function onbodyload() {
    drawSettings.canvas = document.getElementById("canvas");
    drawSettings.canvasContext = drawSettings.canvas.getContext("2d");

    // Prevent right click from opening context menu
    document.addEventListener("contextmenu", e => e.preventDefault());
    // document.addEventListener("keydown", keyDown);

    main();

    return;

    const entities = initializeBodies();
    draw(entities, []);
    const imageData = drawSettings.canvasContext.getImageData(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
    const frameTimePairs = [0, imageData];

    const timeStepMs = 1;
    let currentTime = 0;
    for (let i = 0; i < 100; i++) {

        calculateNewPositions(entities, timeStepMs);
        const collidingPairs = findCollisions(entities);
        if (collidingPairs.length > 0) {
            // Collision
            
            // TODO: Subdivide deltatime
        }
        updateEntityPositions(entities);
        draw(entities, collidingPairs);
        const imageData = drawSettings.canvasContext.getImageData(0, 0, drawSettings.canvas.width, drawSettings.canvas.height);
        currentTime += timeStepMs;
        frameTimePairs.push(currentTime);
        frameTimePairs.push(imageData);
    }

    drawSettings.canvasContext.putImageData(frameTimePairs[1], 0, 0);

    l(frameTimePairs)

    function keyDown(e) {
        let step = 0;
        switch(e.code) {
            case 'KeyA':
            case 'ArrowLeft': {
                step = -2;
            } break;
            case 'KeyD':
            case 'ArrowRight': {
                step = 2;
            } break;
        }

        if (step !== 0) {
            drawSettings.currentFrame = Math.min(frameTimePairs.length, Math.max(0, drawSettings.currentFrame + step));
            drawSettings.canvasContext.putImageData(frameTimePairs[drawSettings.currentFrame + 1], 0, 0);
            
            // TO LOG THIS INFORMATION I NEED TO KEEP TRACK OF ALL THE DIFFERENT POSITIONS
            const [a, b] = entities; 

            l(a.position)
        }
        
    }
}


function initializeUI() {

}

function main() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const state = {
        entities: [],
        snapshots: [],
        currentSnapShotIndex: 0,
        drawSnapshotIndex: null,
        playing: false,
        speedModifier: 1
    }




    document.addEventListener('keydown', e => {
        switch(e.code) {
            case 'KeyP': {
                state.playing = !state.playing;
            } break
            case 'KeyA':
            case 'ArrowLeft': {
                state.currentSnapShotIndex = Math.max(0, state.currentSnapShotIndex -1);
            } break;
            case 'KeyD':
            case 'ArrowRight': {
                state.currentSnapShotIndex = Math.min(state.snapshots.length-1, state.currentSnapShotIndex + 1);
            } break;
            case 'PageDown': {
                state.currentSnapShotIndex = Math.min(state.snapshots.length-1, state.currentSnapShotIndex + 10);
            } break;
            case 'PageUp': {
                state.currentSnapShotIndex = Math.max(0, state.currentSnapShotIndex -10);
            } break;
            case 'NumpadAdd': {
                state.speedModifier += 1
            } break;
            case 'NumpadSubtract': {
                state.speedModifier -= 1
            } break;
        }
    });

    const ui = new UI();
    const slider = new HorizontalSlider({
        position: {x: (1920 - 700)/2, y: 1000},
        size: {width: 700, height: 50},
        lineWidth: 3,
        initialSliderMarkerRatio: 0
    });
    slider.callbacks.push(value => {
        const index = Math.floor(lerp(0, state.snapshots.length-1, value));
        state.currentSnapShotIndex = index;
    })
    ui.add(slider);

    state.ui = ui;

    document.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener("mousemove", e => {
        if (ui.mouseMove(e)) e.stopImmediatePropagation();
    });
    canvas.addEventListener("mousedown", e => {
        if (ui.mouseDown(e)) e.stopImmediatePropagation();
    });
    canvas.addEventListener("mouseup", e => {
        if (ui.mouseUp(e)) e.stopImmediatePropagation();
    });


    const tests = [
        setup_collision_test_head_on_collision,
        setup_collision_test_same_direction
    ]

    // Setup tests keybind
    document.addEventListener('keydown', function(e) {
        if (!isNaN(parseInt(e.key))) {
            tests[e.key](state);
            simulate(state);
            state.currentSnapShotIndex = 0;
            state.drawSnapshotIndex = null;
        }
    });

    setup_collision_test_head_on_collision(state)
    simulate(state);

    drawSnapshot(state)
}

function simulate(state) {
    state.snapshots.clear();
    const seconds = 60;
    const stepsPerSec = 60
    const totalSteps = stepsPerSec * seconds;
    const dt = 1000 / stepsPerSec;

    for (let i = 0; i < totalSteps; i++) {
        const snapshot = {objects: []};
        for (const object of state.entities) {
            object.step(dt);
            snapshot.objects.push(object.copy());
        }
        state.snapshots.push(snapshot);
    }
}

function computeCollisions(entities) {
    const result = [];
    // For every pair. Check for overlap. 
    for (let i = 0; i < entities.length; i++) {
        const a = entities[i];
        for (let j = i+1; j < entities.length; j++) {
            const b = entities[j];

            // First we assume everything is just a circle
            const v = a.newPosition.subtract(b.newPosition); // Vector from b to a 
            const distance = v.length();
            if (distance < a.radius + b.radius) { // Collision
                // TODO: CALCULATE CONTACT POINT
                const contactPoint = b.position.add(v.scale(b.radius / v.length()));
                result.push([i, j, contactPoint]);
            }
        }
    }
    return result;
}

function updateEntityPositions(dt, entities) {


    let dtk = dt;

    // We try to step dt
    // If we have a collision, then we try to find the smallest dt' such that no collision (or only a small one) happens
    // Next we try to 
    
    let result = [];
    do {
        for (const entity of entities) {
            entity.computeNewPosition(dtk); 
        }

        result = computeCollisions(entities);
    } while (result.length > 0)


    return;

    // We only do collision of two things now. We try to handle more later
    for (let i = 0; i < result.length; i++) {
        const a = entities[result[i][0]];
        const b = entities[result[i][1]];
        const contactPoint = result[i][2];

        assert(a.direction.length() > 0 || b.direction.length() > 0, 'One of the entities have to move for there to be a collision');
        if (a.direction.length() === 0) {
            // HOW TO MOVE AROUND EACH OTHER
            // We want to push a bit if the other isn't an enemy / isn't on hold position
            b.newPosition = b.position; // NAIVE: NOBODY MOVES

        } else if (b.direction.length() === 0) {
            // HOW TO MOVE AROUND EACH OTHER
            // We want to push a bit if the other isn't an enemy / isn't on hold position
            a.newPosition = a.position; // NAIVE: NOBODY MOVES
        } else {
            const dot = a.direction.dot(b.direction);
            const rads = Math.acos(dot);
            const degrees = radiansToDegrees(rads);
            const distance = a.position.subtract(b.position).length();
            if (degrees < 90) {
                let debugMessage = 'Entities moving same direction';
                // WHICH IS IN FRONT? 

                // Which is in front is a bad way to look at it. They can be "in front" of each other.
                // i.e. when moving in a cross, they can block each other from moving forward. 
                // WHAT THE FUCK SHOULD BE DONE ABOUT THAT? HOW SHOULD I DETERMINE WHO MOVES HOW?

                const test = a.position.add(a.direction).subtract(b.position).length();
                if (test > distance) {
                    debugMessage += ' - Entity a is in front';
                    // TODO: This is a bit too simple because a bigger entity can have a position behind another, but still be "in front"

                    // TODO: Now we want to know how b should try to move past a
                    // step 1: How close to a can we get?
                    // step 2: which way should we move around a?

                    
                    // Compare angle to contact point
                    const other = contactPoint.subtract(b.position).normalize();

                    // THIS IS COOL, BUT WE STILL NEED TO RESPECT COLLISIONS. 
                        // If I walk into a wall at an angle, how can we understand the movement behavior?
                        // If the wall is parallel to me, then I walk at full speed parallel to it. 
                        // If the wall is orthogonal to me, then I can't move at all
                        // If the wall is at a 45 degree angle, then I slide against the wall, which means that 
                    // RIGHT NOW WE CAN PHASE THROUGH THE OTHER OBJECT
                    const determinant = b.direction.det(other);
                    let perpOther;
                    if (determinant > 0) {
                        debugMessage += ' - move left around';
                        perpOther = new Vec2(other.y, -other.x); // So we rotate 90 degrees  ??
                    } else {
                        debugMessage += ' - move right around';
                        perpOther = new Vec2(-other.y, other.x); // So we rotate 90 degrees  ??
                    }
                    const newVelocity = perpOther.scale(b.velocity.length());
                    b.newPosition = b.position.add(newVelocity);

                    a.newPosition = a.position; // NAIVE: Doesn't move
                    b.newPosition = b.position; // NAIVE: Doesn't move
                } else {
                    debugMessage += ' - Entity b is in front';

                    // COPY PASTE FROM ABOVE
                    const aToContact = contactPoint.subtract(a.position).normalize();

                    // THIS IS COOL, BUT WE STILL NEED TO RESPECT COLLISIONS. 
                    // RIGHT NOW WE CAN PHASE THROUGH THE OTHER OBJECT
                    const determinant = b.direction.det(aToContact);
                    let perpOther;
                    if (determinant > 0) {
                        debugMessage += ' - move left around';
                        perpOther = new Vec2(aToContact.y, -aToContact.x); // So we rotate 90 degrees  ??
                    } else {
                        debugMessage += ' - move right around';
                        perpOther = new Vec2(-aToContact.y, aToContact.x); // So we rotate 90 degrees  ??
                    }
                    const newVelocity = perpOther.scale(a.velocity.length());
                    a.newPosition = a.position.add(newVelocity);
                    
                    a.newPosition = a.position; // NAIVE: Doesn't move
                    b.newPosition = b.position; // NAIVE: Doesn't move
                }
                d(debugMessage)
            } else {
                // HOW TO MOVE AROUND EACH OTHER
                a.newPosition = a.position; // NAIVE: NOBODY MOVES
                b.newPosition = b.position; // NAIVE: NOBODY MOVES

                let debugMessage = 'Entities moving opposite direction';

                const aToContact = contactPoint.subtract(a.position).normalize();
                const determinantA = a.direction.det(aToContact);
                if (determinantA > 0) {
                    debugMessage += " - A moves left around";
                    const perpAToContact = new Vec2(aToContact.y, -aToContact.x); // So we rotate 90 degrees  ??
                    const newVelocityA = perpAToContact.scale(a.velocity.length());
                    a.newPosition = a.position.add(newVelocityA);
                } else {
                    debugMessage += " - A moves right around";
                    const perpAToContact = new Vec2(-aToContact.y, aToContact.x); // So we rotate 90 degrees  ??
                    const newVelocityA = perpAToContact.scale(a.velocity.length());
                    a.newPosition = a.position.add(newVelocityA);
                }

                const bToContact = contactPoint.subtract(b.position).normalize();
                const determinantB = b.direction.det(bToContact);
                if (determinantB > 0) {
                    debugMessage += " - B moves left around";
                    const perpBToContact = new Vec2(bToContact.y, -bToContact.x); // So we rotate 90 degrees  ??
                    const newVelocityB = perpBToContact.scale(a.velocity.length());
                    b.newPosition = b.position.add(newVelocityB);
                } else {
                    debugMessage += " - B moves right around";
                    const perpBToContact = new Vec2(-bToContact.y, bToContact.x); // So we rotate 90 degrees  ??
                    const newVelocityB = perpBToContact.scale(b.velocity.length());
                    b.newPosition = b.position.add(newVelocityB);
                }

                d(debugMessage)
            }
        }


        

        // HOW TO FIGURE OUT WHETHER THEY ARE MOVING IN SIMILAR DIRECTION AND WHICH IS IN FRONT OF THE OTHER?

        // TODO: Calculate the directions in terms of degrees angle to [1, 0] vector.
        // Split into 4 general cases, NW, NE, SW, SE
        // Consider which xy-quadrant the entities are in (Maybe it is easier if 0,0 is bottom left (or top left) such that we are always in the same quadrant)  
        // Determine which is in front of the other by calculating their length
        // 

        // TODO: Draw different scenarios 


        // b.newPosition.subtract(a.position).length()

        // If direction are the same, and a is further back than b, then move a as much as possible until it hits b
        // If directions are opposite, then met in the middle and slide a bit against each other
        // If one is stationary, then push a bit (depend on unit size and mass? Should a zergling be able to push a ultralisk?)

        
    }

    gameState.collisions = result;

    for (const entity of entities) {
        entity.position = entity.newPosition;
    }


    // 1. Update positions based on velocity (This needs to check for )
    // 2. Detect collision
    // 3. Handle collision: When a collision is found, between two entities, check the velocity of
    // the two entities and move them away from each other in a way which makes
    // sense according to their velocity. (e.g. if moving against each other, we
    // can move them a little back, and maybe to the side such that they pass
    // each other. If moving the same direction, move the on behind a little
    // back, as if it is blocked.)
    // 4. Go to step 2
}



function drawSnapshot(state) {
    const objects = state.snapshots[state.currentSnapShotIndex].objects;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    if (state.currentSnapShotIndex !== state.drawSnapshotIndex) {
        state.drawSnapshotIndex = state.currentSnapShotIndex;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const object of objects) {
            object.draw(ctx);
        }
    }

    if (state.playing) {
        state.currentSnapShotIndex = clamp(state.currentSnapShotIndex + state.speedModifier, 0, state.snapshots.length-1);
    }

    state.ui.draw(ctx);

    return requestAnimationFrame(dt => drawSnapshot(state));
}

function setup_collision_test_head_on_collision(state) {
    state.entities.clear();

    const rightMovingEntity = new Entity({
        position: new Vec2(300, 300),
        speed: 30,
        direction: new Vec2(1, 0)
    });

    const leftMovingEntity = new Entity({
        position: new Vec2(500, 300),
        speed: 20,
        direction: new Vec2(-1, 0),
        radius: 60
    });
    state.entities.push(
        rightMovingEntity,
        leftMovingEntity
    );
}

function setup_collision_test_same_direction(state) {
    state.entities.clear();

    const rightMovingEntity = new Entity({
        position: new Vec2(300, 300),
        speed: 30,
        direction: new Vec2(1, 0)
    });

    const leftMovingEntity = new Entity({
        position: new Vec2(500, 300),
        speed: 10,
        direction: new Vec2(1, 0),
        radius: 30
    });
    state.entities.push(
        rightMovingEntity,
        leftMovingEntity
    );
}



// All tests should check if the there is any overlap after some movement.
function run_tests() {
    const tests = [];
    for (let i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            console.log(tests[i].name + " success");
        } catch (e) {
            console.log(e);
        }
    }
}