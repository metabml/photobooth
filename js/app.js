// ==========================================================================
// Photo Booth Studio — Application Logic (Themes, Navigation, Camera, Guest)
// ==========================================================================

let stream = null;
let capturedPhotos = [];
let selectedPhotos = [];
let selectedTemplate = 0;
let selectedLayout = '2x2'; // '1x1' | '2x2' | '4x2' | '4x2-unique'
let selectedCollection = 'halloween-2026'; // 'halloween-2026' | 'christmas' | 'classic-halloween' | 'all'
let currentTheme = 'halloween-2026';
let selectedBorderColor = 'none';
let borderWidth = 4;
let selectedFilter = 'none';
let currentStep = 1;

// Camera & Burst state
let isCameraMirrored = true;
let countdownDuration = 3;
let isBurstRunning = false;
let burstTimeoutId = null;
let countdownIntervalId = null;

// Camera Framing & Cutoff state
let cameraAspectMode = 'match'; // 'match' (matches active tile aspect ratio) | 'full' (16:9 sensor)
let camZoom = 100; // 100% to 200%
let camPanX = 0;   // -50 to +50
let camPanY = 0;   // -50 to +50

// Per-Tile Crop & Fit state
let tileFitMode = 'cover'; // 'cover' (fill tile) | 'contain' (fit full photo, no cutoff)
let tileCropTarget = 'all'; // 'all' or slot index '0'..'7'
let tileCropSettings = {}; // { [slotIndex]: { zoom: 100, panX: 50, panY: 50 } }

// Visitor / Guest state
let currentGuestName = localStorage.getItem('photobooth_guest_name') || 'Guest Visitor';
let sessionHistory = [];

// 1x1 single photo slot positions
const POS_1X1_STANDARD = [
    { top: '27.5%', left: '7.3%', width: '85.4%', height: '56.5%' }
];

const POS_1X1_FRAMED = [
    { top: '16%', left: '9%', width: '82%', height: '68%' }
];

// Standard 2x2 slot positions (4 tiles)
const POS_2X2_STANDARD = [
    { top: '28%', left: '8%', width: '40%', height: '26%' },
    { top: '28%', right: '7.6%', width: '40%', height: '26%' },
    { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
    { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
];

// Standard 4x2 positions (8 tiles - full column height with bottom logo space)
const POS_4X2_STANDARD = [
    { top: '5%', left: '13%', width: '35%', height: '23%' },
    { top: '27%', left: '13%', width: '35%', height: '23%' },
    { top: '49%', left: '13%', width: '35%', height: '23%' },
    { top: '71%', left: '13%', width: '35%', height: '23%' },
    { top: '5%', right: '13%', width: '35%', height: '23%' },
    { top: '27%', right: '13%', width: '35%', height: '23%' },
    { top: '49%', right: '13%', width: '35%', height: '23%' },
    { top: '71%', right: '13%', width: '35%', height: '23%' }
];

// Framed 4x2 positions (8 tiles - for templates with top headline banner + bottom logo banner)
const POS_4X2_FRAMED = [
    { top: '16%', left: '9%', width: '39%', height: '16.5%' },
    { top: '34%', left: '9%', width: '39%', height: '16.5%' },
    { top: '52%', left: '9%', width: '39%', height: '16.5%' },
    { top: '70%', left: '9%', width: '39%', height: '16.5%' },
    { top: '16%', right: '9%', width: '39%', height: '16.5%' },
    { top: '34%', right: '9%', width: '39%', height: '16.5%' },
    { top: '52%', right: '9%', width: '39%', height: '16.5%' },
    { top: '70%', right: '9%', width: '39%', height: '16.5%' }
];

// ==========================================================================
// Template Catalogs by Layout & Theme Collection
// ==========================================================================
const TEMPLATES_2X2_LIST = [
    // Halloween 2026 (New 2x2 templates)
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/1.png', name: 'Witch & Webs', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/2.png', name: 'Pumpkin Moon', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/3.png', name: 'Midnight Graveyard', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/4.png', name: 'Haunted Mansion', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/5.png', name: 'Trick or Treat', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/6.png', name: 'Spooky Bats', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/7.png', name: 'Jack-O-Lantern', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2 (4 tiles) halloween 2026/8.png', name: 'Eerie Night', collection: 'halloween-2026', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },

    // Christmas 2x2 templates (Set 1 & Classic Holiday Set)
    { src: '/assets/images/2x2/tmp1.png', name: 'Christmas Village', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp2.png', name: 'Festive Snow', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp3.png', name: 'Holiday Cheer', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp4.png', name: 'Winter Wonderland', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp5.png', name: 'Santa Express', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp6.png', name: 'Golden Noel', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp7.png', name: 'Frosty Pines', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/2x2/tmp8.png', name: 'Merry & Bright', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp1.png', name: 'Snowy Pines', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp2.png', name: 'Holiday Ribbons', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp3.png', name: 'Yuletide Glow', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp4.png', name: 'Candy Cane', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp5.png', name: 'Starlight Noel', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp6.png', name: 'Holly Berry', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp7.png', name: 'Winter Sleigh', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/christmas/tmp8.png', name: 'Festive Joy', collection: 'christmas', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },

    // Classic Halloween 2x2 templates
    { src: '/assets/images/holloween/tmp1.png', name: 'Classic Ghost', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp2.png', name: 'Spooky Castle', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp3.png', name: 'Creepy Cobwebs', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp4.png', name: 'Bat Silhouette', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp5.png', name: 'Pumpkin Patch', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp6.png', name: 'Full Moon', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp7.png', name: 'Witching Hour', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD },
    { src: '/assets/images/holloween/tmp8.png', name: 'Haunted Woods', collection: 'classic-halloween', positions: POS_2X2_STANDARD, pos1x1: POS_1X1_STANDARD }
];

const TEMPLATES_4X2_LIST = [
    // Halloween 2026 (New 4x2 background templates)
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/9.png', name: 'Moonlit Pumpkins', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/10.png', name: 'Haunted Manor', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/11.png', name: 'Mummy Graveyard', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/12.png', name: 'Flying Witch', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/13.png', name: 'Pumpkin Garland', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/14.png', name: 'Sunset Cemetery', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/15.png', name: 'Trick or Treat Tower', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2 (8 tiles) halloween 2026/16.png', name: 'Zombie Crypt', collection: 'halloween-2026', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },

    // Christmas 4x2 templates (All 11 templates)
    { src: '/assets/images/4x2/tmp1.png', name: 'Crimson Ornaments', collection: 'christmas', positions: POS_4X2_STANDARD, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp2.png', name: 'Golden Ribbon', collection: 'christmas', positions: POS_4X2_STANDARD, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp3.png', name: 'Midnight Blue Noel', collection: 'christmas', positions: POS_4X2_STANDARD, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp4.png', name: 'Sapphire Gift', collection: 'christmas', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp5.png', name: 'Velvet Red Baubles', collection: 'christmas', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp6.png', name: 'Evergreen Tree', collection: 'christmas', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp7.png', name: 'Mint Holly', collection: 'christmas', positions: POS_4X2_STANDARD, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp8.png', name: 'Champagne Sparkle', collection: 'christmas', positions: POS_4X2_STANDARD, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp9.png', name: 'Classic Red Bow', collection: 'christmas', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp10.png', name: 'Silver Bokeh', collection: 'christmas', positions: POS_4X2_STANDARD, pos1x1: POS_1X1_FRAMED },
    { src: '/assets/images/4x2/tmp11.png', name: 'Gold & Pine', collection: 'christmas', positions: POS_4X2_FRAMED, pos1x1: POS_1X1_FRAMED }
];

// Filter mapping for HTML5 Canvas export
const FILTER_CSS_MAP = {
    none: 'none',
    vivid: 'contrast(1.15) saturate(1.35)',
    warm: 'sepia(0.25) saturate(1.3) brightness(1.04)',
    bw: 'grayscale(1) contrast(1.15)',
    vintage: 'sepia(0.55) contrast(1.05) brightness(0.96)',
    spooky: 'contrast(1.35) saturate(0.75) hue-rotate(-15deg)'
};

// Theme metadata using Material Icons (no emojis)
const THEME_CONFIG = {
    'halloween-2026': {
        icon: 'nights_stay',
        color: '#ff7b00',
        collection: 'halloween-2026',
        particles: ['nights_stay', 'local_fire_department', 'flare', 'auto_awesome', 'bolt', 'star_border']
    },
    'christmas': {
        icon: 'ac_unit',
        color: '#e63946',
        collection: 'christmas',
        particles: ['ac_unit', 'park', 'card_giftcard', 'star', 'notifications_none', 'auto_awesome']
    },
    'classic-halloween': {
        icon: 'dark_mode',
        color: '#bb86fc',
        collection: 'classic-halloween',
        particles: ['dark_mode', 'flare', 'nights_stay', 'auto_fix_high', 'star_border']
    },
    'corporate': {
        icon: 'workspace_premium',
        color: '#0ea5e9',
        collection: 'all',
        particles: ['workspace_premium', 'photo_camera', 'auto_awesome', 'star_border']
    },
    'neon': {
        icon: 'bolt',
        color: '#f72585',
        collection: 'all',
        particles: ['bolt', 'music_note', 'auto_awesome', 'flare', 'star']
    }
};

// ==========================================================================
// Layout Helpers (1x1, 2x2, 4x2 Duplicated, 4x2 Unique)
// ==========================================================================
function getRequiredPhotoCount() {
    if (selectedLayout === '1x1') return 1;
    if (selectedLayout === '4x2-unique') return 8;
    return 4; // '2x2' and '4x2' (duplicated twin strip) both require 4 photos
}

function getLayoutDisplayName(layout = selectedLayout) {
    if (layout === '1x1') return '1×1 Single (1 Tile)';
    if (layout === '2x2') return '2×2 Grid (4 Tiles)';
    if (layout === '4x2') return '4×2 Twin Strip (Duplicated)';
    if (layout === '4x2-unique') return '4×2 Full Grid (8 Unique)';
    return layout;
}

// ==========================================================================
// Theme & Background Management
// ==========================================================================
function setAppTheme(themeKey) {
    currentTheme = themeKey;
    document.documentElement.setAttribute('data-theme', themeKey);
    document.body.style.background = ''; // Clear any inline custom color

    // Update active theme chip
    document.querySelectorAll('.theme-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeKey);
    });

    const cfg = THEME_CONFIG[themeKey] || THEME_CONFIG['halloween-2026'];
    const iconEl = document.getElementById('brand-theme-icon');
    if (iconEl) {
        iconEl.innerHTML = `<i class="material-icons-outlined">${cfg.icon}</i>`;
    }

    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) metaTheme.setAttribute('content', cfg.color);

    renderAmbientParticles(cfg.particles);

    // Sync template collection to match seasonal theme
    if (cfg.collection) {
        setTemplateCollection(cfg.collection, false);
    }
}

