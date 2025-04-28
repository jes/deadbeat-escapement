const { World, Vec2, Box, Circle, Polygon, DistanceJoint, RevoluteJoint, Settings } = planck;

let world;
let renderer;
let anchor;
let escapeWheel;
let pivotSeparation;
let rodLength;
let bobMass;
let bobRadius;

function setupSimulation(v) {
    Settings.linearSlop = v.majordiameter * 10e-7;

    world = new World({
        gravity: Vec2(0.0, -9.81),
        allowSleep: false,
    });
    renderer = new Renderer(world, 'canvas');
    renderer.viewHeight = v.majordiameter/1000 * 2;

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

    pivotSeparation = aY + bY; // mm

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
    bobRadius = v.rodlength / 20000; // m
    let bobArea = Math.PI * bobRadius * bobRadius;
    bobMass = v.bobmass;
    let bobDensity = bobMass / bobArea;
    rodLength = v.rodlength / 1000;
    anchor.createFixture({
        shape: new Circle(Vec2(0.0, pivotSeparation-rodLength), bobRadius),
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
        motorSpeed: -v.maxescapewheelangvel*Math.PI/180, // rads/sec
        enableMotor: true,
    }, fixed, escapeWheel, escapeWheel.getPosition()));

    // start off by kicking the pendulum 10 degrees
    anchor.setAngle(v.initialkick*Math.PI/180);
}

let lastAnchorAngle = 0;
let lastAnchorAngularVelocity = 0;
let lastEscapeWheelAngularVelocity = 0;
let lastZeroCrossTimestamp = 0;
let escapeWheelAngularAcceleration = 0;
let anchorAngularAcceleration = 0;
let anchorMinAngle = 0;
let anchorMaxAngle = 0;
let anchorTorque = 0;
let totalAnchorTorque = 0;
let gravityAnchorTorque = 0;
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
    anchorAngularAcceleration = (anchorAngularVelocity - lastAnchorAngularVelocity) / dt;
    if (lastAnchorAngularVelocity < 0 && anchorAngularVelocity > 0) {
        anchorMinAngle = anchorAngle;
    } else if (lastAnchorAngularVelocity >0 && anchorAngularVelocity < 0) {
        anchorMaxAngle = anchorAngle;
    }
    lastAnchorAngularVelocity = anchorAngularVelocity;
    amplitude = (anchorMaxAngle - anchorMinAngle) * 180/Math.PI;

    let escapeWheelAngularVelocity = escapeWheel.getAngularVelocity();
    escapeWheelAngularAcceleration = (escapeWheelAngularVelocity - lastEscapeWheelAngularVelocity) / dt;
    lastEscapeWheelAngularVelocity = escapeWheelAngularVelocity;

    // Calculate total torque from angular acceleration
    let pendulumMomentOfInertia = bobMass * rodLength * rodLength + (1/2) * bobMass * bobRadius * bobRadius;
    totalAnchorTorque = anchorAngularAcceleration * pendulumMomentOfInertia;
    
    // Calculate gravitational torque using the angle
    gravityAnchorTorque = bobMass * world.m_gravity.y * rodLength * Math.sin(anchorAngle);
    
    world.step(dt);

    txt('period', sigfigs(period, 8));
    txt('freq', sigfigs(1/period, 8));
    txt('amplitude', sigfigs(amplitude, 4));
    txt('asymmetry', sigfigs((anchorMaxAngle+anchorMinAngle)*180/Math.PI, 3));
}

window.setInterval(function() {
    if (!world)
        return;
    let superiters = 5;
    let iters = 20;
    for (let i = 0; i < superiters; i++) {
        let anchorTorqueValues = []; // Array to collect torque values
        for (let i = 0; i < iters; i++) {
            step(1/(60*iters*superiters));
            // Store the calculated torque difference instead of summing
            anchorTorqueValues.push(totalAnchorTorque - gravityAnchorTorque);
        }
        // Sort the array and take the median
        anchorTorqueValues.sort((a, b) => a - b);
        let middle = Math.floor(anchorTorqueValues.length / 2);
        if (anchorTorqueValues.length % 2 === 0) {
            // Even length - average the two middle values
            anchorTorque = (anchorTorqueValues[middle - 1] + anchorTorqueValues[middle]) / 2;
        } else {
            // Odd length - take the middle value
            anchorTorque = anchorTorqueValues[middle];
        }
        for (let scope of scopes) {
            scope.update(1/(60*superiters));
        }
    }
    for (let scope of scopes) {
        scope.draw();
    }
}, 1000/60);
