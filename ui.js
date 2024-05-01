let defaultParams = {
    // Escape wheel
    teeth: "30",
    majordiameter: "0.55", // m
    minordiameter: "0.4", // m
    leadingangle: "5", // deg
    trailingangle: "8", // deg

    // Anchor

    // Pendulum
    bobmass: "1.0", // kg
    rodlength: "1.0", // m

    // Simulation
    torque: "0.1", // Nm
    friction: "0.1",
};
let params = defaultParams;

function apply() {
    params = {};
    for (let key in defaultParams) {
        if (!defaultParams.hasOwnProperty(key))
            continue;
        params[key] = val(key);
    }
    setupSimulation(params);
}

function reset() {
    params = defaultParams;
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

btn('apply', apply);
btn('reset', reset);

reset();