function applyCustomBgColor(hexColor) {
    document.querySelectorAll('.theme-chip').forEach(btn => btn.classList.remove('active'));
    document.body.style.background = `linear-gradient(135deg, #090910 0%, ${hexColor} 55%, #121224 100%)`;
    document.body.style.backgroundAttachment = 'fixed';
    showSuccess('Custom background color applied!');
}

function renderAmbientParticles(iconNames) {
    const container = document.getElementById('ambient-bg');
    if (!container) return;
    container.innerHTML = '';

    const count = 14;
    for (let i = 0; i < count; i++) {
        const icon = document.createElement('i');
        icon.className = 'material-icons-outlined ambient-particle';
        icon.textContent = iconNames[i % iconNames.length];
        icon.style.left = `${(i * 7.3 + Math.random() * 5) % 96}%`;
        icon.style.animationDuration = `${14 + (i % 5) * 4}s`;
        icon.style.animationDelay = `-${(i * 2.3) % 15}s`;
        icon.style.fontSize = `${18 + (i % 4) * 6}px`;
        container.appendChild(icon);
    }
}

// ==========================================================================
// Template Filtering & Selection
// ==========================================================================
function getTemplates() {
    let baseList;
    if (selectedLayout === '4x2' || selectedLayout === '4x2-unique') {
        baseList = TEMPLATES_4X2_LIST;
    } else if (selectedLayout === '1x1') {
        // For 1x1, offer the open background frames first, plus the 2x2 frames
        baseList = [...TEMPLATES_4X2_LIST, ...TEMPLATES_2X2_LIST];
    } else {
        baseList = TEMPLATES_2X2_LIST;
    }

    if (selectedCollection === 'all') {
        return baseList;
    }
    const filtered = baseList.filter(t => t.collection === selectedCollection);
    return filtered.length > 0 ? filtered : baseList;
}

function getPositions(templateIndex) {
    const templates = getTemplates();
    const safeIdx = Math.min(templateIndex, templates.length - 1);
    const tpl = templates[safeIdx];
    if (!tpl) return POS_2X2_STANDARD;

    if (selectedLayout === '1x1') {
        return tpl.pos1x1 || POS_1X1_FRAMED;
    }
    return tpl.positions || POS_2X2_STANDARD;
}

function setTemplateCollection(collectionKey, resetSelection = true) {
    selectedCollection = collectionKey;

    document.querySelectorAll('.collection-filter .filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.collection === collectionKey);
    });

    if (resetSelection) {
        selectedTemplate = 0;
    } else {
        const templates = getTemplates();
        if (selectedTemplate >= templates.length) {
            selectedTemplate = 0;
        }
    }

    initializeTemplates();
    syncCameraAspectRatioToTile();
    populateTileCropTargetSelect();
    updateFinalTemplate();
    updateStepSummaries();
}

function selectLayout(layout) {
    selectedLayout = layout;

    document.querySelectorAll('.layout-card').forEach(card => {
        card.classList.toggle('selected', card.id === `layout-${layout}`);
    });

    // Update 4x2 Strip Mode toggle bar in Step 3
    const stripToggleBar = document.getElementById('strip-mode-toggle-bar');
    if (stripToggleBar) {
        const is4x2Mode = layout === '4x2' || layout === '4x2-unique';
        stripToggleBar.style.display = is4x2Mode ? 'flex' : 'none';
        const dupBtn = document.getElementById('strip-mode-dup');
        const uniqBtn = document.getElementById('strip-mode-unique');
        if (dupBtn) dupBtn.classList.toggle('active', layout === '4x2');
        if (uniqBtn) uniqBtn.classList.toggle('active', layout === '4x2-unique');
    }

    // Adjust selectedPhotos count to fit new layout requirement
    const reqCount = getRequiredPhotoCount();
    if (selectedPhotos.length > reqCount) {
        selectedPhotos = selectedPhotos.slice(0, reqCount);
    } else if (selectedPhotos.length < reqCount) {
        for (let i = 0; i < capturedPhotos.length && selectedPhotos.length < reqCount; i++) {
            if (!selectedPhotos.includes(i)) {
                selectedPhotos.push(i);
            }
        }
    }

    // Update Burst & Auto-Pick button labels
    const burstLabel = document.getElementById('btn-burst-label');
    if (burstLabel) {
        burstLabel.textContent = `Auto ${reqCount}-Pose Burst`;
    }
    const autoPickLabel = document.getElementById('auto-pick-label');
    if (autoPickLabel) {
        autoPickLabel.textContent = `Auto-Pick ${reqCount}`;
    }

    const templates = getTemplates();
    if (selectedTemplate >= templates.length) {
        selectedTemplate = 0;
    }

    initializeTemplates();
    syncCameraAspectRatioToTile();
    populateTileCropTargetSelect();
    updateCapturedPhotosGrid();
    updateFinalTemplate();
    updateStepSummaries();
    updateSmartPromptBanner();
}

function selectTemplate(index) {
    selectedTemplate = index;
    document.querySelectorAll('.template').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });
    syncCameraAspectRatioToTile();
    updateFinalTemplate();
    updateStepSummaries();
}

function initializeTemplates() {
    const container = document.getElementById('templates-container');
    if (!container) return;
    container.innerHTML = '';

    const templates = getTemplates();
    templates.forEach((tpl, i) => {
        const div = document.createElement('div');
        div.className = `template ${i === selectedTemplate ? 'selected' : ''}`;
        div.style.backgroundImage = `url("${tpl.src}")`;
        div.onclick = () => selectTemplate(i);

        const label = document.createElement('span');
        label.className = 'template-label';
        label.textContent = tpl.name || `Frame ${i + 1}`;
        div.appendChild(label);

        container.appendChild(div);
    });
}

