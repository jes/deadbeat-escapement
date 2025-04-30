function Scope(parentElement) {
    this.points = [];
    this.maxpoints = 2000;
    this.parentElement = parentElement;
    this.isXYPlot = false;
    this.xField = 'anchorangle';
    this.yField = 'anchortorque';

    let scope = this;

    let fieldnames = ['Angle vs torque', 'Anchor angle (deg)', 'Escape wheel tooth angle (deg)', 'Anchor angular velocity (deg/sec)', 'Anchor angular acceleration (deg/sec^2)', 'Escape wheel angular velocity (deg/sec)', 'Escape wheel angular acceleration (deg/sec^2)', 'Anchor angle integral (deg secs)', 'Anchor torque (Nm)', 'Gravity torque (Nm)', 'Torque integral (Nm secs)'];
    let fieldvalues = ['xyplot', 'anchorangle', 'escapewheeltoothangle', 'anchorangvel', 'anchorangaccel', 'escapewheelangvel', 'escapewheelangaccel', 'anchorangleintegral', 'anchortorque', 'gravitytorque', 'torqueintegral'];

    this.div = document.createElement('div');
    this.div.style.border = "solid 1px black";
    this.fieldselect = document.createElement('select');
    for (let i in fieldnames) {
        let opt = document.createElement('option');
        opt.text = fieldnames[i];
        opt.value = fieldvalues[i];
        this.fieldselect.appendChild(opt);
    }
    this.fieldselect.onchange = function() { 
        scope.points = [];
        scope.isXYPlot = scope.fieldselect.value === 'xyplot';
    };
    this.fieldselect.onchange();
    this.div.appendChild(this.fieldselect);
    let delbutton = document.createElement('button');
    delbutton.innerText = '- Remove scope';
    delbutton.onclick = function() { scope.remove() };
    this.div.appendChild(delbutton);
    let capturebutton = document.createElement('button');
    capturebutton.innerText = 'Capture...';
    capturebutton.onclick = function() { scope.capture() };
    this.div.appendChild(capturebutton);
    let clearbutton = document.createElement('button');
    clearbutton.innerText = 'Clear';
    clearbutton.onclick = function() { scope.points = [] };
    this.div.appendChild(clearbutton);
    this.div.appendChild(document.createElement('br'));
    this.canvas = document.createElement('canvas');
    // TODO: variable size?
    this.canvas.width = 600;
    this.canvas.height = 300;
    this.div.appendChild(this.canvas);
    this.parentElement.appendChild(this.div);
}

Scope.prototype.capture = function() {
    let tsv = '';
    
    if (this.isXYPlot) {
        // For XY plot, output x and y values directly
        for (let i in this.points) {
            tsv += this.points[i][0] + "\t" + this.points[i][1] + "\n";
        }
    } else {
        // For time series, accumulate time
        let t = 0;
        for (let i in this.points) {
            tsv += t + "\t" + this.points[i][1] + "\n";
            t += this.points[i][0];
        }
    }

    let el = document.createElement('a');
    let blob = new Blob([tsv], { type: 'text/tsv' });
    el.href = URL.createObjectURL(blob);
    el.download = 'capture.tsv';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
};

Scope.prototype.remove = function() {
    this.parentElement.removeChild(this.div);
};

Scope.prototype.draw = function() {
    let ctx = this.canvas.getContext('2d');

    // background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.points.length === 0) {
        return;
    }

    if (this.isXYPlot) {
        this.drawXYPlot(ctx);
    } else {
        this.drawTimeSeries(ctx);
    }
};

Scope.prototype.drawTimeSeries = function(ctx) {
    let minval = this.points.length ? this.points[0][1] : 0;
    let maxval = this.points.length ? this.points[0][1] : 0;
    for (let v of this.points) {
        if (v[1] < minval) minval = v[1];
        if (v[1] > maxval) maxval = v[1];
    }

    // draw line in middle if range is 0
    if (minval == maxval) {
        minval -= 1;
        maxval += 1;
    }

    // horizontal grid lines
    ctx.strokeStyle = '#363';
    for (let y = 10; y <= this.canvas.height; y += (this.canvas.height-20)/10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width, y);
        ctx.stroke();
    }

    // main curve
    if (this.points.length) {
        ctx.strokeStyle = '#3f3';
        ctx.beginPath();
        let iPlus = this.maxpoints - this.points.length;
        for (let i in this.points) {
            ctx.lineTo((iPlus+parseInt(i))*this.canvas.width/this.maxpoints, 10+(this.canvas.height-20)*(1-(this.points[i][1]-minval)/(maxval-minval)));
        }
        ctx.stroke();
    }

    // min/max text labels
    ctx.fillStyle = '#3f3';
    ctx.fillText(sigfigs(minval,5), 0, this.canvas.height);
    ctx.fillText(sigfigs(maxval,5), 0, 10);
};

