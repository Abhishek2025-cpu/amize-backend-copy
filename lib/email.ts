// import nodemailer from 'nodemailer';

// // Email options interface (maintaining the same interface for compatibility)
// interface EmailOptions {
//     to: string | string[];
//     subject: string;
//     text: string;
//     html: string;
//     from?: string;
//     cc?: string | string[];
//     bcc?: string | string[];
//     attachments?: any[];
// }

// // Create reusable transporter
// let transporter: nodemailer.Transporter | null = null;

// /**
//  * Initialize Nodemailer transporter
//  */
// function getTransporter(): nodemailer.Transporter {
//     if (!transporter) {
//         const smtpConfig = {
//             host: process.env.SMTP_HOST || 'smtp.gmail.com',
//             port: parseInt(process.env.SMTP_PORT || '587'),
//             secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
//             auth: {
//                 user: process.env.SMTP_USER || process.env.EMAIL_FROM,
//                 pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
//             },
//         };

//         transporter = nodemailer.createTransport(smtpConfig);
//     }
//     return transporter;
// }

// /**
//  * Base email template with Amize branding
//  */
// function getEmailTemplate(content: string): string {
//     return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Amize</title>
//     </head>
//     <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%); min-height: 100vh;">
//         <div style="max-width: 600px; margin: 0 auto; background: #121212; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);">
//             <!-- Header -->
//             <div style="background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%); padding: 32px 40px; text-align: center; position: relative;">
//                 <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)" /></svg>'); opacity: 0.3;"></div>
//                 <div style="position: relative; z-index: 1;">
//                     <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; margin-bottom: 16px; backdrop-filter: blur(10px);">
//                         <div style="width: 24px; height: 24px; background: white; border-radius: 50%;"></div>
//                     </div>
//                     <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Amize</h1>
//                     <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Create, Share & Discover Amazing Videos</p>
//                 </div>
//             </div>

//             <!-- Content -->
//             <div style="padding: 40px;">
//                 ${content}
//             </div>

//             <!-- Footer -->
//             <div style="background: #1a1a1a; padding: 32px 40px; text-align: center; border-top: 1px solid #2a2a2a;">
//                 <div style="margin-bottom: 20px;">
//                     <a href="https://amize.com" style="color: #ec4899; text-decoration: none; font-weight: 600; margin: 0 16px; font-size: 14px;">Website</a>
//                     <a href="https://amize.com/support" style="color: #ec4899; text-decoration: none; font-weight: 600; margin: 0 16px; font-size: 14px;">Support</a>
//                     <a href="https://amize.com/privacy" style="color: #ec4899; text-decoration: none; font-weight: 600; margin: 0 16px; font-size: 14px;">Privacy</a>
//                 </div>
//                 <div style="margin-bottom: 16px;">
//                     <a href="https://twitter.com/amizeapp" style="display: inline-block; width: 40px; height: 40px; background: #2a2a2a; border-radius: 8px; margin: 0 8px; text-decoration: none; line-height: 40px; text-align: center;">
//                         <span style="color: #ec4899; font-size: 18px;">𝕏</span>
//                     </a>
//                     <a href="https://instagram.com/amizeapp" style="display: inline-block; width: 40px; height: 40px; background: #2a2a2a; border-radius: 8px; margin: 0 8px; text-decoration: none; line-height: 40px; text-align: center;">
//                         <span style="color: #ec4899; font-size: 18px;">IG</span>
//                     </a>
//                     <a href="https://tiktok.com/@amizeapp" style="display: inline-block; width: 40px; height: 40px; background: #2a2a2a; border-radius: 8px; margin: 0 8px; text-decoration: none; line-height: 40px; text-align: center;">
//                         <span style="color: #ec4899; font-size: 18px;">TT</span>
//                     </a>
//                 </div>
//                 <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
//                     © ${new Date().getFullYear()} Amize, Inc. All rights reserved.<br>
//                     Made for creators worldwide
//                 </p>
//             </div>
//         </div>
        
//         <!-- Background decoration -->
//         <div style="position: fixed; top: -100px; left: -100px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
//         <div style="position: fixed; bottom: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%); pointer-events: none;"></div>
//     </body>
//     </html>
//     `;
// }

