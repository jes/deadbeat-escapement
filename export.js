// Export functions for the deadbeat escapement simulator

// Main export function that gets called when the export button is clicked
function exportPallets() {
    // Create a simple dialog to choose format
    const format = prompt("Export format (svg or dxf):", "svg").toLowerCase();
    
    if (format === "svg") {
        exportSVG();
    } else if (format === "dxf") {
        exportDXF();
    } else {
        alert("Unsupported format. Please choose 'svg' or 'dxf'.");
    }
}

// Export anchor pallets as SVG
function exportSVG() {
    if (!anchor) {
        alert("Please run the simulation first.");
        return;
    }
    
    // Get the pallet coordinates from the anchor
    const entryPalletImpulseFace = [
        [extra.cx, extra.cy],
        [extra.dx, extra.dy]
    ];
    
    const entryPalletRestingFace = [
        [extra.cx, extra.cy],
        [extra.gx, extra.gy]
    ];
    
    const exitPalletImpulseFace = [
        [extra.ex, extra.ey],
        [extra.fx, extra.fy]
    ];
    
    const exitPalletRestingFace = [
        [extra.ex, extra.ey],
        [extra.hx, extra.hy]
    ];
    
    // Scale factor (convert meters to mm)
    const scale = 1000;
    
    // Size of the plus markers
    const plusSize = 1;
    
    // Create SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
  <g stroke="black" stroke-width="0.1" fill="none">
    <!-- Entry Pallet Impulse Face -->
    <path d="M ${entryPalletImpulseFace[0][0] * scale + 105},${-entryPalletImpulseFace[0][1] * scale + 148.5} 
             L ${entryPalletImpulseFace[1][0] * scale + 105},${-entryPalletImpulseFace[1][1] * scale + 148.5}" />
    
    <!-- Entry Pallet Resting Face -->
    <path d="M ${entryPalletRestingFace[0][0] * scale + 105},${-entryPalletRestingFace[0][1] * scale + 148.5} 
             L ${entryPalletRestingFace[1][0] * scale + 105},${-entryPalletRestingFace[1][1] * scale + 148.5}" />
    
    <!-- Exit Pallet Impulse Face -->
    <path d="M ${exitPalletImpulseFace[0][0] * scale + 105},${-exitPalletImpulseFace[0][1] * scale + 148.5} 
             L ${exitPalletImpulseFace[1][0] * scale + 105},${-exitPalletImpulseFace[1][1] * scale + 148.5}" />
    
    <!-- Exit Pallet Resting Face -->
    <path d="M ${exitPalletRestingFace[0][0] * scale + 105},${-exitPalletRestingFace[0][1] * scale + 148.5} 
             L ${exitPalletRestingFace[1][0] * scale + 105},${-exitPalletRestingFace[1][1] * scale + 148.5}" />
    
    <!-- Pivot point (plus sign) -->
    <path d="M ${105 - plusSize},${148.5 - pivotSeparation * scale} 
             L ${105 + plusSize},${148.5 - pivotSeparation * scale}" />
    <path d="M ${105},${148.5 - pivotSeparation * scale - plusSize} 
             L ${105},${148.5 - pivotSeparation * scale + plusSize}" />
    
    <!-- Escape wheel center (plus sign) -->
    <path d="M ${105 - plusSize},${148.5} 
             L ${105 + plusSize},${148.5}" />
    <path d="M ${105},${148.5 - plusSize} 
             L ${105},${148.5 + plusSize}" />
  </g>
</svg>`;
    
    // Create download link
    downloadFile(svgContent, "anchor_pallets.svg", "image/svg+xml");
}

// Export anchor pallets as DXF
function exportDXF() {
    if (!anchor) {
        alert("Please run the simulation first.");
        return;
    }
    
    // Get the pallet coordinates from the anchor
    const entryPalletImpulseFace = [
        [extra.cx, extra.cy],
        [extra.dx, extra.dy]
    ];
    
    const entryPalletRestingFace = [
        [extra.cx, extra.cy],
        [extra.gx, extra.gy]
    ];
    
    const exitPalletImpulseFace = [
        [extra.ex, extra.ey],
        [extra.fx, extra.fy]
    ];
    
    const exitPalletRestingFace = [
        [extra.ex, extra.ey],
        [extra.hx, extra.hy]
    ];
    
    // Scale factor (convert meters to mm)
    const scale = 1000;
    
    // Size of the plus markers
    const plusSize = 1;
    
    // Create DXF content
    let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
2
ENTITIES
`;

    // Add entry pallet impulse face
    dxfContent += `0
LINE
8
0
10
${entryPalletImpulseFace[0][0] * scale}
20
${-entryPalletImpulseFace[0][1] * scale}
11
${entryPalletImpulseFace[1][0] * scale}
21
${-entryPalletImpulseFace[1][1] * scale}
0
`;

    // Add entry pallet resting face
    dxfContent += `0
LINE
8
0
10
${entryPalletRestingFace[0][0] * scale}
20
${-entryPalletRestingFace[0][1] * scale}
11
${entryPalletRestingFace[1][0] * scale}
21
${-entryPalletRestingFace[1][1] * scale}
0
`;
    
    // Add exit pallet impulse face
    dxfContent += `0
LINE
8
0
10
${exitPalletImpulseFace[0][0] * scale}
20
${-exitPalletImpulseFace[0][1] * scale}
11
${exitPalletImpulseFace[1][0] * scale}
21
${-exitPalletImpulseFace[1][1] * scale}
0
`;

    // Add exit pallet resting face
    dxfContent += `0
LINE
8
0
10
${exitPalletRestingFace[0][0] * scale}
20
${-exitPalletRestingFace[0][1] * scale}
11
${exitPalletRestingFace[1][0] * scale}
21
${-exitPalletRestingFace[1][1] * scale}
0
`;
    
    // Add pivot point (plus sign - horizontal line)
    dxfContent += `0
LINE
8
0
10
${-plusSize}
20
${-pivotSeparation * scale}
11
${plusSize}
21
${-pivotSeparation * scale}
0
`;

    // Add pivot point (plus sign - vertical line)
    dxfContent += `0
LINE
8
0
10
0
20
${-pivotSeparation * scale - plusSize}
11
0
21
${-pivotSeparation * scale + plusSize}
0
`;

    // Add escape wheel center (plus sign - horizontal line)
    dxfContent += `0
LINE
8
0
10
${-plusSize}
20
0
11
${plusSize}
21
0
0
`;

    // Add escape wheel center (plus sign - vertical line)
    dxfContent += `0
LINE
8
0
10
0
20
${-plusSize}
11
0
21
${plusSize}
0
`;

    // Close DXF file
    dxfContent += `ENDSEC
0
EOF`;
    
    // Create download link
    downloadFile(dxfContent, "anchor_pallets.dxf", "application/dxf");
}

// Helper function to add a polyline to DXF
function addDxfPolyline(points, scale) {
    let dxf = `0
POLYLINE
8
0
66
1
70
1
0
`;

    // Add vertices
    for (let i = 0; i < points.length; i++) {
        dxf += `VERTEX
8
0
10
${points[i][0] * scale}
20
${-points[i][1] * scale}
0
`;
    }

    // Close polyline
    dxf += `SEQEND
0
`;

    return dxf;
}

// Helper function to download a file
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Global variable to store extra data from simulation
let extra = {};

// Function to update the extra data when simulation runs
function updateExtraData(extraData) {
    extra = extraData;
}