Scope.prototype.drawXYPlot = function(ctx) {
    // Find min/max values for x and y
    let minX = this.points[0][0];
    let maxX = this.points[0][0];
    let minY = this.points[0][1];
    let maxY = this.points[0][1];
    
    for (let v of this.points) {
        if (v[0] < minX) minX = v[0];
        if (v[0] > maxX) maxX = v[0];
        if (v[1] < minY) minY = v[1];
        if (v[1] > maxY) maxY = v[1];
    }
    
    // Add some padding to the ranges
    let xRange = maxX - minX;
    let yRange = maxY - minY;
    
    if (xRange === 0) xRange = 2;
    if (yRange === 0) yRange = 2;
    
    minX -= xRange * 0.05;
    maxX += xRange * 0.05;
    minY -= yRange * 0.05;
    maxY += yRange * 0.05;
    
    // Set up additive blending
    ctx.globalCompositeOperation = 'lighter';
    
    // Draw grid
    ctx.strokeStyle = '#363';
    
    // Calculate grid spacing that aligns with zero
    let xGridSize, yGridSize;
    let xGridCount = 10;
    let yGridCount = 10;
    
    // Calculate nice grid intervals that include zero when possible
    if (minX <= 0 && maxX >= 0) {
        // Range includes zero, create grid centered on zero
        let magnitude = Math.max(Math.abs(minX), Math.abs(maxX));
        xGridSize = getNiceGridInterval(magnitude * 2 / xGridCount);
        // Adjust min/max to align with grid
        let gridSteps = Math.ceil(magnitude / xGridSize);
        let adjustedRange = gridSteps * xGridSize * 2;
        minX = -adjustedRange / 2;
        maxX = adjustedRange / 2;
    } else {
        // Range doesn't include zero
        xGridSize = getNiceGridInterval((maxX - minX) / xGridCount);
        // Adjust min/max to align with grid
        minX = Math.floor(minX / xGridSize) * xGridSize;
        maxX = Math.ceil(maxX / xGridSize) * xGridSize;
    }
    
    if (minY <= 0 && maxY >= 0) {
        // Range includes zero, create grid centered on zero
        let magnitude = Math.max(Math.abs(minY), Math.abs(maxY));
        yGridSize = getNiceGridInterval(magnitude * 2 / yGridCount);
        // Adjust min/max to align with grid
        let gridSteps = Math.ceil(magnitude / yGridSize);
        let adjustedRange = gridSteps * yGridSize * 2;
        minY = -adjustedRange / 2;
        maxY = adjustedRange / 2;
    } else {
        // Range doesn't include zero
        yGridSize = getNiceGridInterval((maxY - minY) / yGridCount);
        // Adjust min/max to align with grid
        minY = Math.floor(minY / yGridSize) * yGridSize;
        maxY = Math.ceil(maxY / yGridSize) * yGridSize;
    }
    
    // Draw vertical grid lines (x-axis)
    let xStart = Math.ceil(minX / xGridSize) * xGridSize;
    for (let x = xStart; x <= maxX; x += xGridSize) {
        let xPos = 10 + (this.canvas.width - 20) * ((x - minX) / (maxX - minX));
        ctx.beginPath();
        ctx.moveTo(xPos, 10);
        ctx.lineTo(xPos, this.canvas.height - 10);
        ctx.stroke();
        
        // Only add labels for zero and min/max
        if (x == xStart) {
            ctx.fillStyle = '#3f3';
            ctx.fillText(sigfigs(x, 3), xPos - 15, this.canvas.height - 2);
        }
    }
    
    // Draw horizontal grid lines (y-axis)
    let yStart = Math.ceil(minY / yGridSize) * yGridSize;
    for (let y = yStart; y <= maxY; y += yGridSize) {
        let yPos = (this.canvas.height - 10) - (this.canvas.height - 20) * ((y - minY) / (maxY - minY));
        ctx.beginPath();
        ctx.moveTo(10, yPos);
        ctx.lineTo(this.canvas.width - 10, yPos);
        ctx.stroke();
        
        // Only add labels for zero and min/max
        if (y == yStart) {
            ctx.fillStyle = '#3f3';
            ctx.fillText(sigfigs(y, 3), 2, yPos + 4);
        }
    }
    
    // Highlight x=0 and y=0 lines if they're within the visible range
    ctx.strokeStyle = '#363';
    ctx.lineWidth = 1;
    
    // x=0 vertical line
    if (minX <= 0 && maxX >= 0) {
        let zeroX = 10 + (this.canvas.width - 20) * ((0 - minX) / (maxX - minX));
        ctx.beginPath();
        ctx.moveTo(zeroX, 10);
        ctx.lineTo(zeroX, this.canvas.height - 10);
        ctx.stroke();
    }
    
    // y=0 horizontal line
    if (minY <= 0 && maxY >= 0) {
        let zeroY = (this.canvas.height - 10) - (this.canvas.height - 20) * ((0 - minY) / (maxY - minY));
        ctx.beginPath();
        ctx.moveTo(10, zeroY);
        ctx.lineTo(this.canvas.width - 10, zeroY);
        ctx.stroke();
    }
    
    // Reset line width
    ctx.lineWidth = 1;
    
    // Draw axes labels
    ctx.fillStyle = '#3f3';
    ctx.fillText("Angle (°)", this.canvas.width / 2, this.canvas.height - 2);
    ctx.save();
    ctx.translate(2, this.canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Torque (Nm)", 0, 0);
    ctx.restore();
    
    // Draw the data points
    let opacity = 0.5;
    ctx.strokeStyle = 'rgba(51, 255, 51, '+opacity+')'; // Reduced opacity for additive effect
    ctx.beginPath();
    
    for (let i = 0; i < this.points.length; i++) {
        let x = 10 + (this.canvas.width - 20) * ((this.points[i][0] - minX) / (maxX - minX));
        let y = (this.canvas.height - 10) - (this.canvas.height - 20) * ((this.points[i][1] - minY) / (maxY - minY));
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Reset composite operation before drawing the last point
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw a circle at the most recent point
    if (this.points.length > 0) {
        let lastPoint = this.points[this.points.length - 1];
        let x = 10 + (this.canvas.width - 20) * ((lastPoint[0] - minX) / (maxX - minX));
        let y = (this.canvas.height - 10) - (this.canvas.height - 20) * ((lastPoint[1] - minY) / (maxY - minY));
        
        ctx.fillStyle = '#3f3';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
};

// Helper function to get nice grid intervals
function getNiceGridInterval(roughInterval) {
    let exponent = Math.floor(Math.log10(roughInterval));
    let fraction = roughInterval / Math.pow(10, exponent);
    
    let niceFraction;
    if (fraction < 1.5) {
        niceFraction = 1;
    } else if (fraction < 3) {
        niceFraction = 2;
    } else if (fraction < 7) {
        niceFraction = 5;
    } else {
        niceFraction = 10;
    }
    
    return niceFraction * Math.pow(10, exponent);
}

Scope.prototype.getValue = function() {
    switch (this.fieldselect.value) {
        case 'anchorangle': return anchor.getAngle()*180/Math.PI;
        case 'escapewheeltoothangle': return (-escapeWheel.getAngle()*180/Math.PI)%(360/params.teeth);
        case 'anchorangvel': return anchor.getAngularVelocity()*180/Math.PI;
        case 'anchorangaccel': return anchorAngularAcceleration;
        case 'escapewheelangvel': return escapeWheel.getAngularVelocity()*180/Math.PI;
        case 'escapewheelangaccel': return escapeWheelAngularAcceleration;
        case 'anchorangleintegral': return anchorAngleIntegral;
        case 'anchortorque': return anchorTorque;
        case 'gravitytorque': return gravityAnchorTorque;
        case 'torqueintegral': return torqueIntegral;
        case 'xyplot': return [anchor.getAngle()*180/Math.PI, anchorTorque];
    }
    console.log("unrecognised field name: " + this.fieldselect.value);
    return 0;
};

// dt says how long this value came after the previous one
Scope.prototype.update = function(dt) {
    if (this.isXYPlot) {
        let v = this.getValue();
        // For XY plot, store [x, y] directly
        this.points.push(v);
        // Limit number of points to avoid performance issues
        while (this.points.length > this.maxpoints)
            this.points.shift();
    } else {
        let v = this.getValue();
        this.points.push([dt, v]);
        while (this.points.length > this.maxpoints)
            this.points.shift();
    }
};
