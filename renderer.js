// based on https://piqnt.com/planck.js/docs/rendering
class Renderer {
    world = null;
    canvasId = null;

    // viewport
    viewHeight = 2.0; // metres
    pxPerM = null;
    mPerPx = null;
    xCentre = null;
    yCentre = null;

    ctx = null;
    canvas = null;

    lastTs = null;

    constructor(world, canvasId) {
        this.world = world;
        this.canvasId = canvasId;

        world.on('remove-fixture', this.removeFixture);
        world.on('remove-joint', this.removeJoint);
        world.on('remove-body', this.removeBody);

        this.loop(0);
    }
 
    // Game loop
    loop(ts) {
        let dt = (ts - this.lastTs) / 1000.0;
        this.lastTs = ts;
        if (dt > 1) dt = 1.0;
        if (dt > 0) {
            // reinitialise this.canvas,this.ctx each frame so that the canvas
            // can be resized, recreated, etc. without confusing us
            this.canvas = document.getElementById(this.canvasId);
            this.ctx = canvas.getContext('2d');

            this.pxPerM = canvas.height / this.viewHeight;
            this.mPerPx = 1.0 / this.pxPerM;
            this.xCentre = this.canvas.width / 2;
            this.yCentre = this.canvas.height / 2;

            this.world.step(dt);

            this.ctx.fillStyle = '#45f';
            this.ctx.strokeStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
     
            for (let body = world.getBodyList(); body; body = body.getNext()) {
                this.renderBody(body);
            }
     
            for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
                this.renderJoint(joint);
            }
        }
 
        // Request a new frame
        window.requestAnimationFrame(this.loop.bind(this));
    }
 
    renderBody(body) {
        for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            this.renderFixture(body, fixture);
        }
    }
 
    renderFixture(body, fixture) {
        let cx = this.xCentre + body.getPosition().x * this.pxPerM;
        let cy = this.yCentre - body.getPosition().y * this.pxPerM;

        this.ctx.beginPath();

        let shape = fixture.getShape();
        let type = fixture.getType();
        if (type == 'circle') {
            this.ctx.arc(cx + shape.m_p.x * this.pxPerM, cy - shape.m_p.y * this.pxPerM, shape.m_radius * this.pxPerM, 0, Math.PI*2, true);
        } else if (type == 'polygon') {
            let p = shape.m_vertices;
            if (p.length > 1) {
                this.ctx.moveTo(cx + p[0].x * this.pxPerM, cy - p[0].y * this.pxPerM);
                for (let i = 1; i < p.length; i++) {
                    this.ctx.lineTo(cx + p[i].x * this.pxPerM, cy - p[i].y * this.pxPerM);
                }
                this.ctx.closePath();
            }
        }

        this.ctx.fill();
        this.ctx.stroke();
    }
 
    renderJoint(joint) {
        let posA = joint.m_bodyA.getPosition();
        let posB = joint.m_bodyB.getPosition();
        let x1 = this.xCentre + posA.x * this.pxPerM;
        let y1 = this.yCentre - posA.y * this.pxPerM;
        let x2 = this.xCentre + posB.x * this.pxPerM;
        let y2 = this.yCentre - posB.y * this.pxPerM;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
 
    removeBody(body) {
        // Remove body rendering
    }
 
    removeFixture(fixture) {
        // Remove fixture rendering
    }
 
    removeJoint(joint) {
        // Remove joint from rendering
    }
}