// ==========================================================================
// Step Navigation & Smart Contextual Prompts
// ==========================================================================
function goToStep(stepNumber) {
    currentStep = Math.max(1, Math.min(4, stepNumber));

    for (let i = 1; i <= 4; i++) {
        const panel = document.getElementById(`step-panel-${i}`);
        const tab = document.getElementById(`step-tab-${i}`);
        if (panel) panel.classList.toggle('active', i === currentStep);
        if (tab) {
            tab.classList.toggle('active', i === currentStep);
            tab.classList.toggle('completed', isStepCompleted(i) && i !== currentStep);
        }
    }

    updateStepSummaries();
    updateSmartPromptBanner();
}

function nextStep() {
    if (currentStep < 4) {
        goToStep(currentStep + 1);
    } else {
        exportImage();
    }
}

function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function isStepCompleted(stepIdx) {
    const req = getRequiredPhotoCount();
    if (stepIdx === 1) return true;
    if (stepIdx === 2) return capturedPhotos.length >= req;
    if (stepIdx === 3) return selectedPhotos.length === req;
    if (stepIdx === 4) return selectedPhotos.length === req;
    return false;
}

function updateStepSummaries() {
    const req = getRequiredPhotoCount();
    const templates = getTemplates();
    const tplName = templates[selectedTemplate]?.name || `Frame ${selectedTemplate + 1}`;

    const s1 = document.getElementById('step-1-summary');
    if (s1) s1.textContent = `${getLayoutDisplayName()} • ${tplName}`;

    const s2 = document.getElementById('step-2-summary');
    if (s2) s2.textContent = `${capturedPhotos.length} / 8 captured`;

    const s3 = document.getElementById('step-3-summary');
    if (s3) s3.textContent = `${selectedPhotos.length} / ${req} selected`;

    const s4 = document.getElementById('step-4-summary');
    if (s4) {
        s4.textContent = selectedPhotos.length === req ? 'Ready to download!' : `Pick ${req - selectedPhotos.length} more`;
    }

    // Update Camera HUD badges
    const hudCap = document.getElementById('hud-captured-badge');
    if (hudCap) hudCap.innerHTML = `<i class="material-icons-outlined">collections</i> ${capturedPhotos.length} / 8 Captured`;

    const hudSel = document.getElementById('hud-selected-badge');
    if (hudSel) hudSel.innerHTML = `<i class="material-icons-outlined">check_circle</i> ${selectedPhotos.length} / ${req} Selected`;

    const step3Pill = document.getElementById('step3-selection-pill');
    if (step3Pill) step3Pill.textContent = `${selectedPhotos.length} / ${req} Selected`;

    const step3Heading = document.getElementById('step3-select-heading');
    if (step3Heading) {
        step3Heading.innerHTML = `<i class="material-icons-outlined">photo_size_select_large</i> 1. Select &amp; Order Your ${req} Photo${req > 1 ? 's' : ''}`;
    }

    const previewChip = document.getElementById('preview-status-chip');
    if (previewChip) {
        if (selectedPhotos.length === req) {
            previewChip.textContent = `${req}/${req} Ready`;
            previewChip.classList.add('ready');
        } else {
            previewChip.textContent = `${selectedPhotos.length}/${req} Selected`;
            previewChip.classList.remove('ready');
        }
    }
}

function updateSmartPromptBanner() {
    const req = getRequiredPhotoCount();
    const msgEl = document.getElementById('prompt-message');
    const iconEl = document.getElementById('prompt-icon');
    const prevBtn = document.getElementById('prompt-prev-btn');
    const nextLabel = document.getElementById('prompt-next-label');

    if (!msgEl) return;

    prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';

    if (currentStep === 1) {
        iconEl.textContent = 'palette';
        msgEl.innerHTML = `<strong>Step 1:</strong> Layout set to <strong>${getLayoutDisplayName()}</strong> (${req} photo${req > 1 ? 's' : ''} needed). Pick a frame or press <kbd class="kbd-inline">&rarr;</kbd> to snap photos!`;
        nextLabel.textContent = 'Next: Snap Photos';
    } else if (currentStep === 2) {
        const remaining = Math.max(0, req - capturedPhotos.length);
        if (remaining > 0) {
            iconEl.textContent = 'photo_camera';
            msgEl.innerHTML = `<strong>Step 2:</strong> Smile, <strong>${escapeHtml(currentGuestName)}</strong>! Take at least <strong>${remaining} more photo${remaining > 1 ? 's' : ''}</strong> (Press <kbd class="kbd-inline">Space</kbd> to capture or <kbd class="kbd-inline">B</kbd> for Burst).`;
        } else {
            iconEl.textContent = 'check_circle';
            msgEl.innerHTML = `<strong>Awesome!</strong> You captured ${capturedPhotos.length} photo${capturedPhotos.length > 1 ? 's' : ''} and ${selectedPhotos.length}/${req} are selected. Press <kbd class="kbd-inline">&rarr;</kbd> to style!`;
        }
        nextLabel.textContent = 'Next: Select & Style';
    } else if (currentStep === 3) {
        if (selectedPhotos.length < req) {
            iconEl.textContent = 'touch_app';
            msgEl.innerHTML = `<strong>Step 3:</strong> Click your favorite photos below to select <strong>${req - selectedPhotos.length} more</strong> for your ${getLayoutDisplayName()}.`;
        } else {
            iconEl.textContent = 'auto_fix_high';
            msgEl.innerHTML = `<strong>Step 3:</strong> All ${req} photo${req > 1 ? 's' : ''} selected! Reorder slots, apply a filter, or add tile borders.`;
        }
        nextLabel.textContent = 'Next: Download & Print';
    } else if (currentStep === 4) {
        iconEl.textContent = 'celebration';
        if (selectedPhotos.length === req) {
            msgEl.innerHTML = `<strong>Step 4:</strong> Looking great, <strong>${escapeHtml(currentGuestName)}</strong>! Press <kbd class="kbd-inline">E</kbd> to download PNG or <kbd class="kbd-inline">P</kbd> to print.`;
        } else {
            msgEl.innerHTML = `<strong>Almost there:</strong> Please select ${req} photo${req > 1 ? 's' : ''} in Step 2 or Step 3 before exporting.`;
        }
        nextLabel.textContent = 'Download PNG';
    }
}

// ==========================================================================
// Camera Initialization, Mirroring, Countdown & Burst
// ==========================================================================
async function initCamera(deviceId = null) {
    try {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }

        const aspectRatio = 445 / 289;
        const videoConstraints = {
            width: { ideal: 445 * 2 },
            height: { ideal: 289 * 2 },
            aspectRatio: aspectRatio
        };
        if (deviceId) {
            videoConstraints.deviceId = { exact: deviceId };
        }

        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        const videoElement = document.getElementById('camera-feed');
        if (videoElement) {
            videoElement.srcObject = stream;
        }

        await populateCameraDevices();
    } catch (err) {
        console.error('Error accessing camera:', err);
        const promptEl = document.getElementById('camera-pose-prompt');
        if (promptEl) {
            promptEl.textContent = 'Camera access unavailable — please allow webcam permissions in your browser.';
        }
    }
}

async function populateCameraDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const selectEl = document.getElementById('camera-device-select');
        if (!selectEl) return;

        if (videoDevices.length > 1) {
            selectEl.style.display = 'inline-block';
            const currentTrack = stream?.getVideoTracks()[0];
            const activeDeviceId = currentTrack?.getSettings()?.deviceId;

            selectEl.innerHTML = '';
            videoDevices.forEach((dev, idx) => {
                const opt = document.createElement('option');
                opt.value = dev.deviceId;
                opt.textContent = dev.label || `Camera ${idx + 1}`;
                if (dev.deviceId === activeDeviceId) opt.selected = true;
                selectEl.appendChild(opt);
            });
        } else {
            selectEl.style.display = 'none';
        }
    } catch (e) {
        console.warn('Could not enumerate video devices:', e);
    }
}

function switchCameraDevice(deviceId) {
    if (deviceId) {
        initCamera(deviceId);
    }
}

function toggleCameraMirror(mirrored) {
    isCameraMirrored = mirrored !== undefined ? mirrored : !isCameraMirrored;
    const checkbox = document.getElementById('mirror-toggle');
    if (checkbox && checkbox.checked !== isCameraMirrored) {
        checkbox.checked = isCameraMirrored;
    }
    applyCameraLiveTransform();
}

function getActiveTileAspectRatio() {
    if (cameraAspectMode === 'full') {
        return 16 / 9;
    }
    const positions = getPositions(selectedTemplate);
    const firstSlot = positions[0] || { width: '40%', height: '26%' };
    const w = parseFloat(firstSlot.width) || 40;
    const h = parseFloat(firstSlot.height) || 26;
    return w / h;
}

