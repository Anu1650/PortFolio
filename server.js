// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve all files from current directory

// Serve your portfolio HTML file as homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        console.log('📧 Contact form submission received:', { name, email, subject });

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if email is configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.log('Email not configured, simulating success');
            
            return res.json({
                success: true,
                message: 'Thank you for your message! I will get back to you soon. (Demo mode)',
                demo: true
            });
        }

        // Create email transporter
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Email to portfolio owner
        const ownerMailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER,
            subject: `Portfolio Contact: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        // Send email
        await transporter.sendMail(ownerMailOptions);

        console.log(`✅ Email sent successfully for: ${name}`);

        res.json({
            success: true,
            message: 'Thank you for your message! I will get back to you soon.'
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Resume Download Endpoint
app.get('/download-resume', (req, res) => {
    try {
        const resumeFileName = 'Aniket Ressume.docx';
        const resumePath = path.join(__dirname, resumeFileName);
        
        console.log('📄 Resume download requested');
        console.log('📍 Looking for file:', resumePath);

        // Check if file exists
        if (!fs.existsSync(resumePath)) {
            console.log('❌ Resume file not found:', resumeFileName);
            return res.status(404).json({
                success: false,
                message: 'Resume file not found'
            });
        }

        console.log('✅ Resume file found, initiating download...');

        // Set headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="Aniket_Igade_Resume.docx"`);
        res.setHeader('Content-Length', fs.statSync(resumePath).size);
        
        // Stream the file
        const fileStream = fs.createReadStream(resumePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
            console.error('❌ Error streaming resume file:', error);
            res.status(500).json({
                success: false,
                message: 'Error downloading resume'
            });
        });

        fileStream.on('end', () => {
            console.log('✅ Resume download completed successfully');
        });

    } catch (error) {
        console.error('❌ Resume download error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download resume'
        });
    }
});

// Alternative resume download endpoint (simple version)
app.get('/api/resume', (req, res) => {
    try {
        const resumePath = path.join(__dirname, 'Aniket Ressume.docx');
        
        if (!fs.existsSync(resumePath)) {
            return res.status(404).json({
                success: false,
                message: 'Resume file not found'
            });
        }

        res.download(resumePath, 'Aniket_Igade_Resume.docx', (err) => {
            if (err) {
                console.error('❌ Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error downloading resume'
                    });
                }
            } else {
                console.log('✅ Resume downloaded successfully');
            }
        });

    } catch (error) {
        console.error('❌ Resume endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        services: {
            contact: 'active',
            resume_download: 'active',
            static_files: 'active'
        }
    });
});

// File existence check endpoint (for debugging)
app.get('/api/check-files', (req, res) => {
    const files = [
        'index2.html',
        'Aniket Ressume.docx',
        'Pt.jpg',
        'server.js',
        'package.json'
    ];

    const fileStatus = files.map(file => {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        return {
            file: file,
            exists: exists,
            path: filePath
        };
    });

    res.json({
        success: true,
        files: fileStatus
    });
});

// Start server
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 Portfolio Server Started');
    console.log('=================================');
    console.log(`📍 Serving: index2.html`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`📧 Contact API: POST http://localhost:${PORT}/api/contact`);
    console.log(`📄 Resume Download: GET http://localhost:${PORT}/download-resume`);
    console.log('=================================');
    
    // Check if resume file exists on startup
    const resumePath = path.join(__dirname, 'Aniket Ressume.docx');
    if (fs.existsSync(resumePath)) {
        console.log('✅ Resume file found: Aniket Ressume.docx');
    } else {
        console.log('❌ Resume file NOT found: Aniket Ressume.docx');
        console.log('💡 Please ensure the resume file is in the same directory as server.js');
    }
});