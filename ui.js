let defaultParams = {
    // Escape wheel
    teeth: "30",
    majordiameter: "55", // mm
    minordiameter: "40", // mm
    leadingangle: "5", // deg
    trailingangle: "8", // deg

    // Anchor
    toothspan: "12.5",
    lift: "0.25", // deg of anchor
    drop: "2", // deg of escape wheel
    locksafety: "0.25", // deg of anchor

    // Pendulum
    bobmass: "1.0", // kg
    bobdiameter: "100", // mm
    rodlength: "990", // mm

    // Simulation
    torque: "0.001", // Nm
    friction: "0.1",
    maxescapewheelangvel: "720", // deg/sec
    initialkick: "0.5", // deg
};
let params = defaultParams;

function apply() {
    params = {};
    for (let key in defaultParams) {
        if (!defaultParams.hasOwnProperty(key))
            continue;
        params[key] = parseFloat(val(key));
    }
    setupSimulation(params);
}

function reset() {
    params = {};
    for (let key in defaultParams) {
        params[key] = parseFloat(defaultParams[key]);
    }
    updateForm();
    setupSimulation(params);
}

function updateForm() {
    for (let key in params) {
        if (!params.hasOwnProperty(key))
            continue;
        val(key, params[key]);
    }
}

let scopes = [];
function addScope() {
    scopes.push(new Scope(elem('scopes')));
}

btn('apply', apply);
btn('reset', reset);
btn('addscope', addScope);

addScope();

reset();