function syncCameraAspectRatioToTile() {
    const camContainer = document.getElementById('camera-container');
    const aspectBadgeText = document.getElementById('hud-aspect-text');
    const positions = getPositions(selectedTemplate);
    const firstSlot = positions[0] || { width: '40%', height: '26%' };
    const w = parseFloat(firstSlot.width) || 40;
    const h = parseFloat(firstSlot.height) || 26;

    if (camContainer) {
        if (cameraAspectMode === 'match') {
            camContainer.style.aspectRatio = `${w} / ${h}`;
        } else {
            camContainer.style.aspectRatio = '16 / 9';
        }
    }

    if (aspectBadgeText) {
        if (cameraAspectMode === 'match') {
            aspectBadgeText.textContent = `Tile Ratio (${selectedLayout}): ${w}:${h}`;
        } else {
            aspectBadgeText.textContent = 'Full Sensor (16:9)';
        }
    }

    applyCameraLiveTransform();
}

function setCameraAspectMode(mode) {
    cameraAspectMode = mode === 'full' ? 'full' : 'match';
    const matchBtn = document.getElementById('cam-crop-match');
    const fullBtn = document.getElementById('cam-crop-full');
    if (matchBtn) matchBtn.classList.toggle('active', cameraAspectMode === 'match');
    if (fullBtn) fullBtn.classList.toggle('active', cameraAspectMode === 'full');
    syncCameraAspectRatioToTile();
}

function updateCameraFraming() {
    const zoomInput = document.getElementById('cam-zoom-slider');
    const panYInput = document.getElementById('cam-pan-y-slider');
    const panXInput = document.getElementById('cam-pan-x-slider');

    camZoom = parseInt(zoomInput?.value || '100', 10);
    camPanY = parseInt(panYInput?.value || '0', 10);
    camPanX = parseInt(panXInput?.value || '0', 10);

    const zoomValEl = document.getElementById('cam-zoom-val');
    if (zoomValEl) zoomValEl.innerHTML = `${(camZoom / 100).toFixed(1)}&times;`;

    const panYValEl = document.getElementById('cam-pan-y-val');
    if (panYValEl) {
        panYValEl.textContent = camPanY === 0 ? 'Center' : (camPanY > 0 ? `Down +${camPanY}%` : `Up ${camPanY}%`);
    }

    const panXValEl = document.getElementById('cam-pan-x-val');
    if (panXValEl) {
        panXValEl.textContent = camPanX === 0 ? 'Center' : (camPanX > 0 ? `Right +${camPanX}%` : `Left ${camPanX}%`);
    }

    applyCameraLiveTransform();
}

function resetCameraFraming() {
    camZoom = 100;
    camPanX = 0;
    camPanY = 0;

    const zoomInput = document.getElementById('cam-zoom-slider');
    const panYInput = document.getElementById('cam-pan-y-slider');
    const panXInput = document.getElementById('cam-pan-x-slider');
    if (zoomInput) zoomInput.value = '100';
    if (panYInput) panYInput.value = '0';
    if (panXInput) panXInput.value = '0';

    updateCameraFraming();
    showSuccess('Camera framing reset to center.');
}

function applyCameraLiveTransform() {
    const videoEl = document.getElementById('camera-feed');
    if (!videoEl) return;

    const scaleVal = camZoom / 100;
    const mirrorFactor = isCameraMirrored ? -1 : 1;
    // Shift objectPosition and CSS transform so live preview matches capture crop
    const posX = 50 + camPanX;
    const posY = 50 + camPanY;
    videoEl.style.objectPosition = `${posX}% ${posY}%`;
    videoEl.style.transform = `scale(${mirrorFactor * scaleVal}, ${scaleVal}) translate(${(-camPanX * 0.25) * mirrorFactor}%, ${-camPanY * 0.25}%)`;
}

function updateCountdownDuration(seconds) {
    countdownDuration = parseInt(seconds, 10) || 0;
}

// Gentle Web Audio beep for countdown & shutter
function playTone(freq = 800, durationMs = 90) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
            osc.stop();
            ctx.close();
        }, durationMs);
    } catch (_) {
        // Ignore audio errors if blocked
    }
}

function triggerSingleCapture() {
    if (capturedPhotos.length >= 8) {
        showDialog(
            'Maximum 8 Photos Reached',
            'You already have 8 captured photos. Delete a shot or clear photos to take new ones.',
            dialogTypes.WARNING
        );
        return;
    }

    if (countdownDuration <= 0) {
        takePicture();
    } else {
        runInCameraCountdown(countdownDuration, 'Strike a Pose!', () => {
            takePicture();
        });
    }
}

function runInCameraCountdown(seconds, subtext, onComplete) {
    const overlay = document.getElementById('in-camera-countdown');
    const numEl = document.getElementById('countdown-number');
    const subEl = document.getElementById('countdown-subtext');

    if (!overlay || !numEl) {
        onComplete();
        return;
    }

    clearInterval(countdownIntervalId);
    let remaining = seconds;
    overlay.style.display = 'flex';
    numEl.textContent = remaining;
    if (subEl) subEl.textContent = subtext || 'Get Ready!';
    playTone(660, 80);

    countdownIntervalId = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            numEl.textContent = remaining;
            playTone(660, 80);
        } else {
            clearInterval(countdownIntervalId);
            overlay.style.display = 'none';
            playTone(1040, 140);
            triggerFlashEffect();
            onComplete();
        }
    }, 1000);
}

function triggerFlashEffect() {
    const flash = document.getElementById('camera-flash-overlay');
    if (!flash) return;
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 180);
}

