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
        density: 0,
        filterMaskBits: 0,
    });

    // entry pallet
    body.createFixture({
        shape: new Polygon([
            Vec2(-0.2, -0.12),
            Vec2(-0.14, -0.18),
            Vec2(-0.13, -0.18),
            Vec2(-0.18, -0.12),
        ]),
        density: 0,
        friction: params.friction,
    });

    // exit pallet arm
    body.createFixture({
        shape: new Polygon([
            Vec2(0.0, 0.0),
            Vec2(0.0, -0.02),
            Vec2(0.22, -0.06),
            Vec2(0.23, -0.06),
        ]),
        density: 0,
    });

    // exit pallet
    body.createFixture({
        shape: new Polygon([
            Vec2(0.22, -0.06),
            Vec2(0.16, -0.18),
            Vec2(0.16, -0.195),
            Vec2(0.23, -0.06),
        ]),
        density: 0,
        friction: params.friction,
    });
}
