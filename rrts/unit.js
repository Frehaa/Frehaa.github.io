
class Unit {
    UNIT_STATE = Object.freeze({
        IDLE: 0,
        MOVE: 1,
        ATTACK_WAIT: 2,
        ATTACKING: 3,
        ATTACK_MOVE: 4
    });

    constructor() {
        this.position = new Vec2(0, 0);
        this.radius = 30;
        this.velocity = new Vec2(0, 0);
        this.maxSpeedPerMs = 0.3;
    }

    update(deltaTimeMs) {
        this.newPosition = this.position.add(this.velocity.scale(deltaTimeMs * this.maxSpeedPerMs));
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgb(14, 20, 196)'
        ctx.fillStyle = 'rgba(14, 20, 197)';
        ctx.stroke();
        ctx.fill();
    }
}

function collisionTesting() {   
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const units = [
        new Unit(),
        new Unit(),
    ]

    document.addEventListener('keydown', e => {
        switch (e.key) {
            case "ArrowLeft": {
                units[0].position = units[0].position.add(new Vec2(-20, 0));
            } break;
            case "ArrowRight": {
                units[0].position = units[0].position.add(new Vec2(20, 0));
            } break;
        }
    })

    units[0].position = new Vec2(200, 205);
    units[1].position = new Vec2(300, 200);

    let lastTime = 0;
    function stepSimulation(time) {
        const deltaTimeMs = time - lastTime;

        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        update(units, deltaTimeMs);

        for (const unit of units) {
            unit.draw(ctx); 
        }



        lastTime = time;
        requestAnimationFrame(stepSimulation);
    }
    requestAnimationFrame(time => {
        lastTime = time;
        stepSimulation(time);
    })
}


function update(units, dt) {
    for (const unit of units) {
        unit.update(dt); 
    }

    let collisions = findCollisions(units);
    let i = 0; // Debug variable to avoid infinite loops.
    // Simple collision handling. We just move things away from each other.
    while(collisions.length > 0) { // Risk of 
        l("Collsion!", collisions);


        const epsilon = 0.1;
        for (const collision of collisions) {
            const a = units[collision[0]]; 
            const b = units[collision[1]]; 
           
            const aToB = b.newPosition.subtract(a.newPosition);
            
            const distance = aToB.length();
            const desiredDistance = a.radius + b.radius;
            assert(distance < desiredDistance, "There was a collision even though distance was fine.");

            l("Distance:", distance, desiredDistance)

            const distanceToAdd = (desiredDistance - distance) / 2 + epsilon;

            const direction = aToB.normalize();
            b.newPosition = b.newPosition.add(direction.scale(distanceToAdd));
            a.newPosition = a.newPosition.add(direction.scale(-distanceToAdd));
        }



        collisions = findCollisions(units);
        // Debugging
        i += 1
        if (i > 30) {
            console.warn(`Failed to fix collisions in ${i} iterations.`)
        }
    }

    for (const unit of units) {
       unit.position = unit.newPosition;
    }

}

function findCollisions(units) {
    const result = [];
    // For every pair. Check for overlap. 
    for (let i = 0; i < units.length; i++) {
        const a = units[i];
        for (let j = i+1; j < units.length; j++) {
            const b = units[j];

            // First we assume everything is just a circle
            const v = a.newPosition.subtract(b.newPosition); // Vector from b to a 
            const distance = v.length();
            if (distance < a.radius + b.radius) { // Collision
                const contactPoint = b.position.add(v.scale(b.radius / v.length()));
                result.push([i, j, contactPoint]);
            }
        }
    }
    return result;
}

    