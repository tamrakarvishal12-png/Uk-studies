// --- CONFIGURATION ---
// Your Google Sheet CSV Link
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRUIIUfVCv_71kTJSiCt0XINMCprn2X5i2yeDpMLiUodbYTOoeurF4RelnyLt9tv3KN_keeoQpfmZwR/pub?output=csv";

// Conversion Tables
const GRADE_TO_PERCENT = { "A+": 95, "A": 85, "B+": 75, "B": 65, "C+": 55, "C": 45, "D+": 35, "D": 25, "E": 10 };
const GRADE_TO_GPA = { "A+": 4.0, "A": 3.6, "B+": 3.2, "B": 2.8, "C+": 2.4, "C": 2.0, "D+": 1.6, "D": 1.2, "E": 0.8 };

// --- STATE ---
let currentStep = 1;
let universities = [];

// --- DOM ELEMENTS ---
const form = document.getElementById('eligibility-form');
const resultsView = document.getElementById('results-view');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnSubmit = document.getElementById('btn-submit');
const btnRestart = document.getElementById('btn-restart');

// --- FETCH DATA DIRECTLY FROM GOOGLE SHEETS ---
async function fetchUniversities() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        // Parse CSV manually
        const rows = csvText.split('\n').slice(1); // Skip the header row
        
        universities = rows.map(row => {
            // Split by comma, handling potential empty spaces
            const [name, level, minPerc, minIelts, minPte, minDet, waiver, gap, tier] = row.split(',').map(s => s?.trim());
            
            if (!name) return null; // Skip empty rows
            
            return {
                name: name,
                study_level: level || 'UG',
                min_percentage: parseFloat(minPerc) || 55,
                min_ielts: parseFloat(minIelts) || 6.0,
                min_pte: parseFloat(minPte) || 50,
                min_duolingo: parseFloat(minDet) || 105,
                waiver_accepted: (waiver?.toLowerCase() === 'yes' || waiver === '1'),
                max_gap: parseInt(gap) || 2,
                tier: tier || 'Mid'
            };
        }).filter(Boolean); // Remove nulls
        
        console.log("Successfully loaded universities:", universities);
    } catch (err) {
        console.error("Error loading sheet:", err);
        alert("Failed to load university data. Please check your internet connection.");
    }
}

// Load data immediately when script runs
fetchUniversities();

// --- NAVIGATION & VALIDATION LOGIC ---
function updateUI() {
    // Show/Hide Steps
    document.getElementById('step-1').classList.toggle('hidden', currentStep !== 1);
    document.getElementById('step-2').classList.toggle('hidden', currentStep !== 2);
    document.getElementById('step-3').classList.toggle('hidden', currentStep !== 3);

    // Show/Hide Buttons
    btnPrev.classList.toggle('hidden', currentStep === 1);
    btnNext.classList.toggle('hidden', currentStep === 3);
    btnSubmit.classList.toggle('hidden', currentStep !== 3);

    // Update Progress Bar
    document.getElementById('prog-1').className = `h-2 rounded-full transition-all ${currentStep >= 1 ? 'bg-white' : 'bg-white/30'}`;
    document.getElementById('prog-2').className = `h-2 rounded-full transition-all ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`;
    document.getElementById('prog-3').className = `h-2 rounded-full transition-all ${currentStep >= 3 ? 'bg-white' : 'bg-white/30'}`;
    
    document.getElementById('prog-text-2').className = `text-xs mt-2 font-bold uppercase tracking-wider ${currentStep >= 2 ? 'text-white' : 'text-white/70'}`;
    document.getElementById('prog-text-3').className = `text-xs mt-2 font-bold uppercase tracking-wider ${currentStep >= 3 ? 'text-white' : 'text-white/70'}`;
}

btnNext.addEventListener('click', () => {
    // Strict Validation before moving to next step
    if (currentStep === 1) {
        const qual = document.getElementById('qualification').value;
        if (!qual) return alert("Please select your Highest Qualification.");
    }
    
    if (currentStep === 2) {
        const perc = document.getElementById('percentage').value;
        if (!perc || isNaN(parseFloat(perc))) return alert("Please enter your Academic Percentage.");
    }

    if (currentStep < 3) {
        currentStep++;
        updateUI();
    }
});

btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
});

btnRestart.addEventListener('click', () => {
    form.reset();
    form.classList.remove('hidden');
    resultsView.classList.add('hidden');
    currentStep = 1;
    
    // Reset English inputs visibility
    document.getElementById('englishType').dispatchEvent(new Event('change'));
    updateUI();
});

// --- AUTO-CONVERSIONS (Grade -> Percentage -> GPA) ---
document.getElementById('academicGrade').addEventListener('change', (e) => {
    const grade = e.target.value;
    if (grade) {
        document.getElementById('percentage').value = GRADE_TO_PERCENT[grade];
        document.getElementById('gpa').value = GRADE_TO_GPA[grade];
    }
});