function takePicture() {
    const video = document.getElementById('camera-feed');
    if (!video || !video.videoWidth) {
        showDialog('Camera Not Ready', 'Please make sure your camera is connected and allowed.', dialogTypes.WARNING);
        return;
    }

    if (capturedPhotos.length >= 8) {
        showDialog(
            'Maximum Photos Reached',
            'You can only capture up to 8 photos. Please delete some photos to capture more.',
            dialogTypes.WARNING
        );
        return;
    }

    const targetAspect = getActiveTileAspectRatio();
    const baseHeight = 720;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(baseHeight * targetAspect);
    canvas.height = baseHeight;

    const ctx = canvas.getContext('2d');

    let baseDrawWidth = video.videoWidth;
    let baseDrawHeight = video.videoHeight;

    const videoAspect = video.videoWidth / video.videoHeight;
    if (videoAspect > targetAspect) {
        baseDrawWidth = video.videoHeight * targetAspect;
    } else {
        baseDrawHeight = video.videoWidth / targetAspect;
    }

    // Apply camera zoom & cutoff pan offsets
    const zoomFactor = Math.max(1, camZoom / 100);
    const drawWidth = baseDrawWidth / zoomFactor;
    const drawHeight = baseDrawHeight / zoomFactor;

    const maxOffsetX = video.videoWidth - drawWidth;
    const maxOffsetY = video.videoHeight - drawHeight;

    // When mirrored, horizontal pan direction in video space is inverted so it matches visual screen direction
    const effectivePanX = isCameraMirrored ? -camPanX : camPanX;
    const normPanX = Math.max(0, Math.min(1, (50 + effectivePanX) / 100));
    const normPanY = Math.max(0, Math.min(1, (50 + camPanY) / 100));

    const startX = maxOffsetX * normPanX;
    const startY = maxOffsetY * normPanY;

    ctx.save();
    if (isCameraMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, startX, startY, drawWidth, drawHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const photoUrl = canvas.toDataURL('image/jpeg', 0.92);
    const newIndex = capturedPhotos.length;
    capturedPhotos.push(photoUrl);

    // Auto-select up to the required photo count for the active layout
    const reqCount = getRequiredPhotoCount();
    if (selectedPhotos.length < reqCount) {
        selectedPhotos.push(newIndex);
    }

    updateCapturedPhotosGrid();
    updateFinalTemplate();
    updateStepSummaries();
    updateSmartPromptBanner();

    const promptEl = document.getElementById('camera-pose-prompt');
    if (promptEl) {
        promptEl.innerHTML = `Shot ${capturedPhotos.length} captured! (${selectedPhotos.length}/${reqCount} selected for frame)`;
    }
}

// Burst Capture (defaults to required photo count for current layout, or 8)
function startBurstCapture(targetCount = null) {
    if (capturedPhotos.length >= 8) {
        showDialog(
            'Maximum Photos Reached',
            'Please delete some photos before starting burst capture.',
            dialogTypes.WARNING
        );
        return;
    }

    const desiredCount = targetCount || getRequiredPhotoCount();
    const availableSlots = 8 - capturedPhotos.length;
    const totalToTake = Math.min(desiredCount, availableSlots);
    let shotsTakenInBurst = 0;
    isBurstRunning = true;

    const stopBtn = document.getElementById('btn-stop-burst');
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    const stepSec = Math.max(2, countdownDuration || 3);

    function nextShot() {
        if (!isBurstRunning || shotsTakenInBurst >= totalToTake || capturedPhotos.length >= 8) {
            stopBurstCapture(shotsTakenInBurst > 0);
            return;
        }

        const label = `Pose ${shotsTakenInBurst + 1} of ${totalToTake}`;
        runInCameraCountdown(stepSec, label, () => {
            if (!isBurstRunning) return;
            takePicture();
            shotsTakenInBurst++;
            burstTimeoutId = setTimeout(nextShot, 600);
        });
    }

    nextShot();
}

function stopBurstCapture(completed = false) {
    isBurstRunning = false;
    clearInterval(countdownIntervalId);
    clearTimeout(burstTimeoutId);

    const overlay = document.getElementById('in-camera-countdown');
    if (overlay) overlay.style.display = 'none';

    const stopBtn = document.getElementById('btn-stop-burst');
    if (stopBtn) stopBtn.style.display = 'none';

    if (completed) {
        showSuccess('Burst capture completed!');
    }
}

// ==========================================================================
// Photo Selection, Deletion & Slot Ordering
// ==========================================================================
function updateCapturedPhotosGrid() {
    const containers = [
        document.getElementById('captured-photos'),
        document.getElementById('captured-photos-step3')
    ];

    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';

        if (capturedPhotos.length === 0) {
            container.innerHTML = `
                <div class="empty-photos-placeholder">
                    <i class="material-icons-outlined">photo_camera</i>
                    <span>No photos captured yet. Head to Step 2 and press Space to take your poses!</span>
                </div>
            `;
            return;
        }

        capturedPhotos.forEach((photo, index) => {
            const slotNumber = selectedPhotos.indexOf(index);
            const isSelected = slotNumber !== -1;

            const div = document.createElement('div');
            div.className = `photo-thumbnail ${isSelected ? 'selected' : ''}`;
            div.onclick = () => togglePhotoSelection(index);

            const img = document.createElement('img');
            img.src = photo;
            if (selectedFilter !== 'none') {
                img.classList.add(`filter-${selectedFilter}`);
            }
            div.appendChild(img);

            if (isSelected) {
                const badge = document.createElement('span');
                badge.className = 'slot-order-badge';
                badge.textContent = `Slot ${slotNumber + 1}`;
                div.appendChild(badge);
            }

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'delete-photo-btn';
            delBtn.title = 'Delete Photo';
            delBtn.innerHTML = '<i class="material-icons">close</i>';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteCapturedPhoto(index);
            };
            div.appendChild(delBtn);

            container.appendChild(div);
        });
    });

    renderSelectedOrderBar();
}

function togglePhotoSelection(index) {
    const reqCount = getRequiredPhotoCount();
    const pos = selectedPhotos.indexOf(index);
    if (pos === -1) {
        if (selectedPhotos.length < reqCount) {
            selectedPhotos.push(index);
        } else if (reqCount === 1) {
            // In 1x1 mode, clicking another photo immediately swaps the single selected photo
            selectedPhotos = [index];
        } else {
            showSuccess(`${reqCount} photos already selected! Deselect one first to swap.`);
            return;
        }
    } else {
        selectedPhotos.splice(pos, 1);
    }

    updateCapturedPhotosGrid();
    updateFinalTemplate();
    updateStepSummaries();
    updateSmartPromptBanner();
}

function deleteCapturedPhoto(index) {
    const reqCount = getRequiredPhotoCount();
    capturedPhotos.splice(index, 1);
    selectedPhotos = selectedPhotos
        .filter(i => i !== index)
        .map(i => (i > index ? i - 1 : i));

    // Auto-fill up to required photo count if available
    for (let i = 0; i < capturedPhotos.length && selectedPhotos.length < reqCount; i++) {
        if (!selectedPhotos.includes(i)) {
            selectedPhotos.push(i);
        }
    }

    updateCapturedPhotosGrid();
    updateFinalTemplate();
    updateStepSummaries();
    updateSmartPromptBanner();
}

function autoSelectRequiredPhotos() {
    if (capturedPhotos.length === 0) {
        showSuccess('Capture some photos first!');
        return;
    }
    const reqCount = getRequiredPhotoCount();
    selectedPhotos = [];
    for (let i = 0; i < Math.min(reqCount, capturedPhotos.length); i++) {
        selectedPhotos.push(i);
    }
    updateCapturedPhotosGrid();
    updateFinalTemplate();
    updateStepSummaries();
    updateSmartPromptBanner();
    showSuccess(`Selected ${selectedPhotos.length} photo(s)!`);
}

function clearCapturedPhotos() {
    if (capturedPhotos.length === 0) return;
    capturedPhotos = [];
    selectedPhotos = [];
    updateCapturedPhotosGrid();
    updateFinalTemplate();
    updateStepSummaries();
    updateSmartPromptBanner();
    showSuccess('Cleared captured photos.');
}

function renderSelectedOrderBar() {
    const bar = document.getElementById('selected-order-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const reqCount = getRequiredPhotoCount();
    bar.style.gridTemplateColumns = reqCount === 1 ? 'minmax(180px, 280px)' : 'repeat(4, 1fr)';

    for (let slot = 0; slot < reqCount; slot++) {
        const photoIdx = selectedPhotos[slot];
        const card = document.createElement('div');
        card.className = `order-slot-card ${photoIdx !== undefined ? 'filled' : ''}`;

        if (photoIdx !== undefined && capturedPhotos[photoIdx]) {
            card.innerHTML = `
                <div class="order-slot-controls">
                    <button type="button" class="swap-btn" ${slot === 0 ? 'disabled' : ''} onclick="moveSelectedPhoto(${slot}, -1)" title="Move Left">
                        <i class="material-icons" style="font-size:15px;">chevron_left</i>
                    </button>
                    <strong>Slot ${slot + 1}</strong>
                    <button type="button" class="swap-btn" ${slot >= selectedPhotos.length - 1 ? 'disabled' : ''} onclick="moveSelectedPhoto(${slot}, 1)" title="Move Right">
                        <i class="material-icons" style="font-size:15px;">chevron_right</i>
                    </button>
                </div>
                <img src="${capturedPhotos[photoIdx]}" class="${selectedFilter !== 'none' ? 'filter-' + selectedFilter : ''}" alt="Slot ${slot + 1}">
            `;
        } else {
            card.innerHTML = `
                <strong>Slot ${slot + 1}</strong>
                <span style="opacity:0.6;padding:18px 0;">Empty</span>
            `;
        }
        bar.appendChild(card);
    }
}

function moveSelectedPhoto(slotIndex, delta) {
    const targetIndex = slotIndex + delta;
    if (targetIndex < 0 || targetIndex >= selectedPhotos.length) return;
    const temp = selectedPhotos[slotIndex];
    selectedPhotos[slotIndex] = selectedPhotos[targetIndex];
    selectedPhotos[targetIndex] = temp;

    updateCapturedPhotosGrid();
    updateFinalTemplate();
}

// ==========================================================================
// Filters & Border Styling
// ==========================================================================
function selectPhotoFilter(filterName) {
    selectedFilter = filterName;
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filterName);
    });
    updateCapturedPhotosGrid();
    updateFinalTemplate();
}

function selectBorderColor(color) {
    selectedBorderColor = color;
    document.querySelectorAll('.border-color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === color);
    });

    const widthControl = document.getElementById('border-width-control');
    if (widthControl) {
        widthControl.style.display = color !== 'none' ? 'block' : 'none';
    }

    updateFinalTemplate();
}

function updateBorderWidth(value) {
    borderWidth = parseInt(value, 10) || 4;
    const valEl = document.getElementById('border-width-value');
    if (valEl) valEl.textContent = borderWidth;
    updateFinalTemplate();
}

// ==========================================================================
// Tile Cutoff, Fit Mode (Cover vs Contain) & Per-Tile Pan/Zoom
// ==========================================================================
function getTileCropSetting(photoArrayIndex) {
    if (!tileCropSettings[photoArrayIndex]) {
        tileCropSettings[photoArrayIndex] = { zoom: 100, panX: 50, panY: 50 };
    }
    return tileCropSettings[photoArrayIndex];
}

