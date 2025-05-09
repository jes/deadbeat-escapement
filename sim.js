const { World, Vec2, Box, Circle, Polygon, DistanceJoint, RevoluteJoint, Settings } = planck;

let world;
let renderer;
let anchor;
let escapeWheel;
let pivotSeparation;
let rodLength;
let bobMass;
let bobRadius;
let qfactor;

let anchorAngleIntegral = 0;
let torqueIntegral = 0;

function setupSimulation(v) {
    Settings.linearSlop = v.majordiameter * 10e-8;

    qfactor = v.qfactor;

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

    pivotSeparation = aY + bY; // m

    let escapeWheelRotationDuringImpulse = (180/v.teeth - v.drop) * Math.PI/180; // radians
    
    // Calculate the tangent angles to the escape wheel at the sector points
    let tangentSectorAngle = Math.PI/2 - theta;
    
    // Calculate the impulse face angles from the tangent
    let impulseFaceAngleEntryStart = tangentSectorAngle - (v.lift/2 + v.locksafety) * Math.PI/180;
    let impulseFaceAngleEntryEnd = tangentSectorAngle + (v.lift/2 - v.locksafety) * Math.PI/180;
    
    let impulseFaceAngleExitStart = tangentSectorAngle - (v.lift/2 + v.locksafety) * Math.PI/180;
    let impulseFaceAngleExitEnd = tangentSectorAngle + (v.lift/2 - v.locksafety) * Math.PI/180;

    // point c is the leading corner of the entry pallet (end of impulse)
    let bottomLineAngleFromVertical = theta + escapeWheelRotationDuringImpulse / 2; // radians
    let topLineAngleFromVertical = impulseFaceAngleEntryEnd; 
    let c = intersection(bottomLineAngleFromVertical, topLineAngleFromVertical, pivotSeparation);

    // point d is the trailing corner of the entry pallet (start of impulse)
    bottomLineAngleFromVertical = theta - escapeWheelRotationDuringImpulse / 2;
    topLineAngleFromVertical = impulseFaceAngleEntryStart;
    let d = intersection(bottomLineAngleFromVertical, topLineAngleFromVertical, pivotSeparation);

    // point e is the leading corner of the exit pallet (end of impulse)
    bottomLineAngleFromVertical = theta - escapeWheelRotationDuringImpulse / 2;
    topLineAngleFromVertical = impulseFaceAngleExitEnd;
    let e = intersection(bottomLineAngleFromVertical, topLineAngleFromVertical, pivotSeparation);

    // point f is the trailing corner of the exit pallet (start of impulse)
    bottomLineAngleFromVertical = theta + escapeWheelRotationDuringImpulse/2;
    topLineAngleFromVertical = impulseFaceAngleExitStart;
    let f = intersection(bottomLineAngleFromVertical, topLineAngleFromVertical, pivotSeparation);

    let restingSurfaceLength = v.restingsurfacelength; // deg - incorrect except where restingsurfaceangleoffset is 0

    // point g is the end of the resting surface on the entry pallet
    let entryCornerDistance = Vec2.distance(c, Vec2(0, pivotSeparation));
    let l = 2 * Math.sin(restingSurfaceLength*Math.PI/360) * entryCornerDistance;
    let theta4 = Math.atan2(c.x, c.y-pivotSeparation);
    let dX = l * Math.cos(theta4-v.restingsurfaceangleoffset*Math.PI/180);
    let dY = l * Math.sin(theta4-v.restingsurfaceangleoffset*Math.PI/180);
    let gX = c.x - dX;
    let gY = c.y + dY;

    // point h is the end of the resting surface on the exit pallet
    entryCornerDistance = Vec2.distance(e, Vec2(0, pivotSeparation));
    l = 2 * Math.sin(restingSurfaceLength*Math.PI/360) * entryCornerDistance;
    theta4 = Math.atan2(e.x, e.y-pivotSeparation);
    dX = l * Math.cos(theta4+v.restingsurfaceangleoffset*Math.PI/180);
    dY = l * Math.sin(theta4+v.restingsurfaceangleoffset*Math.PI/180);
    let hX = e.x - dX;
    let hY = e.y + dY;

    let entryPallet = new Polygon([
        Vec2(-gX, gY),
        Vec2(-c.x, c.y),
        Vec2(-d.x, d.y),
    ]);
    let exitPallet = new Polygon([
        Vec2(hX, hY),
        Vec2(e.x, e.y),
        Vec2(f.x, f.y),
    ]);

    let extra = {
        pivotseparation: pivotSeparation,
        entryPallet: entryPallet,
        exitPallet: exitPallet,
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

    anchorAngleIntegral = 0;
    torqueIntegral = 0;

    // Make extra data available for export
    if (typeof updateExtraData === 'function') {
        updateExtraData(extra);
    }
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

    // Calculate damping torque from Q factor
    // Q factor is the ratio of energy stored to energy dissipated per radian
    // For a pendulum with moment of inertia I, the damping coefficient c relates to Q as:
    // Q = I * ω₀ / c, where ω₀ is the natural frequency
    let naturalFrequency = Math.sqrt(Math.abs(world.m_gravity.y) / rodLength); // ω₀ = √(g/L)
    let dampingCoefficient = pendulumMomentOfInertia * naturalFrequency / qfactor;
    let dampingTorque = -dampingCoefficient * anchorAngularVelocity;
    totalAnchorTorque -= dampingTorque;
    
    // Apply the damping torque to the anchor
    anchor.applyTorque(dampingTorque, true);
    
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
        torqueIntegral += anchorTorque * (1/(60*superiters));
        for (let scope of scopes) {
            scope.update(1/(60*superiters));
        }
    }
    for (let scope of scopes) {
        scope.draw();
    }
}, 1000/60);
