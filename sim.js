const { World, Vec2, Box, Circle, Polygon, DistanceJoint, RevoluteJoint, Settings } = planck;

let world;
let renderer;
let anchor;
let escapeWheel;

function setupSimulation(v) {
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

    let sectorAngle = Math.PI * 2 * v.toothspan / v.teeth; // radians
    let theta = sectorAngle / 2; // radians
    let r = v.majordiameter / 2; // mm

    let aX = -r * Math.sin(theta); // mm
    let aY = r * Math.cos(theta); // mm
    let bX = 0; // mm
    let bY = -aX * Math.tan(theta); // mm

    let pivotSeparation = aY + bY; // mm

    // upper line of entry pallet
    let topLineAngleFromVertical = (Math.PI/2 - theta) + ((v.lift/2-v.locksafety)*Math.PI/180); // radians
    let escapeWheelRotationDuringImpulse = (180/v.teeth - v.drop) * Math.PI/180; // radians
    let bottomLineAngleFromVertical = theta + escapeWheelRotationDuringImpulse / 2; // radians

    let a1 = bottomLineAngleFromVertical;
    let a2 = topLineAngleFromVertical;
    // find h where h*tan(a2)=(p-h)*tan(a1)...
    // h = (p*tan(a1))/(tan(a1)+tan(a2));
    let h = (pivotSeparation*Math.tan(a1)) / (Math.tan(a1)+Math.tan(a2)); // mm
    let c = intersection(bottomLineAngleFromVertical, topLineAngleFromVertical, pivotSeparation);

    bottomLineAngleFromVertical = theta - escapeWheelRotationDuringImpulse / 2;
    topLineAngleFromVertical = Math.PI/2 - theta - ((v.lift/2+v.locksafety)*Math.PI/180);
    let d = intersection(bottomLineAngleFromVertical, topLineAngleFromVertical, pivotSeparation);

    let blaf = theta - escapeWheelRotationDuringImpulse/2;
    let tlaf = (Math.PI/2 - theta) + ((v.lift/2-v.locksafety)*Math.PI/180);
    let e = intersection(blaf, tlaf, pivotSeparation);

    blaf = theta + escapeWheelRotationDuringImpulse/2;
    tlaf = (Math.PI/2 - theta) - ((v.lift/2+v.locksafety)*Math.PI/180);
    let f = intersection(blaf, tlaf, pivotSeparation);


    let extra = {
        pivotseparation: pivotSeparation,
        cx: -c.x,
        cy: c.y,
        dx: -d.x,
        dy: d.y,

        ex: e.x,
        ey: e.y,
        fx: f.x,
        fy: f.y,
    };
    console.log(extra);

    anchor = world.createBody({
        type: 'dynamic',
        position: Vec2(0.0, 0.0),
        bullet: true,
    });
    let bobRadius = 0.1; // m
    let bobArea = Math.PI * bobRadius * bobRadius;
    let bobDensity = v.bobmass / bobArea;
    anchor.createFixture({
        shape: new Circle(Vec2(0.0, pivotSeparation-v.rodlength), bobRadius),
        density: bobDensity,
        filterMaskBits: 0, // bob does not collide
    });

    addAnchorFixtures(anchor, v, extra);

    escapeWheel = world.createBody({
        type: 'dynamic',
        position: Vec2(0.0, 0.0),
        bullet: true,
    });
    addEscapeWheelFixtures(escapeWheel, v);

    let pivotPoint = Vec2(-0.01, pivotSeparation);
    let pendulumJoint = world.createJoint(new RevoluteJoint({}, anchor, fixed, pivotPoint));
    let escapeWheelJoint = world.createJoint(new RevoluteJoint({
        maxMotorTorque: v.torque, // Nm?
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