function setTileFitMode(mode) {
    tileFitMode = mode === 'contain' ? 'contain' : 'cover';
    const coverBtn = document.getElementById('tile-fit-cover');
    const containBtn = document.getElementById('tile-fit-contain');
    if (coverBtn) coverBtn.classList.toggle('active', tileFitMode === 'cover');
    if (containBtn) containBtn.classList.toggle('active', tileFitMode === 'contain');
    updateFinalTemplate();
}

function populateTileCropTargetSelect() {
    const selectEl = document.getElementById('tile-crop-target');
    if (!selectEl) return;

    const reqCount = getRequiredPhotoCount();
    const prevValue = selectEl.value || 'all';
    selectEl.innerHTML = '<option value="all">All Selected Tiles</option>';

    for (let i = 0; i < reqCount; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = `Slot ${i + 1}`;
        selectEl.appendChild(opt);
    }

    if (prevValue !== 'all' && parseInt(prevValue, 10) < reqCount) {
        selectEl.value = prevValue;
        tileCropTarget = prevValue;
    } else {
        selectEl.value = 'all';
        tileCropTarget = 'all';
    }

    syncSlidersToTileCropTarget();
}

function onSelectTileCropTarget(targetVal) {
    tileCropTarget = targetVal;
    syncSlidersToTileCropTarget();
}

function syncSlidersToTileCropTarget() {
    const refIdx = tileCropTarget === 'all' ? 0 : parseInt(tileCropTarget, 10) || 0;
    const cfg = getTileCropSetting(refIdx);

    const zoomSlider = document.getElementById('tile-zoom-slider');
    const panYSlider = document.getElementById('tile-pan-y-slider');
    const panXSlider = document.getElementById('tile-pan-x-slider');

    if (zoomSlider) zoomSlider.value = String(cfg.zoom);
    if (panYSlider) panYSlider.value = String(cfg.panY);
    if (panXSlider) panXSlider.value = String(cfg.panX);

    updateTileCropLabels(cfg);
}

function updateTileCropLabels(cfg) {
    const zoomValEl = document.getElementById('tile-zoom-val');
    const panYValEl = document.getElementById('tile-pan-y-val');
    const panXValEl = document.getElementById('tile-pan-x-val');

    if (zoomValEl) zoomValEl.textContent = `${cfg.zoom}%`;
    if (panYValEl) panYValEl.textContent = `${Math.round(cfg.panY)}%`;
    if (panXValEl) panXValEl.textContent = `${Math.round(cfg.panX)}%`;
}

function updateTileCropFromSliders() {
    const zoom = parseInt(document.getElementById('tile-zoom-slider')?.value || '100', 10);
    const panY = parseFloat(document.getElementById('tile-pan-y-slider')?.value || '50');
    const panX = parseFloat(document.getElementById('tile-pan-x-slider')?.value || '50');

    const reqCount = getRequiredPhotoCount();
    if (tileCropTarget === 'all') {
        for (let i = 0; i < reqCount; i++) {
            tileCropSettings[i] = { zoom, panX, panY };
        }
    } else {
        const idx = parseInt(tileCropTarget, 10) || 0;
        tileCropSettings[idx] = { zoom, panX, panY };
    }

    updateTileCropLabels({ zoom, panX, panY });
    updateFinalTemplate();
}

function resetTileCropAdjustments() {
    tileCropSettings = {};
    setTileFitMode('cover');
    syncSlidersToTileCropTarget();
    updateFinalTemplate();
    showSuccess('Tile crop & cutoff reset.');
}

// ==========================================================================
// Live Final Template Composite Preview (Supports 1x1, 2x2, 4x2 Dup & 4x2 Unique)
// ==========================================================================
function getPhotoArrayIndexForSlot(slotIdx) {
    if (selectedLayout === '1x1') return 0;
    if (selectedLayout === '2x2') return slotIdx;
    if (selectedLayout === '4x2-unique') return slotIdx; // 8 unique photos (0..7)
    // '4x2' duplicated side-by-side: right column (4..7) copies left column (0..3)
    return slotIdx < 4 ? slotIdx : slotIdx - 4;
}

function updateFinalTemplate() {
    const container = document.querySelector('.final-template');
    if (!container) return;
    container.innerHTML = '';

    const templates = getTemplates();
    if (!templates.length) return;
    const safeTemplateIndex = Math.min(selectedTemplate, templates.length - 1);

    // Template background image
    const templateImg = document.createElement('img');
    templateImg.src = templates[safeTemplateIndex].src;
    templateImg.className = 'template-background';
    container.appendChild(templateImg);

    const positions = getPositions(safeTemplateIndex);

    positions.forEach((position, i) => {
        const photoArrayIndex = getPhotoArrayIndexForSlot(i);
        const photoIndex = selectedPhotos[photoArrayIndex];

        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-slot';
        Object.assign(photoDiv.style, position);

        if (selectedBorderColor !== 'none') {
            photoDiv.style.border = `${borderWidth * 2}px solid ${selectedBorderColor}`;
            photoDiv.style.boxSizing = 'border-box';
        }

        if (photoIndex !== undefined && capturedPhotos[photoIndex]) {
            const cropCfg = getTileCropSetting(photoArrayIndex);
            const img = document.createElement('img');
            img.src = capturedPhotos[photoIndex];
            if (selectedFilter !== 'none') {
                img.classList.add(`filter-${selectedFilter}`);
            }
            img.style.objectFit = tileFitMode;
            img.style.objectPosition = `${cropCfg.panX}% ${cropCfg.panY}%`;
            if (cropCfg.zoom > 100) {
                const s = cropCfg.zoom / 100;
                const tx = (50 - cropCfg.panX) * (s - 1);
                const ty = (50 - cropCfg.panY) * (s - 1);
                img.style.transform = `scale(${s}) translate(${tx}%, ${ty}%)`;
            }

            // Enable direct drag-to-reposition inside the Live Preview tile
            attachTileDragHandler(photoDiv, photoArrayIndex);

            photoDiv.appendChild(img);
        } else {
            photoDiv.classList.add('empty-slot');
            photoDiv.textContent = `Pose ${photoArrayIndex + 1}`;
        }

        container.appendChild(photoDiv);
    });

    scaleLivePreviewStage();
}

function attachTileDragHandler(slotEl, photoArrayIndex) {
    slotEl.title = 'Drag to adjust tile cutoff position';
    slotEl.onpointerdown = (e) => {
        e.preventDefault();
        slotEl.setPointerCapture(e.pointerId);
        const startX = e.clientX;
        const startY = e.clientY;
        const cfg = getTileCropSetting(photoArrayIndex);
        const initialPanX = cfg.panX;
        const initialPanY = cfg.panY;

        // Switch Step 3 dropdown to this slot so sliders reflect the dragged slot
        const selectEl = document.getElementById('tile-crop-target');
        if (selectEl) {
            selectEl.value = String(photoArrayIndex);
            tileCropTarget = String(photoArrayIndex);
        }

        const onMove = (moveEvt) => {
            const dx = moveEvt.clientX - startX;
            const dy = moveEvt.clientY - startY;
            // Dragging right moves image right (reduces object-position X% cutoff)
            const newPanX = Math.max(0, Math.min(100, initialPanX - dx * 0.35));
            const newPanY = Math.max(0, Math.min(100, initialPanY - dy * 0.35));
            tileCropSettings[photoArrayIndex] = { ...cfg, panX: newPanX, panY: newPanY };
            syncSlidersToTileCropTarget();
            updateFinalTemplate();
        };

        const onUp = (upEvt) => {
            slotEl.releasePointerCapture(upEvt.pointerId);
            slotEl.onpointermove = null;
            slotEl.onpointerup = null;
        };

        slotEl.onpointermove = onMove;
        slotEl.onpointerup = onUp;
    };
}

function scaleLivePreviewStage() {
    const stage = document.getElementById('final-template-stage');
    const template = document.getElementById('final-template');
    if (!stage || !template) return;

    const stageWidth = stage.clientWidth;
    if (stageWidth > 0) {
        const scale = stageWidth / 1080;
        template.style.transform = `scale(${scale})`;
    }
}

