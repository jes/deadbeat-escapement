// find the intersection of 2 lines, one passing through the origin,
// tilted away from the vertical to the right by originAngle, and the
// other passing through (0, pointY) and tilted to the left by
// pointAngle
function intersection(originAngle, pointAngle, pointY) {
    let h = (pointY * Math.tan(originAngle)) / (Math.tan(originAngle)+Math.tan(pointAngle));
    let x = h * Math.tan(pointAngle);
    let y = pointY - h;
    return Vec2(x, y);
}