// /**
//  * Send an email using Nodemailer
//  * @param options Email options (to, subject, text, html, etc.)
//  * @returns Promise resolving to the info object from Nodemailer
//  */
// export async function sendEmail(options: EmailOptions): Promise<any> {
//     try {
//         const transporter = getTransporter();

//         // Prepare mail options
//         const mailOptions: nodemailer.SendMailOptions = {
//             from: options.from || `"Amize" <${process.env.EMAIL_FROM}>`,
//             to: "tomsteve187@gmail.com",
//             subject: options.subject,
//             text: options.text,
//             html: options.html,
//         };

//         // Add CC if provided
//         if (options.cc) {
//             mailOptions.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
//         }

//         // Add BCC if provided
//         if (options.bcc) {
//             mailOptions.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
//         }

//         // Add attachments if provided
//         if (options.attachments && options.attachments.length > 0) {
//             mailOptions.attachments = options.attachments;
//         }

//         console.log(`Sending email to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}...`);
//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent successfully:', info.messageId);
//         return info;
//     } catch (error) {
//         console.error('Email sending error:', error);
//         throw error;
//     }
// }

// /**
//  * Generate a random numeric verification code
//  * @param length Length of code (default: 6)
//  * @returns A random numeric code as string
//  */
// export function generateVerificationCode(length: number = 6): string {
//     let code = '';
//     for (let i = 0; i < length; i++) {
//         code += Math.floor(Math.random() * 10).toString();
//     }
//     return code;
// }

// /**
//  * Send a verification code email
//  * @param email Recipient email address
//  * @param firstName User's first name
//  * @param verificationCode The 6-digit verification code
//  */
// export async function sendVerificationCodeEmail(
//     email: string,
//     firstName: string,
//     verificationCode: string
// ): Promise<void> {
//     const content = `
//         <div style="text-align: center; margin-bottom: 32px;">
//             <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ec4899, #ef4444); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
//                 <div style="width: 28px; height: 28px; border: 3px solid white; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
//             </div>
//             <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">Verify Your Email</h2>
//             <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">Almost there! Please verify your email address to get started.</p>
//         </div>

//         <div style="margin-bottom: 32px;">
//             <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
//                 Hello ${firstName || 'there'},
//             </p>
//             <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
//                 Thanks for signing up for Amize! To complete your registration and start creating amazing content, please verify your email address using the code below:
//             </p>
//         </div>

//         <div style="text-align: center; margin: 40px 0;">
//             <div style="background: linear-gradient(135deg, #1f2937, #374151); border: 2px solid #ec4899; border-radius: 16px; padding: 24px; display: inline-block; position: relative; overflow: hidden;">
//                 <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 40%, rgba(236, 72, 153, 0.1) 50%, transparent 60%);"></div>
//                 <div style="position: relative; z-index: 1;">
//                     <p style="margin: 0 0 8px; color: #ec4899; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
//                     <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
//                         ${verificationCode}
//                     </div>
//                 </div>
//             </div>
//         </div>

//         <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; border-left: 4px solid #ec4899;">
//             <p style="margin: 0 0 12px; color: #f59e0b; font-size: 14px; font-weight: 600;">Important Information</p>
//             <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
//                 <li style="margin-bottom: 8px;">This code will expire in 10 minutes</li>
//                 <li style="margin-bottom: 8px;">Use this code only on the Amize platform</li>
//                 <li>If you didn't create an account, you can safely ignore this email</li>
//             </ul>
//         </div>

//         <div style="text-align: center; margin-top: 40px;">
//             <p style="margin: 0 0 16px; color: #9ca3af; font-size: 14px;">
//                 Need help? Contact our support team
//             </p>
//             <a href="mailto:support@amize.com" style="display: inline-block; background: #374151; color: #ec4899; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #4b5563;">
//                 Get Support
//             </a>
//         </div>
//     `;

//     await sendEmail({
//         to: email,
//         subject: 'Verify Your Amize Account',
//         text: `Your Amize verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
//         html: getEmailTemplate(content),
//     });
// }

