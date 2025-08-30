const fs = require('fs');
const path = require('path');

class ImageLogger {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logDir, 'image-operations.log');
        this.logFileAvailable = false;
        
        // Create logs directory if it doesn't exist
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            this.logFileAvailable = true;
        } catch (error) {
            console.warn('Unable to create logs directory, logging to console only:', error.message);
            this.logFileAvailable = false;
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
        
        // In production, always log to file if available
        if (process.env.NODE_ENV === 'production' && this.logFileAvailable) {
            try {
                fs.appendFileSync(this.logFile, logLine);
            } catch (error) {
                console.error('Failed to write to image log file:', error);
                this.logFileAvailable = false; // Disable file logging if it fails
            }
        }
        
        // Also log to console in development or if file logging is not available
        if (process.env.NODE_ENV !== 'production' || !this.logFileAvailable) {
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
