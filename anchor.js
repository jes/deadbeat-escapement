/* params:
 *  TODO
 */
function addAnchorFixtures(body, params, extra) {
    // entry pallet arm
    /*body.createFixture({
        shape: new Polygon([
            Vec2(0.0, extra.pivotseparation),
            Vec2(-0.21, extra.pivotseparation-0.12),
            Vec2(-0.19, extra.pivotseparation-0.12),
            Vec2(0.0, extra.pivotseparation-0.02),
        ]),
        density: 0,
        filterMaskBits: 0,
    });*/

    let a = 0.02;

    // entry pallet
    body.createFixture({
        shape: new Polygon([
            //Vec2(-0.28, a+extra.pivotseparation-0.12),
            Vec2(extra.gx, extra.gy),
            Vec2(extra.cx, extra.cy),
            Vec2(extra.dx, extra.dy),
        ]),
        density: 0,
        friction: params.friction,
    });

    // exit pallet arm
    /*body.createFixture({
        shape: new Polygon([
            Vec2(0.0, extra.pivotseparation),
            Vec2(0.0, extra.pivotseparation-0.02),
            Vec2(0.21, extra.pivotseparation-0.06),
            Vec2(0.22, extra.pivotseparation-0.06),
        ]),
        density: 0,
    });*/

    // exit pallet
    body.createFixture({
        shape: new Polygon([
            Vec2(extra.hx, extra.hy),
            Vec2(extra.ex, extra.ey),
            Vec2(extra.fx, extra.fy),
        ]),
        density: 0,
        friction: params.friction,
    });

    body.createFixture({
        shape: new Circle(Vec2(0.0, extra.pivotseparation), 0.01),
        density: 0,
        filterMaskBits: 0,
    });
}