// /**
//  * Send a password reset code
//  * @param email Recipient email address
//  * @param firstName User's first name
//  * @param resetCode Password reset code
//  */
// export async function sendPasswordResetCodeEmail(
//     email: string,
//     firstName: string,
//     resetCode: string
// ): Promise<void> {
//     const content = `
//         <div style="text-align: center; margin-bottom: 32px;">
//             <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
//                 <div style="width: 28px; height: 28px; border: 3px solid white; border-radius: 4px; position: relative;">
//                     <div style="width: 14px; height: 8px; border: 2px solid white; border-top: none; border-radius: 0 0 2px 2px; position: absolute; top: 8px; left: 5px;"></div>
//                 </div>
//             </div>
//             <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">Reset Your Password</h2>
//             <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">Secure your account with a new password</p>
//         </div>

//         <div style="margin-bottom: 32px;">
//             <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
//                 Hello ${firstName || 'there'},
//             </p>
//             <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
//                 We received a request to reset your Amize account password. Use the verification code below to proceed with your password reset:
//             </p>
//         </div>

//         <div style="text-align: center; margin: 40px 0;">
//             <div style="background: linear-gradient(135deg, #1f2937, #374151); border: 2px solid #ef4444; border-radius: 16px; padding: 24px; display: inline-block; position: relative; overflow: hidden;">
//                 <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 40%, rgba(239, 68, 68, 0.1) 50%, transparent 60%);"></div>
//                 <div style="position: relative; z-index: 1;">
//                     <p style="margin: 0 0 8px; color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Reset Code</p>
//                     <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
//                         ${resetCode}
//                     </div>
//                 </div>
//             </div>
//         </div>

//         <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; border-left: 4px solid #ef4444;">
//             <p style="margin: 0 0 12px; color: #f59e0b; font-size: 14px; font-weight: 600;">Security Notice</p>
//             <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
//                 <li style="margin-bottom: 8px;">This code will expire in 1 hour</li>
//                 <li style="margin-bottom: 8px;">Only use this code on the official Amize platform</li>
//                 <li style="margin-bottom: 8px;">If you didn't request this reset, please ignore this email</li>
//                 <li>Consider enabling two-factor authentication for extra security</li>
//             </ul>
//         </div>

//         <div style="text-align: center; margin-top: 40px;">
//             <p style="margin: 0 0 16px; color: #9ca3af; font-size: 14px;">
//                 Didn't request this? Contact our security team immediately
//             </p>
//             <a href="mailto:security@amize.com" style="display: inline-block; background: #374151; color: #ef4444; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #4b5563;">
//                 Report Security Issue
//             </a>
//         </div>
//     `;

//     await sendEmail({
//         to: email,
//         subject: 'Password Reset Code - Amize',
//         text: `Your Amize password reset code is: ${resetCode}. This code will expire in 1 hour.`,
//         html: getEmailTemplate(content),
//     });
// }

// /**
//  * Send a welcome email to a new user
//  * @param email Recipient email address
//  * @param name User's name
//  */
// export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
//     const content = `
//         <div style="text-align: center; margin-bottom: 40px;">
//             <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
//                 <div style="width: 32px; height: 32px;">
//                     <div style="width: 16px; height: 24px; border: 3px solid white; border-top: none; border-radius: 0 0 16px 16px; margin: 4px auto;"></div>
//                     <div style="width: 8px; height: 8px; background: white; border-radius: 50%; margin: -12px auto 0;"></div>
//                 </div>
//             </div>
//             <h2 style="margin: 0 0 16px; color: white; font-size: 32px; font-weight: 700;">Welcome to Amize!</h2>
//             <p style="margin: 0; color: #d1d5db; font-size: 18px; line-height: 1.6;">Your creative journey starts now</p>
//         </div>

//         <div style="margin-bottom: 40px;">
//             <p style="margin: 0 0 24px; color: #d1d5db; font-size: 18px; line-height: 1.6;">
//                 Hello ${name},
//             </p>
//             <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.8;">
//                 Congratulations! Your Amize account has been successfully verified and you're now part of our amazing community of creators. Get ready to create, share, and discover incredible short-form videos that will captivate audiences worldwide.
//             </p>
//         </div>

