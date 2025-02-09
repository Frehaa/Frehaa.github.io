
class CombatEntity {
    constructor(position) {
        this.position = position

        this.elapsedTimeMs = 0;
        this.attackTimeMs = 1000;
        this.attackTarget = null;
    }

    // if we set the attack target between frames then we speed up an attack with the difference. 
    setAttackTarget(target) {
        this.attackTarget = target;
        this.elapsedTimeMs = 0;
    }

    draw(ctx) {
        const width = 10;
        const height = 10;
        ctx.fillRect(this.position.x - width/2, this.position.y - height/2, width, height);
    }

    attack() {
        console.log('Attack');
    }

    // We are assuming deltaTimeMs <= this.attackTimeMs
    update(deltaTimeMs) {
        if (this.attackTarget === null) { return; }
        this.elapsedTimeMs += deltaTimeMs;

        if (this.elapsedTimeMs > this.attackTimeMs) {
            this.attack()
            this.elapsedTimeMs = this.elapsedTimeMs % this.attackTimeMs;
        }
        // If we move, we interrupt. If the target is out of range, we interrupt.
    }
}

function combatTesting() {
    const entities = [
        new CombatEntity(new Vec2(100, 100)),
        new CombatEntity(new Vec2(200, 100)),
    ];
    entities[0].setAttackTarget(entities[1]);

    let lastTime = 0
    function update(time) {
        const dt = time - lastTime;
        lastTime = time;

        for (const entity of entities) {
            entity.update(dt); 
        }

        requestAnimationFrame(update)
    }

    requestAnimationFrame(time => {
        lastTime = time;
        update(lastTime)
    })

}

// So we have some different objectives for entities in a game. 
// 1. They should be able to move around. For this we want to properly implement acceleration, velocity, and position. (Move action, patrol action)
// 2. They should colide with things. For this we want to implement collision detection and collision response
// 3. They should be able to do other things than move around (auto attack, skills, )
// 4. They should respond to things happening to them (Getting hit by an attack, standing in an spell effect, ...)
// 5. 



// The goal of this session is to implement som auto attack system with
// Range (max)
// Damage 
// Speed



// Things to extend with is
// Min range (Cannot attack close)
// More non-trivial damage calculation (e.g. Armor)
// projectile with flight time and possibility of avoiding (e.g. like blink)
// Knockback? 
// On-hit effects
// etc. ???
// Delay vs wait (We may initialy attack after only 100ms, but time between attacks is 1000ms)
// Range buffer (Even if we start firing at max range, the target can move a bit away without being out of range)