document.getElementById('percentage').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
        document.getElementById('gpa').value = Math.min(4, (val / 25)).toFixed(2);
    }
});

// --- ENGLISH PROFICIENCY TOGGLES ---
document.getElementById('englishType').addEventListener('change', (e) => {
    const type = e.target.value;
    document.getElementById('ielts-input').classList.toggle('hidden', type !== 'IELTS');
    document.getElementById('pte-input').classList.toggle('hidden', type !== 'PTE');
    document.getElementById('duolingo-input').classList.toggle('hidden', type !== 'Duolingo');
    document.getElementById('waiver-input').classList.toggle('hidden', type !== 'Waiver');
});

document.getElementById('englishGrade').addEventListener('change', (e) => {
    const grade = e.target.value;
    if (grade) {
        document.getElementById('waiverPercentage').value = GRADE_TO_PERCENT[grade];
    }
});

// --- FINAL SUBMISSION & ELIGIBILITY CHECK ---
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 1. Gather all form data
    const data = {
        qualification: document.getElementById('qualification').value,
        percentage: parseFloat(document.getElementById('percentage').value) || 0,
        gap: document.getElementById('gap').value,
        englishType: document.getElementById('englishType').value,
        ieltsScore: parseFloat(document.getElementById('ieltsScore').value) || 0,
        pteScore: parseFloat(document.getElementById('pteScore').value) || 0,
        duolingoScore: parseFloat(document.getElementById('duolingoScore').value) || 0,
        waiverPercentage: parseFloat(document.getElementById('waiverPercentage').value) || 0,
    };

    // 2. Determine Target Study Level
    const targetStudyLevel = data.qualification === '+2 / High School' ? 'UG' : 'PG';

    // 3. Filter Universities based on logic
    const eligibleUnis = universities.filter(uni => {
        // Rule 1: Study Level Match
        if (uni.study_level !== targetStudyLevel) return false;
        
        // Rule 2: Academic Percentage Match
        if (data.percentage < uni.min_percentage) return false;
        
        // Rule 3: English Proficiency Match
        let englishEligible = false;
        if (data.englishType === "IELTS" && data.ieltsScore >= uni.min_ielts) englishEligible = true;
        else if (data.englishType === "PTE" && data.pteScore >= uni.min_pte) englishEligible = true;
        else if (data.englishType === "Duolingo" && data.duolingoScore >= uni.min_duolingo) englishEligible = true;
        else if (data.englishType === "Waiver" && uni.waiver_accepted && data.waiverPercentage >= 65) englishEligible = true;

        if (!englishEligible) return false;

        // Rule 4: Gap Match
        const gapYears = data.gap === "No gap" ? 0 : (data.gap === "3+ years" ? 3 : parseInt(data.gap));
        if (gapYears > uni.max_gap) return false;

        return true; // Passed all checks!
    });

    // 4. Show Results
    renderResults(eligibleUnis);
});

// --- RENDER RESULTS UI ---
function renderResults(eligibleUnis) {
    form.classList.add('hidden');
    resultsView.classList.remove('hidden');

    const statusEl = document.getElementById('result-status');
    const countEl = document.getElementById('result-count');
    const listEl = document.getElementById('university-list');

    listEl.innerHTML = ''; // Clear previous results

    // Set Status Header
    if (eligibleUnis.length > 5) {
        statusEl.textContent = "Eligible!";
        statusEl.className = "text-4xl font-bold mb-3 text-green-600";
    } else if (eligibleUnis.length > 0) {
        statusEl.textContent = "Partially Eligible";
        statusEl.className = "text-4xl font-bold mb-3 text-yellow-500";
    } else {
        statusEl.textContent = "Not Eligible";
        statusEl.className = "text-4xl font-bold mb-3 text-red-500";
    }

    countEl.textContent = `We found ${eligibleUnis.length} universities matching your profile.`;

    // Render University Cards
    eligibleUnis.forEach(uni => {
        const card = document.createElement('div');
        card.className = "p-5 border border-slate-200 rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow";
        
        // Color code the tier badge
        let badgeColor = "bg-slate-100 text-slate-700";
        if (uni.tier === 'Top') badgeColor = "bg-purple-100 text-purple-700";
        if (uni.tier === 'Mid') badgeColor = "bg-blue-100 text-blue-700";

        card.innerHTML = `
            <div>
                <h4 class="font-bold text-lg text-slate-800">${uni.name}</h4>
                <p class="text-sm text-slate-500 mt-1">
                    <i class="fa-solid fa-book-open mr-1"></i> ${uni.study_level} &nbsp;&nbsp;
                    <i class="fa-solid fa-clock mr-1"></i> Max Gap: ${uni.max_gap} yrs
                </p>
            </div>
            <span class="px-3 py-1 ${badgeColor} rounded-full text-xs font-bold uppercase tracking-wide border border-black/5">
                ${uni.tier} Tier
            </span>
        `;
        listEl.appendChild(card);
    });
}