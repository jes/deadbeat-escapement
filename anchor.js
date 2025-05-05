/* params:
 *  TODO
 */
function addAnchorFixtures(body, params, extra) {
    // entry pallet
    body.createFixture({
        shape: new Polygon([
            Vec2(extra.gx, extra.gy),
            Vec2(extra.cx, extra.cy),
            Vec2(extra.dx, extra.dy),
        ]),
        density: 0,
        friction: params.friction,
    });

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

    // centre of rotation
    body.createFixture({
        shape: new Circle(Vec2(0.0, extra.pivotseparation), params.majordiameter/100000),
        density: 0,
        filterMaskBits: 0,
    });
}
