const { World, Vec2, Box, Circle, Polygon, DistanceJoint, RevoluteJoint, Settings } = planck;

let world;
let renderer;
let anchor;
let escapeWheel;

function setupSimulation(params) {
    Settings.linearSlop = 0.0005;

    world = new World({
        gravity: Vec2(0.0, -9.81),
        allowSleep: false,
    });
    renderer = new Renderer(world, 'canvas');

    let fixed = world.createBody({
        type: 'static',
        position: Vec2(0.0, 0.0),
    });

    anchor = world.createBody({
        type: 'dynamic',
        position: Vec2(0.0, 0.0),
        bullet: true,
    });
    let bobMass = parseFloat(params.bobmass);
    let bobRadius = 0.1; // m
    let bobArea = Math.PI * bobRadius * bobRadius;
    let bobDensity = bobMass / bobArea;
    let pivotSeparation = 0.41;
    anchor.createFixture({
        shape: new Circle(Vec2(0.0, 0.41-parseFloat(params.rodlength)), bobRadius),
        density: bobDensity,
        filterMaskBits: 0, // bob does not collide
    });

    addAnchorFixtures(anchor, {
        friction: parseFloat(params.friction),
    });

    escapeWheel = world.createBody({
        type: 'dynamic',
        position: Vec2(0.0, 0.0),
        bullet: true,
    });
    addEscapeWheelFixtures(escapeWheel, {
        teeth: parseInt(params.teeth),
        minorDiameter: parseFloat(params.minordiameter),
        majorDiameter: parseFloat(params.majordiameter),
        leadingAngle: parseFloat(params.leadingangle),
        trailingAngle: parseFloat(params.trailingangle),
        density: 0.001,
        friction: parseFloat(params.friction),
    });

    let pivotPoint = Vec2(-0.01, 0.41);
    let pendulumJoint = world.createJoint(new RevoluteJoint({}, anchor, fixed, pivotPoint));
    let escapeWheelJoint = world.createJoint(new RevoluteJoint({
        maxMotorTorque: parseFloat(params.torque), // Nm?
        motorSpeed: -3, // rads/sec
        enableMotor: true,
    }, fixed, escapeWheel, escapeWheel.getPosition()));

    // XXX: why does this need to be so high?
    anchor.setAngularVelocity(60);
}

window.setInterval(function() {
    if (!world)
        return;
    let iters = 10;
    for (let i = 0; i < iters; i++)
        world.step(1/(60*iters));
}, 1000/60);