//         <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 16px; padding: 32px; margin: 40px 0; text-align: center;">
//             <h3 style="margin: 0 0 24px; color: white; font-size: 24px; font-weight: 700;">What's Next?</h3>
//             <div style="display: grid; gap: 24px;">
//                 <div style="text-align: left;">
//                     <div style="display: flex; align-items: center; margin-bottom: 12px;">
//                         <div style="width: 32px; height: 32px; background: #ec4899; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
//                             <span style="color: white; font-weight: bold; font-size: 16px;">1</span>
//                         </div>
//                         <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Complete Your Profile</h4>
//                     </div>
//                     <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6; margin-left: 48px;">
//                         Add a profile photo, bio, and links to make your profile stand out
//                     </p>
//                 </div>
                
//                 <div style="text-align: left;">
//                     <div style="display: flex; align-items: center; margin-bottom: 12px;">
//                         <div style="width: 32px; height: 32px; background: #8b5cf6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
//                             <span style="color: white; font-weight: bold; font-size: 16px;">2</span>
//                         </div>
//                         <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Create Your First Video</h4>
//                     </div>
//                     <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6; margin-left: 48px;">
//                         Use our powerful editing tools, AI effects, and music library to create something amazing
//                     </p>
//                 </div>
                
//                 <div style="text-align: left;">
//                     <div style="display: flex; align-items: center; margin-bottom: 12px;">
//                         <div style="width: 32px; height: 32px; background: #06b6d4; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
//                             <span style="color: white; font-weight: bold; font-size: 16px;">3</span>
//                         </div>
//                         <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Discover & Connect</h4>
//                     </div>
//                     <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6; margin-left: 48px;">
//                         Follow other creators, like and comment on videos, and build your community
//                     </p>
//                 </div>
//             </div>
//         </div>

//         <div style="text-align: center; margin: 40px 0;">
//             <a href="https://amize.com/create" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #ef4444); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 0 8px 16px;">
//                 Start Creating
//             </a>
//             <a href="https://amize.com/discover" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 0 8px 16px; border: 2px solid #4b5563;">
//                 Explore Videos
//             </a>
//         </div>

//         <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
//             <p style="margin: 0 0 16px; color: #ec4899; font-size: 16px; font-weight: 600;">Need Help Getting Started?</p>
//             <p style="margin: 0 0 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
//                 Check out our creator resources, tutorials, and community guidelines to make the most of your Amize experience.
//             </p>
//             <a href="https://amize.com/help" style="display: inline-block; background: #4b5563; color: #ec4899; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;">
//                 Visit Help Center
//             </a>
//         </div>
//     `;

//     await sendEmail({
//         to: email,
//         subject: 'Welcome to Amize - Let\'s Create Something Amazing!',
//         text: `Hello ${name}, welcome to Amize! Your account has been verified and you're ready to start creating amazing videos. Visit amize.com to get started.`,
//         html: getEmailTemplate(content),
//     });
// }

// /**
//  * Send a notification email
//  * @param email Recipient email address
//  * @param subject Email subject
//  * @param message Notification message
//  */
// export async function sendNotificationEmail(
//     email: string,
//     subject: string,
//     message: string
// ): Promise<void> {
//     const content = `
//         <div style="text-align: center; margin-bottom: 32px;">
//             <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
//                 <div style="width: 24px; height: 24px; border: 3px solid white; border-radius: 50%; position: relative;">
//                     <div style="width: 6px; height: 6px; background: white; border-radius: 50%; position: absolute; top: 6px; left: 6px;"></div>
//                 </div>
//             </div>
//             <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">${subject}</h2>
//         </div>

//         <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 12px; padding: 32px; margin: 32px 0;">
//             <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.8;">
//                 ${message}
//             </p>
//         </div>

//         <div style="text-align: center; margin-top: 40px;">
//             <a href="https://amize.com/notifications" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
//                 View All Notifications
//             </a>
//         </div>
//     `;

//     await sendEmail({
//         to: email,
//         subject: `Amize - ${subject}`,
//         text: message,
//         html: getEmailTemplate(content),
//     });
// }


import nodemailer from 'nodemailer';

// Email options interface (maintaining the same interface for compatibility)
interface EmailOptions {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: any[];
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize Nodemailer transporter
 */
function getTransporter(): nodemailer.Transporter {
    if (!transporter) {
        const smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // Explicitly set to false for port 587
            auth: {
                // --- MODIFICATION START ---
                // Replaced environment variables with the provided credentials.
                user: 'vikrantbhawani2020@gmail.com',
                pass: 'kfcvjpvcsdiixzwh',
                // --- MODIFICATION END ---
            },
        };

        transporter = nodemailer.createTransport(smtpConfig);
    }
    return transporter;
}

