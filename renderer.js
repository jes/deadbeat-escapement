// based on https://piqnt.com/planck.js/docs/rendering
class Renderer {
    world = null;
    canvasId = null;

    viewHeight = 1.0; // metres

    ctx = null;
    canvas = null;

    constructor(world, canvasId) {
        this.world = world;
        this.canvasId = canvasId;

        this.draw();
    }

    draw = () => {
        // reinitialise this.canvas,this.ctx each frame so that the canvas
        // can be resized, recreated, etc. without confusing us
        this.canvas = document.getElementById(this.canvasId);
        this.ctx = canvas.getContext('2d');
        this.ctx.save();

        this.ctx.fillStyle = '#eee';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#000';
        this.ctx.fillStyle = '#fff';

        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);

        let scale = canvas.height / this.viewHeight;
        this.ctx.lineWidth = 1.0/scale;
        this.ctx.scale(scale, -scale);

        for (let body = this.world.getBodyList(); body; body = body.getNext()) {
            this.renderBody(body);
        }

        for (let joint = this.world.getJointList(); joint; joint = joint.getNext()) {
            this.renderJoint(joint);
        }

        this.ctx.restore();

        // Request a new frame
        window.requestAnimationFrame(this.draw);
    }

    renderBody(body) {
        for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
            this.ctx.save();
            let bx = body.getPosition().x;
            let by = body.getPosition().y;

            // rotate around object centre
            this.ctx.translate(bx, by);
            this.ctx.rotate(body.getAngle());
            this.ctx.translate(-bx, -by);

            // translate to object position
            this.ctx.translate(bx, by);

            this.renderFixture(body, fixture);
            this.ctx.restore();
        }
    }

    renderFixture(body, fixture) {
        this.ctx.beginPath();

        let shape = fixture.getShape();
        let type = fixture.getType();
        if (type == 'circle') {
            this.ctx.arc(shape.m_p.x, shape.m_p.y, shape.m_radius, 0, Math.PI*2, true);
        } else if (type == 'polygon') {
            let p = shape.m_vertices;
            if (p.length > 1) {
                this.ctx.moveTo(p[0].x, p[0].y);
                for (let i = 1; i < p.length; i++) {
                    this.ctx.lineTo(p[i].x, p[i].y);
                }
                this.ctx.closePath();
            }
        }

        this.ctx.fill();
        this.ctx.stroke();
    }

    renderJoint(joint) {
        let type = joint.getType();
        if (type == 'distance-joint') {
            let posA = joint.m_bodyA.getPosition().clone().add(joint.m_localAnchorA);
            let posB = joint.m_bodyB.getPosition().clone().add(joint.m_localAnchorB);
            let x1 = posA.x;
            let y1 = posA.y;
            let x2 = posB.x;
            let y2 = posB.y;

            if (joint.getLength() > 0.01) {
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }
    }
}
