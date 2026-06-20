/* ==========================================================================
   EMI Calculator - Premium Logic Sheet
   Author: Shreyansh Singh
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. DOM Elements
    const elements = {
        // Form & Inputs
        form: document.getElementById('emiForm'),
        loanAmountSlider: document.getElementById('loanAmount'),
        loanAmountText: document.getElementById('loanAmountText'),
        interestRateSlider: document.getElementById('interestRate'),
        interestRateText: document.getElementById('interestRateText'),
        loanTenureSlider: document.getElementById('loanTenure'),
        loanTenureText: document.getElementById('loanTenureText'),
        
        // Errors
        loanAmountError: document.getElementById('loanAmountError'),
        interestRateError: document.getElementById('interestRateError'),
        loanTenureError: document.getElementById('loanTenureError'),
        
        // Buttons
        resetBtn: document.getElementById('resetBtn'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        copyBtn: document.getElementById('copyBtn'),
        downloadPdfBtn: document.getElementById('downloadPdfBtn'),
        
        // Calculation Results
        monthlyEmiVal: document.getElementById('monthlyEmiVal'),
        totalInterestVal: document.getElementById('totalInterestVal'),
        totalAmountVal: document.getElementById('totalAmountVal'),
        
        // Chart Info
        chartPrincipalText: document.getElementById('chartPrincipalText'),
        chartInterestText: document.getElementById('chartInterestText'),
        chartTotalText: document.getElementById('chartTotalText'),
        
        // Amortization Schedule
        tableHeaderToggle: document.getElementById('tableHeaderToggle'),
        toggleChevron: document.getElementById('toggleChevron'),
        amortizationBody: document.getElementById('amortizationBody'),
        scheduleTableBody: document.getElementById('scheduleTableBody'),
        searchMonth: document.getElementById('searchMonth'),
        summaryMonths: document.getElementById('summaryMonths'),
        
        // Toast
        toast: document.getElementById('toast'),
        toastMsg: document.getElementById('toastMsg')
    };

    // 3. State Variables
    let emiChartInstance = null;
    let calculationResults = {
        principal: 1000000,
        rate: 8.5,
        tenureYears: 15,
        monthlyEmi: 0,
        totalInterest: 0,
        totalPayment: 0,
        schedule: []
    };

    // Limit Constants
    const LIMITS = {
        amount: { min: 10000, max: 100000000, default: 1000000 },
        rate: { min: 1, max: 30, default: 8.5 },
        tenure: { min: 1, max: 40, default: 15 }
    };

    // 4. Formatting Utilities
    
    // Parse input string, stripping commas
    function parseCleanFloat(str) {
        if (!str) return NaN;
        return parseFloat(str.replace(/,/g, '').trim());
    }

    // Format number to Indian format (without currency symbol)
    function formatIndianNumber(num) {
        if (isNaN(num) || num === null) return '0';
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(Math.round(num));
    }

    // Format to Indian currency (with ₹ symbol)
    function formatRupee(num) {
        return '₹' + formatIndianNumber(num);
    }

    // Format to Indian currency (with Rs. symbol) for PDF compatibility
    function formatRupeePDF(num) {
        return 'Rs. ' + formatIndianNumber(num);
    }

    // 5. Input Synchronization & Validation

    // Sync Text Field with Slider (On Input/Typing)
    function handleTextChange(textInput, sliderInput, limitObj, errorElement, fieldName) {
        let value = parseCleanFloat(textInput.value);
        
        if (isNaN(value)) {
            errorElement.textContent = `Please enter a valid number for ${fieldName}.`;
            return false;
        }
        
        if (value < limitObj.min || value > limitObj.max) {
            errorElement.textContent = `Value must be between ${formatIndianNumber(limitObj.min)} and ${formatIndianNumber(limitObj.max)}.`;
            return false;
        }

        errorElement.textContent = ''; // Clear error if valid
        sliderInput.value = value;
        return true;
    }

    // Format Text Field on Blur
    function handleBlurFormatting(textInput, limitObj) {
        let value = parseCleanFloat(textInput.value);
        if (isNaN(value) || value < limitObj.min) {
            value = limitObj.min;
        } else if (value > limitObj.max) {
            value = limitObj.max;
        }
        
        textInput.value = (limitObj === LIMITS.amount) ? formatIndianNumber(value) : value.toString();
    }

    // Setup input synchronizations
    function setupSyncing() {
        // --- Loan Amount Sync ---
        elements.loanAmountSlider.addEventListener('input', (e) => {
            elements.loanAmountText.value = formatIndianNumber(e.target.value);
            elements.loanAmountError.textContent = '';
            calculateEMI();
        });

        elements.loanAmountText.addEventListener('input', () => {
            const isValid = handleTextChange(
                elements.loanAmountText,
                elements.loanAmountSlider,
                LIMITS.amount,
                elements.loanAmountError,
                'Loan Amount'
            );
            if (isValid) calculateEMI();
        });

        elements.loanAmountText.addEventListener('blur', () => {
            handleBlurFormatting(elements.loanAmountText, LIMITS.amount);
            elements.loanAmountSlider.value = parseCleanFloat(elements.loanAmountText.value);
            elements.loanAmountError.textContent = '';
            calculateEMI();
        });

        // --- Interest Rate Sync ---
        elements.interestRateSlider.addEventListener('input', (e) => {
            elements.interestRateText.value = e.target.value;
            elements.interestRateError.textContent = '';
            calculateEMI();
        });

        elements.interestRateText.addEventListener('input', () => {
            const isValid = handleTextChange(
                elements.interestRateText,
                elements.interestRateSlider,
                LIMITS.rate,
                elements.interestRateError,
                'Interest Rate'
            );
            if (isValid) calculateEMI();
        });

        elements.interestRateText.addEventListener('blur', () => {
            handleBlurFormatting(elements.interestRateText, LIMITS.rate);
            elements.interestRateSlider.value = parseCleanFloat(elements.interestRateText.value);
            elements.interestRateError.textContent = '';
            calculateEMI();
        });

        // --- Loan Tenure Sync ---
        elements.loanTenureSlider.addEventListener('input', (e) => {
            elements.loanTenureText.value = e.target.value;
            elements.loanTenureError.textContent = '';
            calculateEMI();
        });

        elements.loanTenureText.addEventListener('input', () => {
            const isValid = handleTextChange(
                elements.loanTenureText,
                elements.loanTenureSlider,
                LIMITS.tenure,
                elements.loanTenureError,
                'Loan Tenure'
            );
            if (isValid) calculateEMI();
        });

        elements.loanTenureText.addEventListener('blur', () => {
            handleBlurFormatting(elements.loanTenureText, LIMITS.tenure);
            elements.loanTenureSlider.value = parseCleanFloat(elements.loanTenureText.value);
            elements.loanTenureError.textContent = '';
            calculateEMI();
        });
    }

    // 6. Core Calculations
    function calculateEMI() {
        const principal = parseCleanFloat(elements.loanAmountText.value) || LIMITS.amount.default;
        const annualRate = parseCleanFloat(elements.interestRateText.value) || LIMITS.rate.default;
        const tenureYears = parseCleanFloat(elements.loanTenureText.value) || LIMITS.tenure.default;

        // Perform calculation only if values are valid and within bounds
        if (isNaN(principal) || isNaN(annualRate) || isNaN(tenureYears) ||
            principal < LIMITS.amount.min || principal > LIMITS.amount.max ||
            annualRate < LIMITS.rate.min || annualRate > LIMITS.rate.max ||
            tenureYears < LIMITS.tenure.min || tenureYears > LIMITS.tenure.max) {
            return;
        }

        const monthlyRate = annualRate / 12 / 100;
        const totalMonths = tenureYears * 12;

        let monthlyEmi = 0;
        if (monthlyRate === 0) {
            monthlyEmi = principal / totalMonths;
        } else {
            // Standard formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
            monthlyEmi = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }

        const totalPayment = monthlyEmi * totalMonths;
        const totalInterest = totalPayment - principal;

        // Amortization Repayment Schedule Generation
        let remainingBalance = principal;
        const schedule = [];

        for (let i = 1; i <= totalMonths; i++) {
            const interestPaid = remainingBalance * monthlyRate;
            let principalPaid = monthlyEmi - interestPaid;
            
            if (i === totalMonths) {
                // Ensure remaining balance clears exactly to 0 in the last month
                principalPaid = remainingBalance;
                remainingBalance = 0;
            } else {
                remainingBalance = remainingBalance - principalPaid;
            }

            schedule.push({
                month: i,
                emi: principalPaid + interestPaid,
                principalPaid: principalPaid,
                interestPaid: interestPaid,
                remainingBalance: Math.max(0, remainingBalance)
            });
        }

        // Save results to state
        calculationResults = {
            principal,
            rate: annualRate,
            tenureYears,
            monthlyEmi,
            totalInterest,
            totalPayment,
            schedule
        };

        // Update UI displays
        updateUI();
    }

    // 7. Update UI Elements
    function updateUI() {
        const res = calculationResults;
        
        // Result Value Fields
        elements.monthlyEmiVal.textContent = formatRupee(res.monthlyEmi);
        elements.totalInterestVal.textContent = formatRupee(res.totalInterest);
        elements.totalAmountVal.textContent = formatRupee(res.totalPayment);
        
        // Chart labels text
        elements.chartPrincipalText.textContent = formatRupee(res.principal);
        elements.chartInterestText.textContent = formatRupee(res.totalInterest);
        elements.chartTotalText.textContent = formatRupee(res.totalPayment);

        // Amortization details summary
        elements.summaryMonths.textContent = res.schedule.length;

        // Update Amortization Table
        renderAmortizationTable();

        // Render Chart.js
        renderChart();
    }

    // 8. Amortization Table Rendering
    function renderAmortizationTable() {
        const schedule = calculationResults.schedule;
        let html = '';
        
        schedule.forEach(row => {
            html += `
                <tr>
                    <td>Month ${row.month}</td>
                    <td>${formatRupee(row.emi)}</td>
                    <td>${formatRupee(row.principalPaid)}</td>
                    <td>${formatRupee(row.interestPaid)}</td>
                    <td>${formatRupee(row.remainingBalance)}</td>
                </tr>
            `;
        });
        
        elements.scheduleTableBody.innerHTML = html;
        
        // Set maximum input limits on the search box
        elements.searchMonth.max = schedule.length;
        elements.searchMonth.value = ''; // clear search input on recalculation
    }

    // Amortization Toggle Chevron handler
    elements.tableHeaderToggle.addEventListener('click', toggleAmortizationTable);
    elements.tableHeaderToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAmortizationTable();
        }
    });

    function toggleAmortizationTable() {
        const isOpen = elements.tableHeaderToggle.classList.toggle('open');
        if (isOpen) {
            elements.amortizationBody.classList.remove('collapsed');
        } else {
            elements.amortizationBody.classList.add('collapsed');
        }
    }

    // Search Month Repayment Scroll & Highlight
    elements.searchMonth.addEventListener('input', () => {
        const targetMonth = parseInt(elements.searchMonth.value);
        const rows = elements.scheduleTableBody.querySelectorAll('tr');
        
        // Reset highlights
        rows.forEach(row => row.classList.remove('searched-row'));

        if (targetMonth && targetMonth >= 1 && targetMonth <= rows.length) {
            const targetRow = rows[targetMonth - 1];
            targetRow.classList.add('searched-row');
            
            // Scroll table container to row position
            const container = document.querySelector('.table-responsive-container');
            const rowTop = targetRow.offsetTop;
            const containerHalfHeight = container.clientHeight / 2;
            
            container.scrollTo({
                top: rowTop - containerHalfHeight + (targetRow.clientHeight / 2),
                behavior: 'smooth'
            });
        }
    });

    // 9. Chart.js Lifecycle Management
    function renderChart() {
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = theme === 'dark';
        
        // Colors configured dynamically for themes
        const principalColor = isDark ? '#6366f1' : '#4f46e5';
        const interestColor = isDark ? '#34d399' : '#10b981';
        const hoverBorder = isDark ? '#121824' : '#ffffff';
        const textColor = isDark ? '#94a3b8' : '#475569';

        const chartData = {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [calculationResults.principal, calculationResults.totalInterest],
                backgroundColor: [principalColor, interestColor],
                hoverBackgroundColor: [principalColor, interestColor],
                borderColor: hoverBorder,
                borderWidth: 3,
                hoverBorderWidth: 4,
                spacing: 2
            }]
        };

        const config = {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        display: false // Using custom legends in HTML for styling flex
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${formatRupee(context.raw)}`;
                            }
                        },
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: isDark ? '#f8fafc' : '#0f172a',
                        bodyColor: textColor,
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4,
                        usePointStyle: true
                    }
                }
            }
        };

        if (emiChartInstance) {
            // Destroy and rebuild chart instance to prevent data leaks / overlap bugs
            emiChartInstance.destroy();
        }

        const ctx = document.getElementById('emiChart').getContext('2d');
        emiChartInstance = new Chart(ctx, config);
    }

    // 10. Copy Results Functionality
    elements.copyBtn.addEventListener('click', () => {
        const res = calculationResults;
        const summaryText = `--- FinCalc Loan Summary ---
Loan Principal: ${formatRupee(res.principal)}
Annual Interest Rate: ${res.rate}%
Loan Tenure: ${res.tenureYears} Years
Monthly EMI: ${formatRupee(res.monthlyEmi)}
Total Interest Payable: ${formatRupee(res.totalInterest)}
Total Amount Payable: ${formatRupee(res.totalPayment)}
----------------------------
Calculated by: Shreyansh Singh
Email: shreyansh.singh@digitalheroes.co
Verified: Built for Digital Heroes`;

        navigator.clipboard.writeText(summaryText)
            .then(() => {
                showToast('Loan summary copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                showToast('Failed to copy. Please try again.');
            });
    });

    // Toast show helper
    function showToast(msg) {
        elements.toastMsg.textContent = msg;
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    // 11. PDF Export using jsPDF
    elements.downloadPdfBtn.addEventListener('click', () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const res = calculationResults;
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const timeStr = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Page Size Reference: A4 is 210mm wide x 297mm high
            const marginX = 20;

            // --- Top Banner Header ---
            // Indigo banner
            doc.setFillColor(79, 70, 229); // #4f46e5
            doc.rect(0, 0, 210, 42, 'F');

            // Header Title
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text('Loan EMI Report', marginX, 16);

            // Subtitle
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(200, 200, 255);
            doc.text('Professional Finance & Installment Report Summary', marginX, 23);

            // Timestamp metadata (Right aligned)
            doc.setFontSize(9);
            doc.setTextColor(220, 220, 255);
            doc.text(`Generated: ${dateStr} ${timeStr}`, 190, 16, { align: 'right' });
            doc.text(`Target User: Sivagami R`, 190, 23, { align: 'right' });

            // --- Main Content Area ---
            
            // Section 1: Loan Parameters
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42); // #0f172a
            doc.text('1. Loan Input Parameters', marginX, 55);

            // Divider Line
            doc.setDrawColor(226, 232, 240); // #e2e8f0
            doc.setLineWidth(0.5);
            doc.line(marginX, 58, 190, 58);

            // Grid Layout for inputs
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(71, 85, 105); // #475569

            doc.text('Loan Principal Amount (P):', marginX, 66);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(formatRupeePDF(res.principal), 85, 66);

            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Annual Interest Rate (R):', marginX, 74);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${res.rate}%`, 85, 74);

            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Loan Tenure (N):', marginX, 82);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${res.tenureYears} Years (${res.schedule.length} Months)`, 85, 82);


            // Section 2: Calculated Summary Results
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('2. Repayment Summary', marginX, 98);

            // Divider Line
            doc.line(marginX, 101, 190, 101);

            // Gray background block for results
            doc.setFillColor(248, 250, 252); // #f8fafc
            doc.rect(marginX, 106, 170, 36, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.rect(marginX, 106, 170, 36, 'S');

            // Result Text Grid inside block
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(71, 85, 105);
            doc.text('Monthly Installment (EMI):', marginX + 8, 115);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(79, 70, 229); // Indigo theme color
            doc.text(formatRupeePDF(res.monthlyEmi), marginX + 80, 115);

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(71, 85, 105);
            doc.text('Total Interest Payable:', marginX + 8, 125);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(16, 185, 129); // Emerald secondary theme color
            doc.text(formatRupeePDF(res.totalInterest), marginX + 80, 125);

            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Total Amount (Principal + Int):', marginX + 8, 135);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(formatRupeePDF(res.totalPayment), marginX + 80, 135);

            // Section 3: Graphical Pie Breakdown Info
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('3. Cost Breakdown analysis', marginX, 158);

            // Divider Line
            doc.line(marginX, 161, 190, 161);

            // Detailed percentage breakdown description
            const principalRatio = (res.principal / res.totalPayment) * 100;
            const interestRatio = (res.totalInterest / res.totalPayment) * 100;

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            doc.text('Of the total repayment of ', marginX, 170);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            // inline writing
            let currentX = marginX + doc.getTextWidth('Of the total repayment of ');
            doc.text(formatRupeePDF(res.totalPayment), currentX, 170);
            
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            currentX += doc.getTextWidth(formatRupeePDF(res.totalPayment));
            doc.text(', the ratio breakdown is as follows:', currentX, 170);

            // Draw graphical rectangles to display shares
            // Principal block
            doc.setFillColor(79, 70, 229);
            doc.rect(marginX, 177, 10, 5, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`Principal Loan Share: ${formatRupeePDF(res.principal)} (${principalRatio.toFixed(1)}%)`, marginX + 15, 181);

            // Interest block
            doc.setFillColor(16, 185, 129);
            doc.rect(marginX, 186, 10, 5, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.text(`Interest Payable Share: ${formatRupeePDF(res.totalInterest)} (${interestRatio.toFixed(1)}%)`, marginX + 15, 190);

            // Verification stamp
            doc.setDrawColor(79, 70, 229);
            doc.setFillColor(243, 244, 246);
            doc.setLineWidth(0.75);
            doc.rect(130, 175, 60, 22, 'S');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(79, 70, 229);
            doc.text('DIGITAL HEROES', 160, 181, { align: 'center' });
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.text('APPROVED FINCALC STAMP', 160, 186, { align: 'center' });
            doc.text('https://digitalheroesco.com', 160, 191, { align: 'center' });

            // --- Footer Area ---
            // Draw a subtle line separator near bottom
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(marginX, 268, 190, 268);

            // Author info (Shreyansh Singh)
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184); // #94a3b8
            doc.text('Report Created By:', marginX, 275);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(71, 85, 105);
            doc.text('Tusheta Raman', marginX, 280);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.text('Email: ramantusheta@gmail.com', marginX, 284);

            // Certification link / copyright
            doc.setFontSize(8.5);
            doc.setTextColor(148, 163, 184);
            doc.text('© 2026 Tusheta Raman. All rights reserved.', 190, 275, { align: 'right' });
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            doc.text('Built for Digital Heroes', 190, 281, { align: 'right' });

            // Trigger the download browser action
            doc.save(`FinCalc_EMI_Report_tenure.pdf`);
            showToast('PDF report downloaded successfully!');
        } catch (e) {
            console.error('PDF generation error: ', e);
            showToast('Error generating PDF report. See console.');
        }
    });

    // 12. Reset Functionality
    elements.resetBtn.addEventListener('click', () => {
        elements.loanAmountSlider.value = LIMITS.amount.default;
        elements.loanAmountText.value = formatIndianNumber(LIMITS.amount.default);
        elements.loanAmountError.textContent = '';
        
        elements.interestRateSlider.value = LIMITS.rate.default;
        elements.interestRateText.value = LIMITS.rate.default.toString();
        elements.interestRateError.textContent = '';
        
        elements.loanTenureSlider.value = LIMITS.tenure.default;
        elements.loanTenureText.value = LIMITS.tenure.default.toString();
        elements.loanTenureError.textContent = '';
        
        calculateEMI();
        showToast('Calculator parameters reset to default!');
    });

    // 13. Theme Toggling Logic (Light / Dark)
    elements.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Toggle header icons display
        const moonIcon = elements.themeToggleBtn.querySelector('.theme-icon-dark');
        const sunIcon = elements.themeToggleBtn.querySelector('.theme-icon-light');
        
        if (newTheme === 'dark') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'flex';
        } else {
            moonIcon.style.display = 'flex';
            sunIcon.style.display = 'none';
        }

        // Redraw chart to update font & line colors immediately
        renderChart();
        showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode!`);
    });

    // Load persisted theme preference
    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            elements.themeToggleBtn.querySelector('.theme-icon-dark').style.display = 'none';
            elements.themeToggleBtn.querySelector('.theme-icon-light').style.display = 'flex';
        }
    }

    // 14. Initialization Flow
    loadSavedTheme();
    setupSyncing();
    calculateEMI(); // Run initial calculation on page load
});
