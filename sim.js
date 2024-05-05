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
    let r = v.majordiameter / 2000; // m

    let aX = -r * Math.sin(theta); // m
    let aY = r * Math.cos(theta); // m
    let bX = 0; // m
    let bY = -aX * Math.tan(theta); // m

    // TODO: this doesn't implement anchorpivotoffset properly, it should
    // keep the impulse faces unchanged, and in the same place, but
    // move the pivot upwards, and adjust the locking faces to suit
    let pivotSeparation = aY + bY + v.anchorpivotoffset/1000.0; // mm

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

    let lockingAngle = 7; // deg

    let entryCornerDistance = Vec2.distance(c, Vec2(0, pivotSeparation));
    tlaf = (Math.PI/2 - theta) + ((v.lift/2-v.locksafety+lockingAngle)*Math.PI/180); // radians
    let gX = entryCornerDistance * Math.sin(tlaf);
    let gY = pivotSeparation - entryCornerDistance * Math.cos(tlaf);

    let ecd = Vec2.distance(e, Vec2(0, pivotSeparation));
    tlaf = (Math.PI/2 - theta) + ((v.lift/2-v.locksafety+lockingAngle)*Math.PI/180);
    let hX = ecd * Math.sin(tlaf);
    let hY = pivotSeparation - ecd * Math.cos(tlaf);

    let extra = {
        pivotseparation: pivotSeparation,
        cx: -c.x,
        cy: c.y,
        dx: -d.x,
        dy: d.y,
        gx: -gX,
        gy: gY,

        ex: e.x,
        ey: e.y,
        fx: f.x,
        fy: f.y,
        hx: hX,
        hy: hY,
    };

    anchor = world.createBody({
        type: 'dynamic',
        position: Vec2(0.0, 0.0),
        bullet: true,
    });
    let bobRadius = v.bobdiameter / 2000; // m
    let bobArea = Math.PI * bobRadius * bobRadius;
    let bobDensity = v.bobmass / bobArea;
    anchor.createFixture({
        shape: new Circle(Vec2(0.0, pivotSeparation-v.rodlength/1000), bobRadius),
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

    let pivotPoint = Vec2(0.0, pivotSeparation);
    let pendulumJoint = world.createJoint(new RevoluteJoint({}, anchor, fixed, pivotPoint));
    let escapeWheelJoint = world.createJoint(new RevoluteJoint({
        maxMotorTorque: v.torque, // Nm?
        motorSpeed: -3, // rads/sec
        enableMotor: true,
    }, fixed, escapeWheel, escapeWheel.getPosition()));

    // start off by kicking the pendulum 10 degrees
    anchor.setAngle(10*Math.PI/180);
}

let lastAnchorAngle = 0;
let lastAnchorAngularVelocity = 0;
let lastZeroCrossTimestamp = 0;
let anchorMinAngle = 0;
let anchorMaxAngle = 0;
let anchorTorque = 0;
let anchorAngleIntegral = 0;

let ts = 0;
let period = 0;
let amplitude = 0;

function step(dt) {
    if (!world)
        return;

    ts += dt;

    let anchorAngle = anchor.getAngle();
    if (lastAnchorAngle < 0 && anchorAngle > 0) {
        period = ts - lastZeroCrossTimestamp;
        let travelled = anchorAngle - lastAnchorAngle;
        let k = -lastAnchorAngle / travelled; // how far through this timestep did the anchor cross 0 degrees?
        lastZeroCrossTimestamp = (ts-dt)+k*dt;
    }
    lastAnchorAngle = anchorAngle;
    anchorAngleIntegral += anchorAngle * 180/Math.PI * dt;

    let anchorAngularVelocity = anchor.getAngularVelocity();
    if (lastAnchorAngularVelocity < 0 && anchorAngularVelocity > 0) {
        anchorMinAngle = anchorAngle;
    } else if (lastAnchorAngularVelocity >0 && anchorAngularVelocity < 0) {
        anchorMaxAngle = anchorAngle;
    }
    lastAnchorAngularVelocity = anchorAngularVelocity;
    amplitude = (anchorMaxAngle - anchorMinAngle) * 180/Math.PI;

    world.step(dt);

    txt('period', sigfigs(period, 8));
    txt('freq', sigfigs(1/period, 8));
    txt('amplitude', sigfigs(amplitude, 4));
    txt('asymmetry', sigfigs((anchorMaxAngle+anchorMinAngle)*180/Math.PI, 3));
}

window.setInterval(function() {
    if (!world)
        return;
    let iters = 50;
    for (let i = 0; i < iters; i++) {
        step(1/(60*iters));
    }
    for (let scope of scopes) {
        scope.update(1/60);
        scope.draw();
    }
}, 1000/60);
