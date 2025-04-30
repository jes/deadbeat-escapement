let defaultParams = {
    // Escape wheel
    teeth: "30",
    majordiameter: "55", // mm
    minordiameter: "40", // mm
    leadingangle: "5", // deg
    trailingangle: "8", // deg

    // Anchor
    toothspan: "12.5",
    lift: "1.0", // deg of anchor
    drop: "2.0", // deg of escape wheel
    locksafety: "0.25", // deg of anchor

    // Pendulum
    bobmass: "1.0", // kg
    rodlength: "990", // mm

    // Simulation
    torque: "0.001", // Nm
    friction: "0.1",
    maxescapewheelangvel: "720", // deg/sec
    initialkick: "1", // deg
    noescapement: false,
};
let params = defaultParams;

// Helper function to process parameter values based on their type
function processParam(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    return parseFloat(value);
}

// Common function to update parameters and setup simulation
function updateParams(sourceParams) {
    params = {};
    for (let key in defaultParams) {
        params[key] = processParam(sourceParams[key]);
    }
    setupSimulation(params);
}

function apply() {
    const formValues = {};
    for (let key in defaultParams) {
        formValues[key] = val(key);
    }
    updateParams(formValues);
}

function reset() {
    updateParams(defaultParams);
    updateForm();
}

function updateForm() {
    for (let key in params) {
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
