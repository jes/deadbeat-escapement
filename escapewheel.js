/* params:
 *  - teeth: number of teeth
 *  - majorDiameter: major diameter in metres
 *  - minorDiameter: minor diameter in metres
 *  - leadingAngle: leading edge angle, back from radial, in degrees
 *  - trailingAngle: trailing edge angle, back from radial, in degrees
 *  - density: passed through to each fixture
 *  - friction: passed through to each fixture
 */
function addEscapeWheelFixtures(body, params) {
    body.createFixture({
        shape: new Circle(params.minorDiameter/2),
        density: params.density,
        friction: params.friction,
    });

    let angleStep = 360 / params.teeth;
    for (let i = 0; i < params.teeth; i++) {
        body.createFixture({
            shape: generateTooth(i*angleStep*Math.PI/180, params),
            density: params.density,
            friction: params.density,
        });
    }
}

function generateTooth(rootAngle, params) {
    const rootX = params.minorDiameter / 2 * Math.cos(rootAngle);
    const rootY = params.minorDiameter / 2 * Math.sin(rootAngle);
    const tipAngle = rootAngle - params.leadingAngle * Math.PI / 180;
    const tipX = params.majorDiameter / 2 * Math.cos(tipAngle);
    const tipY = params.majorDiameter / 2 * Math.sin(tipAngle);
    const trailingAngleRadians = params.trailingAngle * Math.PI / 180;
    const trailingX = params.minorDiameter / 2 * Math.cos(rootAngle + trailingAngleRadians);
    const trailingY = params.minorDiameter / 2 * Math.sin(rootAngle + trailingAngleRadians);
    return new Polygon([
        Vec2(rootX, rootY),
        Vec2(tipX, tipY),
        Vec2(trailingX, trailingY),
    ]);
}
