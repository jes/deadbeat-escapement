/* params:
 *  TODO
 */
function addAnchorFixtures(body, params) {
    // entry pallet arm
    body.createFixture({
        shape: new Polygon([
            Vec2(0.0, 0.0),
            Vec2(-0.2, -0.12),
            Vec2(-0.18, -0.12),
            Vec2(0.0, -0.02),
        ]),
        density: 1.0,
        friction: 0.3,
    });

    // entry pallet
    body.createFixture({
        shape: new Polygon([
            Vec2(-0.2, -0.12),
            Vec2(-0.14, -0.18),
            Vec2(-0.12, -0.17),
            Vec2(-0.18, -0.12),
        ]),
        density: 1.0,
        friction: 0.3,
    });

    // exit pallet arm
    body.createFixture({
        shape: new Polygon([
            Vec2(0.0, 0.0),
            Vec2(0.0, -0.02),
            Vec2(0.2, -0.06),
            Vec2(0.22, -0.06),
        ]),
        density: 1.0,
        friction: 0.3,
    });

    // exit pallet
    body.createFixture({
        shape: new Polygon([
            Vec2(0.2, -0.06),
            Vec2(0.14, -0.14),
            Vec2(0.16, -0.17),
            Vec2(0.22, -0.06),
        ]),
        density: 1.0,
        friction: 0.3,
    });
}