/**
 * Base email template with Amize branding
 */
function getEmailTemplate(content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Amize</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: #121212; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%); padding: 32px 40px; text-align: center; position: relative;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)" /></svg>'); opacity: 0.3;"></div>
                <div style="position: relative; z-index: 1;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; margin-bottom: 16px; backdrop-filter: blur(10px);">
                        <div style="width: 24px; height: 24px; background: white; border-radius: 50%;"></div>
                    </div>
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Amize</h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Create, Share & Discover Amazing Videos</p>
                </div>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
                ${content}
            </div>

            <!-- Footer -->
            <div style="background: #1a1a1a; padding: 32px 40px; text-align: center; border-top: 1px solid #2a2a2a;">
                <div style="margin-bottom: 20px;">
                    <a href="https://amize.com" style="color: #ec4899; text-decoration: none; font-weight: 600; margin: 0 16px; font-size: 14px;">Website</a>
                    <a href="https://amize.com/support" style="color: #ec4899; text-decoration: none; font-weight: 600; margin: 0 16px; font-size: 14px;">Support</a>
                    <a href="https://amize.com/privacy" style="color: #ec4899; text-decoration: none; font-weight: 600; margin: 0 16px; font-size: 14px;">Privacy</a>
                </div>
                <div style="margin-bottom: 16px;">
                    <a href="https://twitter.com/amizeapp" style="display: inline-block; width: 40px; height: 40px; background: #2a2a2a; border-radius: 8px; margin: 0 8px; text-decoration: none; line-height: 40px; text-align: center;">
                        <span style="color: #ec4899; font-size: 18px;">𝕏</span>
                    </a>
                    <a href="https://instagram.com/amizeapp" style="display: inline-block; width: 40px; height: 40px; background: #2a2a2a; border-radius: 8px; margin: 0 8px; text-decoration: none; line-height: 40px; text-align: center;">
                        <span style="color: #ec4899; font-size: 18px;">IG</span>
                    </a>
                    <a href="https://tiktok.com/@amizeapp" style="display: inline-block; width: 40px; height: 40px; background: #2a2a2a; border-radius: 8px; margin: 0 8px; text-decoration: none; line-height: 40px; text-align: center;">
                        <span style="color: #ec4899; font-size: 18px;">TT</span>
                    </a>
                </div>
                <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                    © ${new Date().getFullYear()} Amize, Inc. All rights reserved.<br>
                    Made for creators worldwide
                </p>
            </div>
        </div>
        
        <!-- Background decoration -->
        <div style="position: fixed; top: -100px; left: -100px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
        <div style="position: fixed; bottom: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%); pointer-events: none;"></div>
    </body>
    </html>
    `;
}

/**
 * Send an email using Nodemailer
 * @param options Email options (to, subject, text, html, etc.)
 * @returns Promise resolving to the info object from Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<any> {
    try {
        const transporter = getTransporter();

        // Prepare mail options
        const mailOptions: nodemailer.SendMailOptions = {
            // --- MODIFICATION START ---
            // Updated the 'from' address and fixed the 'to' address.
            from: options.from || `"Amize" <vikrantbhawani2020@gmail.com>`,
            to: options.to, // CRITICAL FIX: Sends email to the recipient from options, not a hardcoded address.
            // --- MODIFICATION END ---
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        // Add CC if provided
        if (options.cc) {
            mailOptions.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
        }

        // Add BCC if provided
        if (options.bcc) {
            mailOptions.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
        }

        // Add attachments if provided
        if (options.attachments && options.attachments.length > 0) {
            mailOptions.attachments = options.attachments;
        }

        console.log(`Sending email to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
}

/**
 * Generate a random numeric verification code
 * @param length Length of code (default: 6)
 * @returns A random numeric code as string
 */
export function generateVerificationCode(length: number = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10).toString();
    }
    return code;
}

/**
 * Send a verification code email
 * @param email Recipient email address
 * @param firstName User's first name
 * @param verificationCode The 6-digit verification code
 */
