#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

class ComprehensiveErrorChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.stats = {
            totalFiles: 0,
            errorFiles: 0,
            warningFiles: 0,
            syntaxErrors: 0,
            importErrors: 0,
            lintErrors: 0,
            typeErrors: 0
        };
        this.excludePaths = [
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            'coverage',
            '.nyc_output',
            '.vscode',
            '.claude',
            '__pycache__',
            '*.log',
            '*.min.js',
            '*.map'
        ];
    }

    async findAllFiles(dir = './frontend/src', extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss']) {
        const files = [];

        try {
            const items = await fs.readdir(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);

                // Skip excluded paths
                if (this.excludePaths.some(exclude =>
                    fullPath.includes(exclude) || item.startsWith('.') && item !== '.eslintrc'
                )) {
                    continue;
                }

                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    const subFiles = await this.findAllFiles(fullPath, extensions);
                    files.push(...subFiles);
                } else if (extensions.some(ext => fullPath.endsWith(ext))) {
                    files.push(fullPath);
                    this.stats.totalFiles++;
                }
            }
        } catch (error) {
            this.addError('DIRECTORY_ACCESS', dir, 0, 0, `Cannot access directory: ${error.message}`);
        }

        return files;
    }

    addError(type, file, line, column, message, severity = 'error') {
        const errorObj = {
            type,
            file: path.relative(process.cwd(), file),
            line,
            column,
            message,
            severity,
            timestamp: new Date().toISOString()
        };

        if (severity === 'error') {
            this.errors.push(errorObj);
            this.stats.errorFiles++;
        } else {
            this.warnings.push(errorObj);
            this.stats.warningFiles++;
        }
    }

    async checkSyntaxErrors(files) {
        console.log('🔍 Checking syntax errors...');

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');

                if (file.endsWith('.js') || file.endsWith('.jsx')) {
                    await this.checkJavaScriptSyntax(file, content);
                } else if (file.endsWith('.json')) {
                    await this.checkJsonSyntax(file, content);
                } else if (file.endsWith('.css') || file.endsWith('.scss')) {
                    await this.checkCssSyntax(file, content);
                }
            } catch (error) {
                this.addError('FILE_READ', file, 0, 0, `Cannot read file: ${error.message}`);
            }
        }
    }

    async checkJavaScriptSyntax(file, content) {
        // Check for common syntax issues
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Check for unclosed brackets/braces
            const openBrackets = (line.match(/\[/g) || []).length;
            const closeBrackets = (line.match(/\]/g) || []).length;
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;

            // Check for missing semicolons (basic check)
            // Project style prefers no-semicolons in JSX/TSX; skip this heuristic for those files
            const isJsxTsx = file.endsWith('.jsx') || file.endsWith('.tsx');
            if (!isJsxTsx && line.trim().match(/^(var|let|const|return|throw)\s.*[^;{}\s]$/)) {
                this.addError('SYNTAX_ERROR', file, lineNum, line.length, 'Missing semicolon', 'warning');
            }

            // Check for incorrect JSX syntax
            if (file.endsWith('.jsx')) {
                // Check for class instead of className
                if (line.includes(' class=')) {
                    const col = line.indexOf(' class=') + 1;
                    this.addError('JSX_ERROR', file, lineNum, col, 'Use className instead of class in JSX');
                }

                // Check for unclosed JSX tags
                const jsxTagPattern = /<[A-Z][a-zA-Z0-9]*(?:\s[^>]*)?(?:\/?>|>)/g;
                const jsxMatches = line.match(jsxTagPattern);
                if (jsxMatches) {
                    jsxMatches.forEach(match => {
                        if (!match.endsWith('/>') && !match.includes('</')) {
                            // This is a potential unclosed tag
                            const col = line.indexOf(match);
                            this.addError('JSX_ERROR', file, lineNum, col, 'Potential unclosed JSX tag', 'warning');
                        }
                    });
                }
            }

            // Check for console statements (should be warnings in production)
            if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
                const col = line.indexOf('console');
                this.addError('CONSOLE_STATEMENT', file, lineNum, col, 'Console statement found - consider removing for production', 'warning');
            }

            // Check for TODO/FIXME comments
            if (line.includes('TODO') || line.includes('FIXME') || line.includes('BUG')) {
                const col = Math.max(line.indexOf('TODO'), line.indexOf('FIXME'), line.indexOf('BUG'));
                this.addError('TODO_COMMENT', file, lineNum, col, 'Unresolved TODO/FIXME comment', 'warning');
            }
        }

        // Try to parse with a simple syntax checker
        try {
            // This is a basic check - in a real scenario you'd use babel or esprima
            const hasBasicSyntaxIssues = this.checkBasicJSSyntax(content);
            if (hasBasicSyntaxIssues.length > 0) {
                hasBasicSyntaxIssues.forEach(issue => {
                    this.addError('SYNTAX_ERROR', file, issue.line, issue.column, issue.message);
                    this.stats.syntaxErrors++;
                });
            }
        } catch (error) {
            this.addError('SYNTAX_ERROR', file, 0, 0, `Syntax parsing error: ${error.message}`);
            this.stats.syntaxErrors++;
        }
    }

    checkBasicJSSyntax(content) {
        const issues = [];
        const lines = content.split('\n');

        let braceCount = 0;
        let bracketCount = 0;
        let parenCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Count brackets, braces, and parentheses
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                switch (char) {
                    case '{': braceCount++; break;
                    case '}': braceCount--; break;
                    case '[': bracketCount++; break;
                    case ']': bracketCount--; break;
                    case '(': parenCount++; break;
                    case ')': parenCount--; break;
                }

                // Check for negative counts (closing before opening)
                if (braceCount < 0) {
                    issues.push({ line: lineNum, column: j, message: 'Unexpected closing brace' });
                    braceCount = 0; // Reset to continue checking
                }
                if (bracketCount < 0) {
                    issues.push({ line: lineNum, column: j, message: 'Unexpected closing bracket' });
                    bracketCount = 0;
                }
                if (parenCount < 0) {
                    issues.push({ line: lineNum, column: j, message: 'Unexpected closing parenthesis' });
                    parenCount = 0;
                }
            }
        }

        // Check for unclosed brackets at end
        if (braceCount > 0) {
            issues.push({ line: lines.length, column: 0, message: `${braceCount} unclosed brace(s)` });
        }
        if (bracketCount > 0) {
            issues.push({ line: lines.length, column: 0, message: `${bracketCount} unclosed bracket(s)` });
        }
        if (parenCount > 0) {
            issues.push({ line: lines.length, column: 0, message: `${parenCount} unclosed parenthesis(es)` });
        }

        return issues;
    }

    async checkJsonSyntax(file, content) {
        try {
            JSON.parse(content);
        } catch (error) {
            // Extract line number from error message if possible
            const lineMatch = error.message.match(/line (\d+)/);
            const line = lineMatch ? parseInt(lineMatch[1]) : 0;

            this.addError('JSON_SYNTAX', file, line, 0, `JSON syntax error: ${error.message}`);
            this.stats.syntaxErrors++;
        }
    }

    async checkCssSyntax(file, content) {
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;

            // Basic CSS syntax checks
            if (line && !line.startsWith('/*') && !line.endsWith('*/') && !line.startsWith('//')) {
                // Check for missing semicolons in property declarations
                if (line.includes(':') && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && line !== '') {
                    this.addError('CSS_SYNTAX', file, lineNum, line.length, 'Missing semicolon in CSS property', 'warning');
                }

                // Check for unclosed braces (basic)
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                if (openBraces !== closeBraces && (openBraces > 0 || closeBraces > 0)) {
                    this.addError('CSS_SYNTAX', file, lineNum, 0, 'Potential unmatched CSS braces', 'warning');
                }
            }
        }
    }

    async checkImportErrors(files) {
        console.log('📦 Checking import/export errors...');

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                await this.checkImportsInFile(file, content);
            } catch (error) {
                this.addError('FILE_READ', file, 0, 0, `Cannot read file: ${error.message}`);
            }
        }
    }

    async checkImportsInFile(file, content) {
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;

            // Check import statements
            if (line.startsWith('import ')) {
                // Check for missing file extensions
                const fromMatch = line.match(/from\s+['"`]([^'"`]+)['"`]/);
                if (fromMatch) {
                    const importPath = fromMatch[1];

                    // Check if it's a relative import without extension
                    if (importPath.startsWith('./') || importPath.startsWith('../')) {
                        if (!importPath.includes('.')) {
                            this.addError('IMPORT_ERROR', file, lineNum, line.indexOf(importPath),
                                'Relative import missing file extension', 'warning');
                        }
                    }

                    // Check for potentially missing files (basic check)
                    if (importPath.startsWith('./') || importPath.startsWith('../')) {
                        const resolvedPath = path.resolve(path.dirname(file), importPath);
                        const possibleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

                        let found = false;
                        for (const ext of possibleExtensions) {
                            try {
                                await fs.access(resolvedPath + ext);
                                found = true;
                                break;
                            } catch {}
                        }

                        if (!found) {
                            try {
                                await fs.access(resolvedPath);
                                found = true;
                            } catch {}
                        }

                        if (!found) {
                            this.addError('IMPORT_ERROR', file, lineNum, line.indexOf(importPath),
                                `Import file not found: ${importPath}`, 'error');
                            this.stats.importErrors++;
                        }
                    }
                }

                // Check for circular imports (basic detection)
                const circularPattern = /from\s+['"`]\.\//;
                if (circularPattern.test(line)) {
                    // This is a simplified check - real circular import detection is more complex
                    this.addError('IMPORT_WARNING', file, lineNum, 0,
                        'Potential circular import - verify dependency chain', 'warning');
                }
            }

            // Check require statements
            if (line.includes('require(')) {
                const requireMatch = line.match(/require\(['"`]([^'"`]+)['"`]\)/);
                if (requireMatch) {
                    const requirePath = requireMatch[1];
                    if (requirePath.startsWith('./') || requirePath.startsWith('../')) {
                        // Similar checks as imports
                        this.addError('REQUIRE_WARNING', file, lineNum, line.indexOf('require'),
                            'Using require() instead of ES6 imports', 'warning');
                    }
                }
            }
        }
    }

    async runESLint(files) {
        console.log('🔧 Running ESLint checks...');

        try {
            const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
            if (jsFiles.length === 0) return;

            // Check if ESLint config exists
            const eslintConfigExists = await this.fileExists('./frontend/.eslintrc.js') ||
                                     await this.fileExists('./frontend/.eslintrc.json') ||
                                     await this.fileExists('./frontend/eslint.config.mjs');

            if (!eslintConfigExists) {
                this.addError('ESLINT_CONFIG', './frontend', 0, 0, 'ESLint configuration file not found', 'warning');
                return;
            }

            // Run ESLint on a sample of files (to avoid overwhelming output)
            const sampleFiles = jsFiles.slice(0, 10);

            for (const file of sampleFiles) {
                try {
                    const result = execSync(`npx eslint "${file}" --format json`, {
                        cwd: './frontend',
                        encoding: 'utf8',
                        timeout: 10000
                    });

                    const lintResults = JSON.parse(result);

                    lintResults.forEach(result => {
                        result.messages.forEach(message => {
                            const severity = message.severity === 2 ? 'error' : 'warning';
                            this.addError('ESLINT', result.filePath, message.line, message.column,
                                `${message.ruleId}: ${message.message}`, severity);

                            if (severity === 'error') {
                                this.stats.lintErrors++;
                            }
                        });
                    });
                } catch (error) {
                    if (error.stdout) {
                        try {
                            const lintResults = JSON.parse(error.stdout);
                            lintResults.forEach(result => {
                                result.messages.forEach(message => {
                                    const severity = message.severity === 2 ? 'error' : 'warning';
                                    this.addError('ESLINT', result.filePath, message.line, message.column,
                                        `${message.ruleId}: ${message.message}`, severity);
                                });
                            });
                        } catch (parseError) {
                            this.addError('ESLINT_ERROR', file, 0, 0, `ESLint error: ${error.message}`, 'warning');
                        }
                    }
                }
            }
        } catch (error) {
            this.addError('ESLINT_SETUP', './frontend', 0, 0, `ESLint setup error: ${error.message}`, 'warning');
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async generateMarkdownReport() {
        console.log('📝 Generating markdown report...');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(process.cwd(), `error-report-${timestamp.split('T')[0]}.md`);

        let markdown = `# Comprehensive Error Report\n\n`;
        markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
        markdown += `**Project:** NJ Cabinets Frontend\n`;
        markdown += `**Branch:** ${await this.getCurrentBranch()}\n\n`;

        // Stats summary
        markdown += `## 📊 Summary Statistics\n\n`;
        markdown += `| Metric | Count |\n`;
        markdown += `|--------|-------|\n`;
        markdown += `| Total Files Scanned | ${this.stats.totalFiles} |\n`;
        markdown += `| Files with Errors | ${this.stats.errorFiles} |\n`;
        markdown += `| Files with Warnings | ${this.stats.warningFiles} |\n`;
        markdown += `| Syntax Errors | ${this.stats.syntaxErrors} |\n`;
        markdown += `| Import Errors | ${this.stats.importErrors} |\n`;
        markdown += `| Lint Errors | ${this.stats.lintErrors} |\n`;
        markdown += `| Total Errors | ${this.errors.length} |\n`;
        markdown += `| Total Warnings | ${this.warnings.length} |\n\n`;

        // Error breakdown by type
        const errorsByType = this.groupByType([...this.errors, ...this.warnings]);
        markdown += `## 🔍 Error Breakdown by Type\n\n`;
        Object.keys(errorsByType).forEach(type => {
            markdown += `### ${type.replace(/_/g, ' ')} (${errorsByType[type].length})\n\n`;

            errorsByType[type].forEach((error, index) => {
                const icon = error.severity === 'error' ? '🚫' : '⚠️';
                markdown += `${icon} **${error.file}:${error.line}:${error.column}**\n`;
                markdown += `   ${error.message}\n\n`;

                if (index >= 20) { // Limit to first 20 per type
                    const remaining = errorsByType[type].length - 20;
                    if (remaining > 0) {
                        markdown += `   ... and ${remaining} more similar issues\n\n`;
                    }
                    return;
                }
            });
        });

        // Files with most errors
        const fileErrorCounts = this.getFileErrorCounts();
        if (fileErrorCounts.length > 0) {
            markdown += `## 📁 Files with Most Issues\n\n`;
            markdown += `| File | Errors | Warnings | Total |\n`;
            markdown += `|------|--------|----------|-------|\n`;

            fileErrorCounts.slice(0, 15).forEach(file => {
                markdown += `| ${file.name} | ${file.errors} | ${file.warnings} | ${file.total} |\n`;
            });
            markdown += `\n`;
        }

        // Recommended fixes
        markdown += `## 🔧 Recommended Immediate Actions\n\n`;

        const criticalErrors = this.errors.filter(e =>
            e.type.includes('SYNTAX') || e.type.includes('IMPORT_ERROR')
        );

        if (criticalErrors.length > 0) {
            markdown += `### Critical Issues (${criticalErrors.length})\n`;
            markdown += `These issues may prevent the application from running:\n\n`;

            criticalErrors.slice(0, 10).forEach(error => {
                markdown += `- **${error.file}:${error.line}** - ${error.message}\n`;
            });
            markdown += `\n`;
        }

        // Quick wins
        const quickWins = this.warnings.filter(w =>
            w.type.includes('CONSOLE') || w.type.includes('TODO')
        );

        if (quickWins.length > 0) {
            markdown += `### Quick Wins (${quickWins.length})\n`;
            markdown += `These can be easily fixed to clean up the codebase:\n\n`;

            quickWins.slice(0, 10).forEach(warning => {
                markdown += `- **${warning.file}:${warning.line}** - ${warning.message}\n`;
            });
            markdown += `\n`;
        }

        // Action items
        markdown += `## ✅ Suggested Action Plan\n\n`;
        markdown += `1. **Fix Critical Errors First**\n`;
        markdown += `   - Focus on syntax errors and missing imports\n`;
        markdown += `   - These prevent the application from building/running\n\n`;

        markdown += `2. **Address Import Issues**\n`;
        markdown += `   - Verify all import paths are correct\n`;
        markdown += `   - Add missing file extensions where needed\n\n`;

        markdown += `3. **Clean Up Warnings**\n`;
        markdown += `   - Remove console statements\n`;
        markdown += `   - Address TODO/FIXME comments\n`;
        markdown += `   - Fix CSS syntax issues\n\n`;

        markdown += `4. **Run Automated Tools**\n`;
        markdown += `   - Use ESLint with --fix flag\n`;
        markdown += `   - Run Prettier for formatting\n`;
        markdown += `   - Consider using automated refactoring tools\n\n`;

        markdown += `---\n`;
        markdown += `*Report generated by Comprehensive Error Checker*\n`;
        markdown += `*Run this script regularly to maintain code quality*\n`;

        await fs.writeFile(reportPath, markdown, 'utf8');
        return reportPath;
    }

    groupByType(allIssues) {
        return allIssues.reduce((groups, issue) => {
            if (!groups[issue.type]) {
                groups[issue.type] = [];
            }
            groups[issue.type].push(issue);
            return groups;
        }, {});
    }

    getFileErrorCounts() {
        const fileCounts = {};

        [...this.errors, ...this.warnings].forEach(issue => {
            if (!fileCounts[issue.file]) {
                fileCounts[issue.file] = { errors: 0, warnings: 0, total: 0 };
            }

            if (issue.severity === 'error') {
                fileCounts[issue.file].errors++;
            } else {
                fileCounts[issue.file].warnings++;
            }
            fileCounts[issue.file].total++;
        });

        return Object.keys(fileCounts)
            .map(file => ({
                name: file,
                errors: fileCounts[file].errors,
                warnings: fileCounts[file].warnings,
                total: fileCounts[file].total
            }))
            .sort((a, b) => b.total - a.total);
    }

    async getCurrentBranch() {
        try {
            return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        } catch {
            return 'unknown';
        }
    }

    async run() {
        console.log('🚀 Starting Comprehensive Error Check...\n');

        const startTime = Date.now();

        // Find all files in multiple directories
        const directories = [
            './frontend/src',
            './controllers',
            './models',
            './routes',
            './services',
            './middleware',
            './utils',
            './config',
            './scripts',
            './migrations',
            './seeders',
            './server'
        ];

        let allFiles = [];
        for (const dir of directories) {
            try {
                const files = await this.findAllFiles(dir);
                allFiles.push(...files);
            } catch (error) {
                console.log(`⚠️  Could not scan ${dir}: ${error.message}`);
            }
        }

        console.log(`📁 Found ${allFiles.length} files to analyze\n`);

        // Run all checks
        await this.checkSyntaxErrors(allFiles);
        await this.checkImportErrors(allFiles);
        await this.runESLint(allFiles);

        // Generate report
        const reportPath = await this.generateMarkdownReport();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n✅ Analysis Complete!');
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`🚫 Total Errors: ${this.errors.length}`);
        console.log(`⚠️  Total Warnings: ${this.warnings.length}`);
        console.log(`📊 Report saved to: ${reportPath}\n`);

        return {
            errors: this.errors,
            warnings: this.warnings,
            stats: this.stats,
            reportPath
        };
    }
}

// Run the checker if called directly
if (require.main === module) {
    const checker = new ComprehensiveErrorChecker();
    checker.run().catch(console.error);
}

module.exports = ComprehensiveErrorChecker;