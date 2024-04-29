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
            this.ctx.save();

            this.pxPerM = canvas.height / this.viewHeight;
            this.mPerPx = 1.0 / this.pxPerM;
            this.xCentre = this.canvas.width / 2;
            this.yCentre = this.canvas.height / 2;

            this.world.step(dt);

            this.ctx.fillStyle = '#45f';
            this.ctx.strokeStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.translate(this.xCentre, this.yCentre);
     
            for (let body = world.getBodyList(); body; body = body.getNext()) {
                this.renderBody(body);
            }
     
            for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
                this.renderJoint(joint);
            }

            this.ctx.restore();
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
        let bx = body.getPosition().x * this.pxPerM;
        let by = -body.getPosition().y * this.pxPerM;

        this.ctx.save();
        this.ctx.translate(-bx, by);
        this.ctx.rotate(body.getAngle());
        this.ctx.translate(bx, -by);
        this.ctx.beginPath();

        let shape = fixture.getShape();
        let type = fixture.getType();
        if (type == 'circle') {
            this.ctx.arc(bx + shape.m_p.x * this.pxPerM, by - shape.m_p.y * this.pxPerM, shape.m_radius * this.pxPerM, 0, Math.PI*2, true);
        } else if (type == 'polygon') {
            let p = shape.m_vertices;
            if (p.length > 1) {
                this.ctx.moveTo(bx + p[0].x * this.pxPerM, by - p[0].y * this.pxPerM);
                for (let i = 1; i < p.length; i++) {
                    this.ctx.lineTo(bx + p[i].x * this.pxPerM, by - p[i].y * this.pxPerM);
                }
                this.ctx.closePath();
            }
        }

        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }
 
    renderJoint(joint) {
        let type = joint.getType();
        if (type == 'distance-joint') {
            let posA = joint.m_bodyA.getPosition().clone().add(joint.m_localAnchorA);
            let posB = joint.m_bodyB.getPosition().clone().add(joint.m_localAnchorB);
            let x1 = posA.x * this.pxPerM;
            let y1 = -posA.y * this.pxPerM;
            let x2 = posB.x * this.pxPerM;
            let y2 = -posB.y * this.pxPerM;

            if (joint.getLength() > 0.01) {
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }
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
