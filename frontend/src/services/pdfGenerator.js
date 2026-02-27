import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Cyber Knights - Frontend PDF Generator
 * Generates professional security reports from scan results
 */
export const generatePDFReport = (report) => {
    const doc = new jsPDF();
    const primaryColor = [0, 243, 255]; // Cyan
    const secondaryColor = [188, 19, 254]; // Purple

    // Header
    doc.setFillColor(5, 8, 10);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(0, 243, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('CYBER KNIGHTS', 20, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('PRE-INSTALLATION APK THREAT ANALYSIS', 20, 32);

    // Horizontal Line
    doc.setDrawColor(0, 243, 255);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Basic Info
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.text('REPORT OVERVIEW', 20, 55);

    const basicInfo = [
        ['Report ID', report.report_id || 'N/A'],
        ['File Name', report.file_name || 'N/A'],
        ['File Hash (SHA-256)', report.file_hash || 'N/A'],
        ['File Size', `${report.file_size_kb || 0} KB`],
        ['Scan Type', (report.scan_type || 'APK').toUpperCase()],
        ['Timestamp', new Date(report.created_at || Date.now()).toLocaleString()]
    ];

    doc.autoTable({
        startY: 60,
        head: [['Field', 'Value']],
        body: basicInfo,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 9 }
    });

    // Risk Assessment
    let currentY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.text('RISK ASSESSMENT', 20, currentY);

    const riskColor = report.classification === 'High Risk' ? [255, 0, 85] :
        report.classification === 'Medium Risk' ? [255, 234, 0] : [0, 255, 159];

    doc.setTextColor(...riskColor);
    doc.setFontSize(22);
    doc.text(`${report.risk_score}/100`, 20, currentY + 12);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Classification: ${report.classification}`, 20, currentY + 18);

    // Risk Breakdown
    const breakdown = [
        ['Dangerous Permissions', report.permission_count || 0, '5 pts/ea'],
        ['Malware Signature Match', report.malware_match ? 'FOUND' : 'NONE', '40 pts'],
        ['Suspicious Embedded URLs', report.url_count || 0, '10 pts/ea'],
        ['Suspicious API Usage', report.api_count || 0, '8 pts/ea']
    ];

    doc.autoTable({
        startY: currentY + 25,
        head: [['Factor', 'Count/Match', 'Weight']],
        body: breakdown,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
    });

    // Findings Details
    currentY = doc.lastAutoTable.finalY + 15;

    if (currentY > 240) {
        doc.addPage();
        currentY = 20;
    }

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.text('TECHNICAL FINDINGS', 20, currentY);

    // Permissions Table
    const perms = Array.isArray(report.permissions) ? report.permissions.map(p => [p]) : [];
    if (perms.length > 0) {
        doc.autoTable({
            startY: currentY + 10,
            head: [['Dangerous Permissions Detected']],
            body: perms.slice(0, 15),
            theme: 'plain',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
            styles: { fontSize: 8 }
        });
        currentY = doc.lastAutoTable.finalY + 10;
    }

    // Sensitive Data
    const sensitive = Array.isArray(report.sensitive_data) ? report.sensitive_data.map(d => [d.type, d.value]) : [];
    if (sensitive.length > 0) {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.autoTable({
            startY: currentY,
            head: [['Sensitive Data Found', 'Value']],
            body: sensitive,
            theme: 'plain',
            headStyles: { fillColor: [255, 234, 0], textColor: [0, 0, 0] },
            styles: { fontSize: 8 }
        });
        currentY = doc.lastAutoTable.finalY + 10;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cyber Knights Platform - page ${i} of ${pageCount}`, 20, 285);
        doc.text('Confidential Security Report - https://cyberknights.io', 140, 285);
    }

    doc.save(`CyberKnights_Report_${report.file_name?.slice(0, 20) || 'Scan'}.pdf`);
};