// ==========================================================================
// High-Res Direct Canvas Export & Print
// ==========================================================================
function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Draw image with custom fitMode ('cover' | 'contain'), panX (0..100), panY (0..100), and zoom (100..220)
function drawImageWithCropAndFit(ctx, img, x, y, w, h, cropCfg, fitMode) {
    const zoomFactor = Math.max(1, (cropCfg?.zoom || 100) / 100);
    const panXNorm = Math.max(0, Math.min(1, (cropCfg?.panX ?? 50) / 100));
    const panYNorm = Math.max(0, Math.min(1, (cropCfg?.panY ?? 50) / 100));

    const imgRatio = img.width / img.height;
    const slotRatio = w / h;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    if (fitMode === 'contain') {
        // Fill dark backdrop inside slot so contain bars look clean
        ctx.fillStyle = 'rgba(12, 12, 18, 0.85)';
        ctx.fillRect(x, y, w, h);

        let dw = w;
        let dh = h;
        if (imgRatio > slotRatio) {
            dh = w / imgRatio;
        } else {
            dw = h * imgRatio;
        }
        dw *= zoomFactor;
        dh *= zoomFactor;

        const dx = x + (w - dw) * panXNorm;
        const dy = y + (h - dh) * panYNorm;
        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    } else {
        // Cover mode with panX, panY, and zoom
        let baseSw = img.width;
        let baseSh = img.height;
        if (imgRatio > slotRatio) {
            baseSw = img.height * slotRatio;
        } else {
            baseSh = img.width / slotRatio;
        }

        const sw = baseSw / zoomFactor;
        const sh = baseSh / zoomFactor;
        const sx = (img.width - sw) * panXNorm;
        const sy = (img.height - sh) * panYNorm;

        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }

    ctx.restore();
}

async function exportImage() {
    const reqCount = getRequiredPhotoCount();
    if (selectedPhotos.length !== reqCount) {
        showDialog(
            `Select ${reqCount} Photo${reqCount > 1 ? 's' : ''} First`,
            `You currently have ${selectedPhotos.length} of ${reqCount} photo${reqCount > 1 ? 's' : ''} selected for the ${getLayoutDisplayName()} layout. Please capture and select ${reqCount} photo${reqCount > 1 ? 's' : ''} before exporting.`,
            dialogTypes.WARNING
        );
        return;
    }

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        const templates = getTemplates();
        const safeTemplateIndex = Math.min(selectedTemplate, templates.length - 1);
        const tpl = templates[safeTemplateIndex];

        // 1. Draw template background
        const bgImg = await loadImageElement(tpl.src);
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // 2. Draw all photo slots
        const positions = getPositions(safeTemplateIndex);
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const photoArrayIndex = getPhotoArrayIndexForSlot(i);
            const photoIdx = selectedPhotos[photoArrayIndex];
            const photoSrc = capturedPhotos[photoIdx];
            if (!photoSrc) continue;

            const photoImg = await loadImageElement(photoSrc);
            const w = (parseFloat(pos.width) / 100) * canvas.width;
            const h = (parseFloat(pos.height) / 100) * canvas.height;
            const x = pos.left !== undefined
                ? (parseFloat(pos.left) / 100) * canvas.width
                : canvas.width - ((parseFloat(pos.right) / 100) * canvas.width) - w;
            const y = pos.top !== undefined
                ? (parseFloat(pos.top) / 100) * canvas.height
                : canvas.height - ((parseFloat(pos.bottom) / 100) * canvas.height) - h;

            const cropCfg = getTileCropSetting(photoArrayIndex);

            ctx.save();
            ctx.filter = FILTER_CSS_MAP[selectedFilter] || 'none';
            drawImageWithCropAndFit(ctx, photoImg, x, y, w, h, cropCfg, tileFitMode);
            ctx.restore();

            if (selectedBorderColor !== 'none') {
                ctx.save();
                ctx.strokeStyle = selectedBorderColor;
                ctx.lineWidth = borderWidth * 2;
                ctx.strokeRect(x, y, w, h);
                ctx.restore();
            }
        }

        // Build clean filename with theme & visitor name
        const now = new Date();
        const timestamp =
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const safeGuest = (currentGuestName || 'Guest')
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'Guest';

        const fileName = `PhotoBooth_${currentTheme}_${selectedLayout}_${safeGuest}_${timestamp}.png`;
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        // Save to session history drawer for visitor convenience
        addSessionHistoryItem({
            guestName: currentGuestName,
            theme: currentTheme,
            layout: getLayoutDisplayName(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fileName,
            dataUrl
        });

        // Trigger download
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            showSuccess(`Downloaded ${fileName}!`);
        }, 'image/png', 1.0);

    } catch (error) {
        console.error('Export failed:', error);
        showDialog(
            'Export Failed',
            'Failed to generate your composite image. Please try again.',
            dialogTypes.ERROR
        );
    }
}

