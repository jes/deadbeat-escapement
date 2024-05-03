/* params:
 *  - teeth: number of teeth
 *  - majordiameter: major diameter in metres
 *  - minordiameter: minor diameter in metres
 *  - leadingangle: leading edge angle, back from radial, in degrees
 *  - trailingangle: trailing edge angle, back from radial, in degrees
 *  - friction: passed through to each fixture
 */
function addEscapeWheelFixtures(body, params) {
    body.createFixture({
        shape: new Circle(params.minordiameter/2),
        density: 0.001,
        friction: params.friction,
    });

    let angleStep = 360 / params.teeth;
    for (let i = 0; i < params.teeth; i++) {
        body.createFixture({
            shape: generateTooth(i*angleStep*Math.PI/180, params),
            density: 0.001,
            friction: params.friction,
        });
    }
}

function generateTooth(rootAngle, params) {
    const rootX = params.minordiameter / 2 * Math.cos(rootAngle);
    const rootY = params.minordiameter / 2 * Math.sin(rootAngle);
    const tipAngle = rootAngle - params.leadingangle * Math.PI / 180;
    const tipX = params.majordiameter / 2 * Math.cos(tipAngle);
    const tipY = params.majordiameter / 2 * Math.sin(tipAngle);
    const trailingAngleRadians = params.trailingangle * Math.PI / 180;
    const trailingX = params.minordiameter / 2 * Math.cos(rootAngle + trailingAngleRadians);
    const trailingY = params.minordiameter / 2 * Math.sin(rootAngle + trailingAngleRadians);
    return new Polygon([
        Vec2(rootX, rootY),
        Vec2(tipX, tipY),
        Vec2(trailingX, trailingY),
    ]);
}
