# PowerShell script to add dark mode and rounded corners to modal preview files

$darkModeCSS = @'

        body.dark-mode {
            background: #1a1a1a;
            color: #e5e5e5;
        }

        body.dark-mode .modal-section {
            background: #2d2d2d;
        }

        body.dark-mode .modal-desktop,
        body.dark-mode .modal-mobile {
            background: #2d2d2d;
        }

        body.dark-mode .modal-title {
            color: #fff;
        }

        body.dark-mode .modal-meta {
            color: #a0a0a0;
        }

        body.dark-mode .device-frame {
            background: #1a1a1a;
        }

        body.dark-mode .form-input,
        body.dark-mode .form-select,
        body.dark-mode .form-textarea,
        body.dark-mode .number-input {
            background: #3d3d3d;
            border-color: #4a4a4a;
            color: #e5e5e5;
        }

        body.dark-mode .form-label {
            color: #e5e5e5;
        }

        body.dark-mode .info-box {
            background: #2d2d2d;
            border-color: #4a4a4a;
        }

        body.dark-mode .info-label,
        body.dark-mode .info-value {
            color: #e5e5e5;
        }

        body.dark-mode .view-wrapper {
            border-color: #4a4a4a;
        }

        body.dark-mode .modal-footer {
            border-color: #4a4a4a;
        }

        body.dark-mode .warning-box {
            background: #3d3d3d;
            border-color: #fbbf24;
        }

        body.dark-mode .category-card,
        body.dark-mode .template-card {
            background: #3d3d3d;
            border-color: #4a4a4a;
        }

        body.dark-mode .item-row,
        body.dark-mode .checkbox-list {
            background: #3d3d3d;
            border-color: #4a4a4a;
        }

        body.dark-mode .file-upload,
        body.dark-mode .file-upload-area {
            border-color: #4a4a4a;
            color: #a0a0a0;
        }

        .dark-mode-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 12px;
            background: white;
            padding: 12px 20px;
            border-radius: 25px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            transition: all 0.3s;
        }

        .dark-mode-toggle:hover {
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }

        body.dark-mode .dark-mode-toggle {
            background: #2d2d2d;
            color: #e5e5e5;
        }

        .toggle-switch {
            position: relative;
            width: 48px;
            height: 26px;
            background: #cbd5e0;
            border-radius: 13px;
            transition: background 0.3s;
        }

        body.dark-mode .toggle-switch {
            background: #2563eb;
        }

        .toggle-thumb {
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }

        body.dark-mode .toggle-thumb {
            transform: translateX(22px);
        }
'@

$darkModeHTML = @'

    <!-- Dark Mode Toggle -->
    <div class="dark-mode-toggle" onclick="toggleDarkMode()">
        <span id="modeText">🌙 Dark Mode</span>
        <div class="toggle-switch">
            <div class="toggle-thumb"></div>
        </div>
    </div>

    <script>
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('modeText').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
            localStorage.setItem('darkMode', isDark);
        }

        // Load saved preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            document.getElementById('modeText').textContent = '☀️ Light Mode';
        }
    </script>
'@

$files = @(
    "modals-preview-3-manufacturer-settings.html",
    "modals-preview-4-catalog-management.html",
    "modals-preview-5-misc.html",
    "modals-preview-6-other-actions.html"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw

    # Add transition to body
    $content = $content -replace '(body \{[^}]*padding: 20px;)', '$1
            transition: background-color 0.3s, color 0.3s;'

    # Add dark mode CSS after body styles
    $content = $content -replace '(\s+\.preview-container)', "$darkModeCSS`n`$1"

    # Add rounded corners to mobile modals
    $content = $content -replace '(\.modal-mobile \{[^}]*flex-direction: column;)', '$1
            border-radius: 12px;
            overflow: hidden;'

    # Add dark mode toggle before </body>
    $content = $content -replace '</body>', "$darkModeHTML</body>"

    Set-Content $file $content
    Write-Host "Updated $file" -ForegroundColor Green
}

Write-Host "All files updated successfully!" -ForegroundColor Cyan
