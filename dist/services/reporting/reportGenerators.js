import PDFDocument from "pdfkit";
export const generateMarkdown = (run) => {
    const lines = [
        `# OSINT Report: ${run.query}`,
        "",
        `- **Search Run ID**: ${run.id}`,
        `- **Generated**: ${new Date().toISOString()}`,
        `- **Findings Count**: ${run.findings.length}`,
        ""
    ];
    for (const finding of run.findings) {
        lines.push(`## ${finding.title}`);
        lines.push(`**Category**: ${finding.category}`);
        lines.push(`**Confidence**: ${(finding.confidence * 100).toFixed(0)}%`);
        lines.push(`**Source**: [${finding.source.provider}](${finding.source.url})`);
        lines.push(`**Retrieved**: ${finding.retrievedAt.toISOString()}`);
        lines.push("", finding.summary, "");
        if (finding.riskAssessment) {
            lines.push(`**Risk Assessment**:`);
            lines.push(`- Severity: ${finding.riskAssessment.severity}`);
            lines.push(`- Score: ${finding.riskAssessment.score}`);
            lines.push(`- Rationale: ${finding.riskAssessment.rationale}`);
        }
        lines.push("");
    }
    return lines.join("\n");
};
export const generatePdfBase64 = async (markdown) => new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 40 });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.fontSize(14).text("OSINT Intelligence Report", { underline: true });
    doc.fontSize(11).text(markdown);
    doc.end();
});