function printTemplate() {
    const reqCount = getRequiredPhotoCount();
    if (selectedPhotos.length !== reqCount) {
        showDialog(
            `Select ${reqCount} Photo${reqCount > 1 ? 's' : ''} First`,
            `Please capture and select ${reqCount} photo${reqCount > 1 ? 's' : ''} before printing.`,
            dialogTypes.WARNING
        );
        return;
    }

    const images = document.querySelectorAll('.final-template img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });

    Promise.all(imagePromises).then(() => {
        window.print();
    });
}

// ==========================================================================
// Visitor / Guest Handling & Shortcuts Modal
// ==========================================================================
function syncGuestName(name) {
    currentGuestName = (name || '').trim() || 'Guest Visitor';
    localStorage.setItem('photobooth_guest_name', currentGuestName);

    const headerName = document.getElementById('current-guest-name');
    if (headerName) headerName.textContent = currentGuestName;

    const exportInput = document.getElementById('export-guest-input');
    if (exportInput && document.activeElement !== exportInput) {
        exportInput.value = currentGuestName === 'Guest Visitor' ? '' : currentGuestName;
    }

    updateSmartPromptBanner();
}

function openGuestModal() {
    const backdrop = document.getElementById('guest-modal-backdrop');
    const input = document.getElementById('modal-guest-name-input');
    if (backdrop) backdrop.style.display = 'flex';
    if (input) {
        input.value = currentGuestName === 'Guest Visitor' ? '' : currentGuestName;
        setTimeout(() => input.focus(), 50);
    }
}

function closeGuestModal() {
    const backdrop = document.getElementById('guest-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
}

function openShortcutsModal() {
    const backdrop = document.getElementById('shortcuts-modal-backdrop');
    if (backdrop) backdrop.style.display = 'flex';
}

function closeShortcutsModal() {
    const backdrop = document.getElementById('shortcuts-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
}

function setQuickGuestTag(tagText) {
    const input = document.getElementById('modal-guest-name-input');
    if (input) input.value = tagText;
}

function saveGuestModal() {
    const input = document.getElementById('modal-guest-name-input');
    syncGuestName(input ? input.value : 'Guest Visitor');
    closeGuestModal();
    showSuccess(`Welcome, ${currentGuestName}!`);
}

function startNewGuestSession() {
    if (capturedPhotos.length > 0) {
        showDialog(
            'Start Next Visitor Session?',
            'This will clear the current camera shots so the next visitor can start fresh. (Saved strips in Recent Visitor Strips will stay available).',
            dialogTypes.INFO,
            [
                { text: 'Cancel', action: 'close', isPrimary: false },
                {
                    text: 'New Visitor',
                    action: 'confirm',
                    isPrimary: true,
                    callback: () => {
                        performSoftResetForNewGuest();
                    }
                }
            ]
        );
    } else {
        openGuestModal();
    }
}

function performSoftResetForNewGuest() {
    stopBurstCapture();
    capturedPhotos = [];
    selectedPhotos = [];
    selectedBorderColor = 'none';
    borderWidth = 4;
    selectedFilter = 'none';
    tileCropSettings = {};

    resetCameraFraming();
    setTileFitMode('cover');
    populateTileCropTargetSelect();
    selectPhotoFilter('none');
    selectBorderColor('none');
    updateCapturedPhotosGrid();
    updateFinalTemplate();
    goToStep(1);
    openGuestModal();
}

function addSessionHistoryItem(item) {
    sessionHistory.unshift(item);
    if (sessionHistory.length > 15) {
        sessionHistory.pop();
    }
    renderSessionHistory();
}

function renderSessionHistory() {
    const badge = document.getElementById('history-count-badge');
    if (badge) badge.textContent = sessionHistory.length;

    const listEl = document.getElementById('history-drawer-list');
    if (!listEl) return;

    if (sessionHistory.length === 0) {
        listEl.innerHTML = `
            <div class="empty-photos-placeholder">
                <i class="material-icons-outlined">photo_library</i>
                <span>Exported photo strips from visitors will appear here during this session.</span>
            </div>
        `;
        return;
    }

    listEl.innerHTML = '';
    sessionHistory.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'history-item-card';
        card.innerHTML = `
            <img src="${item.dataUrl}" alt="${escapeHtml(item.guestName)}">
            <div class="history-item-info">
                <strong>${escapeHtml(item.guestName)}</strong>
                <span>${item.layout} &bull; ${item.time}</span>
            </div>
            <button type="button" class="btn-secondary btn-sm" onclick="downloadHistoryItem(${idx})" title="Download Again">
                <i class="material-icons-outlined" style="font-size:16px;">download</i>
            </button>
        `;
        listEl.appendChild(card);
    });
}

function downloadHistoryItem(index) {
    const item = sessionHistory[index];
    if (!item) return;
    const link = document.createElement('a');
    link.download = item.fileName;
    link.href = item.dataUrl;
    link.click();
}

function clearSessionHistory() {
    sessionHistory = [];
    renderSessionHistory();
    showSuccess('Session history cleared.');
}

function toggleHistoryDrawer(forceState) {
    const drawer = document.getElementById('history-drawer');
    const backdrop = document.getElementById('history-drawer-backdrop');
    if (!drawer || !backdrop) return;

    const shouldOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');
    drawer.classList.toggle('open', shouldOpen);
    backdrop.classList.toggle('open', shouldOpen);
}

// ==========================================================================
// Keyboard Shortcuts Handler
// ==========================================================================
function isUserTypingInInput(event) {
    const el = event.target;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function isAnyModalOpen() {
    const guestModal = document.getElementById('guest-modal-backdrop');
    const shortcutsModal = document.getElementById('shortcuts-modal-backdrop');
    const mdcDialog = document.querySelector('.mdc-dialog');
    return (
        (guestModal && guestModal.style.display !== 'none') ||
        (shortcutsModal && shortcutsModal.style.display !== 'none') ||
        (mdcDialog && mdcDialog.classList.contains('mdc-dialog--open'))
    );
}

function handleKeyboardShortcuts(e) {
    // Allow Escape anytime to stop burst or close modals/drawers
    if (e.key === 'Escape') {
        if (isBurstRunning) {
            stopBurstCapture();
            return;
        }
        closeGuestModal();
        closeShortcutsModal();
        toggleHistoryDrawer(false);
        return;
    }

    if (isUserTypingInInput(e) || isAnyModalOpen()) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key.toLowerCase();

    // Capture / Take Photo (Space or C)
    if (e.code === 'Space' || key === 'c') {
        e.preventDefault();
        if (currentStep !== 2) {
            goToStep(2);
            showSuccess('Switched to Camera — press Space again to snap!');
        } else {
            triggerSingleCapture();
        }
        return;
    }

    // Burst Capture (B)
    if (key === 'b') {
        e.preventDefault();
        if (currentStep !== 2) {
            goToStep(2);
        }
        if (isBurstRunning) {
            stopBurstCapture();
        } else {
            startBurstCapture();
        }
        return;
    }

    // Next Step (Right Arrow, N, or Enter)
    if (e.key === 'ArrowRight' || key === 'n' || e.key === 'Enter') {
        e.preventDefault();
        nextStep();
        return;
    }

    // Previous Step (Left Arrow or Backspace)
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        prevStep();
        return;
    }

    // Direct Step Navigation (1, 2, 3, 4)
    if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
        goToStep(parseInt(key, 10));
        return;
    }

    // Mirror Toggle (M)
    if (key === 'm') {
        e.preventDefault();
        toggleCameraMirror();
        showSuccess(`Camera mirror ${isCameraMirrored ? 'enabled' : 'disabled'}`);
        return;
    }

    // Export / Download (E or D)
    if (key === 'e' || key === 'd') {
        e.preventDefault();
        exportImage();
        return;
    }

    // Print (P)
    if (key === 'p') {
        e.preventDefault();
        printTemplate();
        return;
    }

    // Reset All (R)
    if (key === 'r') {
        e.preventDefault();
        resetAll();
        return;
    }

    // Shortcuts Help (? or /)
    if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        openShortcutsModal();
    }
}

// ==========================================================================
// Full Reset & Notifications
// ==========================================================================
function resetAll() {
    showDialog(
        'Confirm Full Reset',
        'This will clear all captured photos, selections, and filters. Are you sure?',
        dialogTypes.WARNING,
        [
            { text: 'Cancel', action: 'close', isPrimary: false },
            {
                text: 'Reset All',
                action: 'reset',
                isPrimary: true,
                callback: () => {
                    stopBurstCapture();
                    capturedPhotos = [];
                    selectedPhotos = [];
                    selectedTemplate = 0;
                    selectedLayout = '2x2';
                    selectedBorderColor = 'none';
                    borderWidth = 4;
                    selectedFilter = 'none';
                    tileCropSettings = {};

                    resetCameraFraming();
                    setTileFitMode('cover');
                    selectLayout('2x2');
                    selectPhotoFilter('none');
                    selectBorderColor('none');

                    const slider = document.getElementById('border-width-slider');
                    if (slider) slider.value = 4;
                    const valEl = document.getElementById('border-width-value');
                    if (valEl) valEl.textContent = '4';

                    updateCapturedPhotosGrid();
                    updateFinalTemplate();
                    goToStep(1);
                    showSuccess('All content has been reset!');
                }
            }
        ]
    );
}

let snackbar;
let dialog;

function initializeNotifications() {
    const snackbarEl = document.querySelector('.mdc-snackbar');
    if (snackbarEl && window.mdc?.snackbar) {
        snackbar = new mdc.snackbar.MDCSnackbar(snackbarEl);
    }
    const dialogEl = document.querySelector('.mdc-dialog');
    if (dialogEl && window.mdc?.dialog) {
        dialog = new mdc.dialog.MDCDialog(dialogEl);
    }
}

function showSuccess(message) {
    if (snackbar) {
        snackbar.labelText = message;
        snackbar.timeoutMs = 3500;
        snackbar.open();
    }
}

const dialogTypes = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info'
};

function showDialog(title, message, type = dialogTypes.INFO, buttons = []) {
    const dialogEl = document.querySelector('.mdc-dialog');
    if (!dialogEl) return;

    const dialogTitle = dialogEl.querySelector('.mdc-dialog__title');
    const dialogContent = dialogEl.querySelector('.mdc-dialog__content');
    const dialogActions = dialogEl.querySelector('.mdc-dialog__actions');

    dialogTitle.textContent = title;
    dialogContent.textContent = message;

    dialogTitle.className = 'mdc-dialog__title';
    dialogTitle.classList.add(`mdc-dialog__title--${type}`);

    dialogActions.innerHTML = '';

    if (buttons.length === 0) {
        buttons = [{ text: 'OK', action: 'close', isPrimary: true }];
    }

    buttons.forEach(button => {
        const btnElement = document.createElement('button');
        btnElement.className = `mdc-button ${button.isPrimary ? 'mdc-button--raised' : 'mdc-button--outlined'}`;
        btnElement.setAttribute('data-mdc-dialog-action', button.action || 'close');
        btnElement.innerHTML = `
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__label">${button.text}</span>
        `;
        if (button.callback) {
            btnElement.addEventListener('click', button.callback);
        }
        dialogActions.appendChild(btnElement);
    });

    const mdcDialog = new mdc.dialog.MDCDialog(dialogEl);
    mdcDialog.open();
    return mdcDialog;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ==========================================================================
// Application Bootstrap
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    initializeNotifications();
    syncGuestName(currentGuestName);
    setAppTheme('halloween-2026');
    initializeTemplates();
    syncCameraAspectRatioToTile();
    populateTileCropTargetSelect();
    updateCapturedPhotosGrid();
    updateFinalTemplate();
    renderSessionHistory();
    goToStep(1);
    initCamera();

    // Register global keyboard shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);

    // Observe preview stage resize for smooth 1080x1080 scaling
    const stage = document.getElementById('final-template-stage');
    if (stage && window.ResizeObserver) {
        const ro = new ResizeObserver(() => scaleLivePreviewStage());
        ro.observe(stage);
    } else {
        window.addEventListener('resize', scaleLivePreviewStage);
    }

    // Enter key inside visitor modal saves guest name
    const guestModalInput = document.getElementById('modal-guest-name-input');
    if (guestModalInput) {
        guestModalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveGuestModal();
        });
    }
});
