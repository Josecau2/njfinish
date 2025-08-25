const fs = require('fs');
const path = require('path');

class ImageLogger {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logDir, 'image-operations.log');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(operation, details) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            operation,
            details,
            environment: process.env.NODE_ENV || 'development'
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        // In production, always log to file
        if (process.env.NODE_ENV === 'production') {
            try {
                fs.appendFileSync(this.logFile, logLine);
            } catch (error) {
                console.error('Failed to write to image log file:', error);
            }
        }
        
        // Also log to console in development or if file logging fails
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[IMAGE] ${operation}:`, details);
        }
    }

    logUpload(filename, fieldname, size, manufacturerId = null) {
        this.log('UPLOAD', {
            filename,
            fieldname,
            size,
            manufacturerId,
            sizeKB: Math.round(size / 1024)
        });
    }

    logDelete(filename, manufacturerId = null, success = true, error = null) {
        this.log('DELETE', {
            filename,
            manufacturerId,
            success,
            error: error?.message
        });
    }

    logAccess(filename, userAgent = null, success = true) {
        this.log('ACCESS', {
            filename,
            userAgent,
            success
        });
    }

    logError(operation, error, context = {}) {
        this.log('ERROR', {
            operation,
            error: error.message,
            stack: error.stack,
            context
        });
    }
}

module.exports = new ImageLogger();