export async function sendVerificationCodeEmail(
    email: string,
    firstName: string,
    verificationCode: string
): Promise<void> {
    const content = `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ec4899, #ef4444); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <div style="width: 28px; height: 28px; border: 3px solid white; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
            </div>
            <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">Verify Your Email</h2>
            <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">Almost there! Please verify your email address to get started.</p>
        </div>

        <div style="margin-bottom: 32px;">
            <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                Hello ${firstName || 'there'},
            </p>
            <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                Thanks for signing up for Amize! To complete your registration and start creating amazing content, please verify your email address using the code below:
            </p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <div style="background: linear-gradient(135deg, #1f2937, #374151); border: 2px solid #ec4899; border-radius: 16px; padding: 24px; display: inline-block; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 40%, rgba(236, 72, 153, 0.1) 50%, transparent 60%);"></div>
                <div style="position: relative; z-index: 1;">
                    <p style="margin: 0 0 8px; color: #ec4899; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
                        ${verificationCode}
                    </div>
                </div>
            </div>
        </div>

        <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; border-left: 4px solid #ec4899;">
            <p style="margin: 0 0 12px; color: #f59e0b; font-size: 14px; font-weight: 600;">Important Information</p>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">This code will expire in 10 minutes</li>
                <li style="margin-bottom: 8px;">Use this code only on the Amize platform</li>
                <li>If you didn't create an account, you can safely ignore this email</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <p style="margin: 0 0 16px; color: #9ca3af; font-size: 14px;">
                Need help? Contact our support team
            </p>
            <a href="mailto:support@amize.com" style="display: inline-block; background: #374151; color: #ec4899; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #4b5563;">
                Get Support
            </a>
        </div>
    `;

    await sendEmail({
        to: email,
        subject: 'Verify Your Amize Account',
        text: `Your Amize verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
        html: getEmailTemplate(content),
    });
}

/**
 * Send a password reset code
 * @param email Recipient email address
 * @param firstName User's first name
 * @param resetCode Password reset code
 */
export async function sendPasswordResetCodeEmail(
    email: string,
    firstName: string,
    resetCode: string
): Promise<void> {
    const content = `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <div style="width: 28px; height: 28px; border: 3px solid white; border-radius: 4px; position: relative;">
                    <div style="width: 14px; height: 8px; border: 2px solid white; border-top: none; border-radius: 0 0 2px 2px; position: absolute; top: 8px; left: 5px;"></div>
                </div>
            </div>
            <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">Reset Your Password</h2>
            <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">Secure your account with a new password</p>
        </div>

        <div style="margin-bottom: 32px;">
            <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                Hello ${firstName || 'there'},
            </p>
            <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                We received a request to reset your Amize account password. Use the verification code below to proceed with your password reset:
            </p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <div style="background: linear-gradient(135deg, #1f2937, #374151); border: 2px solid #ef4444; border-radius: 16px; padding: 24px; display: inline-block; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 40%, rgba(239, 68, 68, 0.1) 50%, transparent 60%);"></div>
                <div style="position: relative; z-index: 1;">
                    <p style="margin: 0 0 8px; color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Reset Code</p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
                        ${resetCode}
                    </div>
                </div>
            </div>
        </div>

        <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 12px; color: #f59e0b; font-size: 14px; font-weight: 600;">Security Notice</p>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">This code will expire in 1 hour</li>
                <li style="margin-bottom: 8px;">Only use this code on the official Amize platform</li>
                <li style="margin-bottom: 8px;">If you didn't request this reset, please ignore this email</li>
                <li>Consider enabling two-factor authentication for extra security</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <p style="margin: 0 0 16px; color: #9ca3af; font-size: 14px;">
                Didn't request this? Contact our security team immediately
            </p>
            <a href="mailto:security@amize.com" style="display: inline-block; background: #374151; color: #ef4444; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #4b5563;">
                Report Security Issue
            </a>
        </div>
    `;

    await sendEmail({
        to: email,
        subject: 'Password Reset Code - Amize',
        text: `Your Amize password reset code is: ${resetCode}. This code will expire in 1 hour.`,
        html: getEmailTemplate(content),
    });
}

/**
 * Send a welcome email to a new user
 * @param email Recipient email address
 * @param name User's name
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
    const content = `
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <div style="width: 32px; height: 32px;">
                    <div style="width: 16px; height: 24px; border: 3px solid white; border-top: none; border-radius: 0 0 16px 16px; margin: 4px auto;"></div>
                    <div style="width: 8px; height: 8px; background: white; border-radius: 50%; margin: -12px auto 0;"></div>
                </div>
            </div>
            <h2 style="margin: 0 0 16px; color: white; font-size: 32px; font-weight: 700;">Welcome to Amize!</h2>
            <p style="margin: 0; color: #d1d5db; font-size: 18px; line-height: 1.6;">Your creative journey starts now</p>
        </div>

        <div style="margin-bottom: 40px;">
            <p style="margin: 0 0 24px; color: #d1d5db; font-size: 18px; line-height: 1.6;">
                Hello ${name},
            </p>
            <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.8;">
                Congratulations! Your Amize account has been successfully verified and you're now part of our amazing community of creators. Get ready to create, share, and discover incredible short-form videos that will captivate audiences worldwide.
            </p>
        </div>

        <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 16px; padding: 32px; margin: 40px 0; text-align: center;">
            <h3 style="margin: 0 0 24px; color: white; font-size: 24px; font-weight: 700;">What's Next?</h3>
            <div style="display: grid; gap: 24px;">
                <div style="text-align: left;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <div style="width: 32px; height: 32px; background: #ec4899; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                            <span style="color: white; font-weight: bold; font-size: 16px;">1</span>
                        </div>
                        <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Complete Your Profile</h4>
                    </div>
                    <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6; margin-left: 48px;">
                        Add a profile photo, bio, and links to make your profile stand out
                    </p>
                </div>
                
                <div style="text-align: left;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <div style="width: 32px; height: 32px; background: #8b5cf6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                            <span style="color: white; font-weight: bold; font-size: 16px;">2</span>
                        </div>
                        <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Create Your First Video</h4>
                    </div>
                    <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6; margin-left: 48px;">
                        Use our powerful editing tools, AI effects, and music library to create something amazing
                    </p>
                </div>
                
                <div style="text-align: left;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <div style="width: 32px; height: 32px; background: #06b6d4; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                            <span style="color: white; font-weight: bold; font-size: 16px;">3</span>
                        </div>
                        <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Discover & Connect</h4>
                    </div>
                    <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6; margin-left: 48px;">
                        Follow other creators, like and comment on videos, and build your community
                    </p>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://amize.com/create" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #ef4444); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; margin: 0 8px 16px;">
                Start Creating
            </a>
            <a href="https://amize.com/discover" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 0 8px 16px; border: 2px solid #4b5563;">
                Explore Videos
            </a>
        </div>

        <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
            <p style="margin: 0 0 16px; color: #ec4899; font-size: 16px; font-weight: 600;">Need Help Getting Started?</p>
            <p style="margin: 0 0 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                Check out our creator resources, tutorials, and community guidelines to make the most of your Amize experience.
            </p>
            <a href="https://amize.com/help" style="display: inline-block; background: #4b5563; color: #ec4899; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Visit Help Center
            </a>
        </div>
    `;

    await sendEmail({
        to: email,
        subject: 'Welcome to Amize - Let\'s Create Something Amazing!',
        text: `Hello ${name}, welcome to Amize! Your account has been verified and you're ready to start creating amazing videos. Visit amize.com to get started.`,
        html: getEmailTemplate(content),
    });
}

/**
 * Send a notification email
 * @param email Recipient email address
 * @param subject Email subject
 * @param message Notification message
 */
export async function sendNotificationEmail(
    email: string,
    subject: string,
    message: string
): Promise<void> {
    const content = `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <div style="width: 24px; height: 24px; border: 3px solid white; border-radius: 50%; position: relative;">
                    <div style="width: 6px; height: 6px; background: white; border-radius: 50%; position: absolute; top: 6px; left: 6px;"></div>
                </div>
            </div>
            <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">${subject}</h2>
        </div>

        <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 12px; padding: 32px; margin: 32px 0;">
            <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.8;">
                ${message}
            </p>
        </div>

        <div style="text-align: center; margin-top: 40px;">
            <a href="https://amize.com/notifications" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                View All Notifications
            </a>
        </div>
    `;

    await sendEmail({
        to: email,
        subject: `Amize - ${subject}`,
        text: message,
        html: getEmailTemplate(content),
    });
}