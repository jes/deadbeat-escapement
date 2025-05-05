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
    
    // Get the pallet objects from extra data
    const entryPallet = extra.entryPallet;
    const exitPallet = extra.exitPallet;
    
    // Scale factor (convert meters to mm)
    const scale = 1000;
    
    // Size of the plus markers
    const plusSize = 1;
    
    // Create SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">
  <g stroke="black" stroke-width="0.1" fill="none">
    <!-- Entry Pallet Polygon -->
    <polygon points="${entryPallet.m_vertices.map(v => 
        `${v.x * scale + 105},${-v.y * scale + 148.5}`).join(' ')}" 
        stroke="black" />
    
    <!-- Exit Pallet Polygon -->
    <polygon points="${exitPallet.m_vertices.map(v => 
        `${v.x * scale + 105},${-v.y * scale + 148.5}`).join(' ')}" 
        stroke="black" />
    
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
    
    // Get the pallet objects from extra data
    const entryPallet = extra.entryPallet;
    const exitPallet = extra.exitPallet;
    
    // Scale factor (convert meters to mm)
    const scale = 1000;
    
    // Size of the plus markers
    const plusSize = 1;
    
    // Begin DXF content
    let dxfContent = `999
DXF created by Deadbeat Escapement Simulator
0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
-100.0
20
-100.0
30
0.0
9
$EXTMAX
10
100.0
20
100.0
30
0.0
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Helper function to add a line to DXF - using explicit formatting
    function addLine(x1, y1, x2, y2) {
        return `0
LINE
8
0
10
${x1}
20
${y1}
30
0.0
11
${x2}
21
${y2}
31
0.0
`;
    }

    // Add entry pallet polygon
    dxfContent += `0
LWPOLYLINE
8
EntryPallet
100
AcDbEntity
100
AcDbPolyline
90
${entryPallet.m_vertices.length}
70
1
`;
    
    // Add each vertex of entry pallet
    entryPallet.m_vertices.forEach(vertex => {
        dxfContent += `10
${vertex.x * scale}
20
${vertex.y * scale}
`;
    });

    // Add exit pallet polygon
    dxfContent += `0
LWPOLYLINE
8
ExitPallet
100
AcDbEntity
100
AcDbPolyline
90
${exitPallet.m_vertices.length}
70
1
`;
    
    // Add each vertex of exit pallet
    exitPallet.m_vertices.forEach(vertex => {
        dxfContent += `10
${vertex.x * scale}
20
${vertex.y * scale}
`;
    });
    
    // Pivot point (plus sign - horizontal)
    dxfContent += addLine(
        -plusSize, 
        pivotSeparation * scale, 
        plusSize, 
        pivotSeparation * scale
    );
    
    // Pivot point (plus sign - vertical)
    dxfContent += addLine(
        0, 
        pivotSeparation * scale - plusSize, 
        0, 
        pivotSeparation * scale + plusSize
    );
    
    // Escape wheel center (plus sign - horizontal)
    dxfContent += addLine(
        -plusSize, 
        0, 
        plusSize, 
        0
    );
    
    // Escape wheel center (plus sign - vertical)
    dxfContent += addLine(
        0, 
        -plusSize, 
        0, 
        plusSize
    );

    // Close DXF file
    dxfContent += `0
ENDSEC
0
SECTION
2
OBJECTS
0
ENDSEC
0
EOF
`;
    
    // Create download link
    downloadFile(dxfContent, "anchor_pallets.dxf", "application/dxf");
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
