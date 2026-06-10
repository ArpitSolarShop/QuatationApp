import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, subject, quotationData } = body;

        if (!email) {
            return NextResponse.json({ success: false, message: "Email address is required" }, { status: 400 });
        }

        // For now, we'll return instructions to configure email
        // Email sending requires SMTP configuration
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpUser || !smtpPass) {
            // Fallback: Open default email client with mailto link
            const { customerName, systemSize, panelBrand, panelWattage, panelType, inverterModel, totalAmount, effectiveCost, centralSubsidy, stateSubsidy } = quotationData || {};

            const emailBody = `Dear ${customerName || "Customer"},

Thank you for your interest in solar power! Here's your quotation from Arpit Solar Shop.

SYSTEM DETAILS
- System Size: ${systemSize} KW
- Solar Panels: ${panelBrand} ${panelWattage}Wp (${panelType})
- Inverter: ${inverterModel}

INVESTMENT SUMMARY
- Total Amount: ₹${new Intl.NumberFormat("en-IN").format(totalAmount || 0)}

PM SURYA GHAR SUBSIDY
- Central Subsidy: ₹${new Intl.NumberFormat("en-IN").format(centralSubsidy || 0)}
- State Subsidy: ₹${new Intl.NumberFormat("en-IN").format(stateSubsidy || 0)}

EFFECTIVE COST: ₹${new Intl.NumberFormat("en-IN").format(effectiveCost || 0)}

---
ARPIT SOLAR SHOP
GSTIN: 09APKPM6299L1ZW
Contact: +91 9005770466
Email: arpitsolarshop@gmail.com

This quotation is valid for 7 days.`;

            const mailtoSubject = encodeURIComponent(subject || `Solar Quotation - ${customerName || "Customer"}`);
            const mailtoBody = encodeURIComponent(emailBody);
            const mailtoLink = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`;

            return NextResponse.json({
                success: true,
                useMailto: true,
                mailtoLink,
                message: "Email client link generated. SMTP not configured for direct sending."
            });
        }

        // If SMTP is configured, send email directly
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || "587"),
            secure: smtpPort === "465",
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        const { customerName, systemSize, panelBrand, panelWattage, panelType, inverterModel, totalAmount, effectiveCost, centralSubsidy, stateSubsidy } = quotationData || {};

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; }
    .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .highlight { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .effective-cost { font-size: 24px; color: #16a34a; font-weight: bold; }
    .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ARPIT SOLAR SHOP</h1>
    <p>Solar Quotation</p>
  </div>
  <div class="content">
    <p>Dear <strong>${customerName || "Customer"}</strong>,</p>
    <p>Thank you for your interest in solar power! Here's your quotation:</p>
    
    <h3>System Details</h3>
    <ul>
      <li>System Size: <strong>${systemSize} KW</strong></li>
      <li>Solar Panels: <strong>${panelBrand} ${panelWattage}Wp (${panelType})</strong></li>
      <li>Inverter: <strong>${inverterModel}</strong></li>
    </ul>
    
    <h3>Investment Summary</h3>
    <p>Total Amount: <strong>₹${new Intl.NumberFormat("en-IN").format(totalAmount || 0)}</strong></p>
    
    <div class="highlight">
      <h4>PM Surya Ghar Subsidy</h4>
      <p>Central Subsidy: ₹${new Intl.NumberFormat("en-IN").format(centralSubsidy || 0)}</p>
      <p>State Subsidy: ₹${new Intl.NumberFormat("en-IN").format(stateSubsidy || 0)}</p>
      <p class="effective-cost">Effective Cost: ₹${new Intl.NumberFormat("en-IN").format(effectiveCost || 0)}</p>
    </div>
    
    <p>This quotation is valid for 7 days.</p>
  </div>
  <div class="footer">
    <p>ARPIT SOLAR SHOP | GSTIN: 09APKPM6299L1ZW</p>
    <p>Contact: +91 9005770466 | Email: arpitsolarshop@gmail.com</p>
  </div>
</body>
</html>`;

        await transporter.sendMail({
            from: `"Arpit Solar Shop" <${smtpUser}>`,
            to: email,
            subject: subject || `Solar Quotation - ${customerName || "Customer"}`,
            html: htmlContent
        });

        return NextResponse.json({
            success: true,
            message: "Email sent successfully"
        });

    } catch (error) {
        console.error("Email API error:", error);
        return NextResponse.json({
            success: false,
            message: (error as any).message || "Failed to send email"
        }, { status: 500 });
    }
}
