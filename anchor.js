/* params:
 *  TODO
 */
function addAnchorFixtures(body, params, extra) {
    // entry pallet
    body.createFixture({
        shape: extra.entryPallet,
        density: 0,
        friction: params.friction,
    });

    // exit pallet
    body.createFixture({
        shape: extra.exitPallet,
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
