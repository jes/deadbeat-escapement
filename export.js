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
    const entryPallet = [
        [extra.gx, extra.gy],
        [extra.cx, extra.cy],
        [extra.dx, extra.dy]
    ];
    
    const exitPallet = [
        [extra.hx, extra.hy],
        [extra.ex, extra.ey],
        [extra.fx, extra.fy]
    ];
    
    // Scale factor (convert meters to mm)
    const scale = 1000;
    
    // Create SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
  <g stroke="black" stroke-width="0.1" fill="none">
    <!-- Entry Pallet -->
    <path d="M ${entryPallet[0][0] * scale + 105},${-entryPallet[0][1] * scale + 148.5} 
             L ${entryPallet[1][0] * scale + 105},${-entryPallet[1][1] * scale + 148.5} 
             L ${entryPallet[2][0] * scale + 105},${-entryPallet[2][1] * scale + 148.5} 
             Z" />
    
    <!-- Exit Pallet -->
    <path d="M ${exitPallet[0][0] * scale + 105},${-exitPallet[0][1] * scale + 148.5} 
             L ${exitPallet[1][0] * scale + 105},${-exitPallet[1][1] * scale + 148.5} 
             L ${exitPallet[2][0] * scale + 105},${-exitPallet[2][1] * scale + 148.5} 
             Z" />
    
    <!-- Pivot point -->
    <circle cx="${105}" cy="${148.5 - pivotSeparation * scale}" r="0.5" />
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
    const entryPallet = [
        [extra.gx, extra.gy],
        [extra.cx, extra.cy],
        [extra.dx, extra.dy]
    ];
    
    const exitPallet = [
        [extra.hx, extra.hy],
        [extra.ex, extra.ey],
        [extra.fx, extra.fy]
    ];
    
    // Scale factor (convert meters to mm)
    const scale = 1000;
    
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

    // Add entry pallet
    dxfContent += addDxfPolyline(entryPallet, scale);
    
    // Add exit pallet
    dxfContent += addDxfPolyline(exitPallet, scale);
    
    // Add pivot point
    dxfContent += `0
CIRCLE
8
0
10
0
20
${-pivotSeparation * scale}
40
0.5
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
