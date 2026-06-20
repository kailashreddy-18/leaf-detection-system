document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // --- STATE MANAGEMENT ---
  const state = {
    currentView: 'home',
    stats: {
      total: 248,
      healthy: 142,
      diseased: 106,
      earlyBlight: 46,
      lateBlight: 38,
      brownSpot: 22
    },
    uploadedImageSrc: null,
    uploadedFileName: '',
    isProcessing: false
  };

  // --- VIEW ROUTING ---
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  function switchView(targetViewId) {
    if (state.isProcessing) return; // Prevent navigation during active CV analysis

    // Update links styling
    navLinks.forEach(link => {
      if (link.getAttribute('data-target') === targetViewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle active section
    viewSections.forEach(section => {
      if (section.id === targetViewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    state.currentView = targetViewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile menu if open
    navMenu.classList.remove('open');
    menuToggle.innerHTML = '<i data-lucide="menu"></i>';
    lucide.createIcons();
  }

  // Navigation click events
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-target');
      switchView(target);
    });
  });

  // Logo navigation click
  document.getElementById('header-logo').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home');
  });

  // Home page CTA buttons routing
  document.getElementById('hero-upload-btn').addEventListener('click', () => {
    switchView('detection');
  });

  document.getElementById('hero-learn-btn').addEventListener('click', () => {
    switchView('about');
  });

  // Mobile hamburger menu toggle
  menuToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('open');
    if (isOpen) {
      navMenu.classList.remove('open');
      menuToggle.innerHTML = '<i data-lucide="menu"></i>';
    } else {
      navMenu.classList.add('open');
      menuToggle.innerHTML = '<i data-lucide="x"></i>';
    }
    lucide.createIcons();
  });

  // --- DRAG AND DROP FILE UPLOAD ---
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const uploadActions = document.getElementById('upload-actions');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resetBtn = document.getElementById('reset-btn');
  const scanLine = document.getElementById('scan-line');
  const scannerOverlay = document.getElementById('scanner-overlay');

  // Prevent defaults for drag drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Visual dragover hints
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
  });

  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) handleFiles(files[0]);
  });

  // Handle selected files via file-input browser
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length) handleFiles(fileInput.files[0]);
  });

  function handleFiles(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    state.uploadedFileName = file.name.toLowerCase();
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      state.uploadedImageSrc = reader.result;
      
      // Update UI displays
      previewImage.src = reader.result;
      dropZone.style.display = 'none';
      previewContainer.style.display = 'block';
      uploadActions.style.display = 'flex';
      
      // Clear previous results card if any
      document.getElementById('result-card').style.display = 'none';
      document.getElementById('result-placeholder').style.display = 'flex';

      // Log upload action to terminal
      addTerminalLog(`> Loaded image: ${file.name} (${(file.size/1024).toFixed(1)} KB)`, 'system');
      addTerminalLog(`> Ready for image processing. Press "Run Analysis".`, 'process');
    };
  }

  function resetUpload() {
    state.uploadedImageSrc = null;
    state.uploadedFileName = '';
    fileInput.value = '';
    
    previewImage.src = '';
    previewContainer.style.display = 'none';
    uploadActions.style.display = 'none';
    dropZone.style.display = 'block';
    
    document.getElementById('result-card').style.display = 'none';
    document.getElementById('result-placeholder').style.display = 'flex';
    
    // Reset terminal logs
    const terminalLogs = document.getElementById('pipeline-logs');
    terminalLogs.innerHTML = '<div class="pipeline-log-line system">> System online. Awaiting image buffer...</div>';
  }

  resetBtn.addEventListener('click', resetUpload);

  // --- MOCK COMPUTER VISION PIPELINE ---
  const diseaseData = {
    healthy: {
      title: 'Healthy Leaf',
      crop: 'Normal baseline foliage matches healthy standard chlorophyll',
      symptoms: 'No lesions, dark brown halos, or water-soaked spots. The leaf exhibits strong uniform green pigment, normal turgor, and healthy structure.',
      causes: 'Proper soil balance, standard sunlight duration, and moisture maintenance. Free from fungal spores and pest damage.',
      treatment: [
        'Maintain balanced watering at the root zone.',
        'Continue regular soil checks and standard nitrogen-potassium levels.',
        'No fungicides required. Maintain biological pest defense.'
      ],
      iconClass: 'healthy',
      iconName: 'smile',
      confidenceBase: 97.4
    },
    early_blight: {
      title: 'Tomato Early Blight',
      crop: 'Crop Host: Tomato (Solanum lycopersicum)',
      symptoms: 'Concentric dark brown rings resembling targets on older, lower leaves. Leaves yellow (chlorosis) around spots and fall off early.',
      causes: 'Alternaria solani fungus, thriving in warm, damp weather with overhead irrigation water splashing spores.',
      treatment: [
        'Apply copper-based organic fungicides immediately.',
        'Prune lower infected foliage and destroy them (do not compost).',
        'Transition to drip irrigation to keep leaf surfaces dry.'
      ],
      iconClass: 'diseased',
      iconName: 'bug',
      confidenceBase: 94.2
    },
    late_blight: {
      title: 'Tomato Late Blight',
      crop: 'Crop Host: Tomato (Solanum lycopersicum)',
      symptoms: 'Large, dark green water-soaked spots changing rapidly to purplish-black lesions. Fuzzy white mold structures on the undersides.',
      causes: 'Phytophthora infestans water mold, triggered by cool, highly humid conditions and long periods of leaf wetness.',
      treatment: [
        'Spray preventative organic neem oil or bio-fungicides.',
        'Remove and quarantine infected plants immediately to prevent canopy spread.',
        'Improve plant spacing to maximize dry airflow.'
      ],
      iconClass: 'diseased',
      iconName: 'shield-alert',
      confidenceBase: 91.5
    },
    brown_spot: {
      title: 'Rice Brown Spot',
      crop: 'Crop Host: Rice (Oryza sativa)',
      symptoms: 'Oval, sesame seed-shaped light-brown spots with grey centers on the leaf blades, spreading to hulls and leading to empty grains.',
      causes: 'Bipolaris oryzae fungus, primarily attacking plants growing in nutrient-deficient, poorly drained soils.',
      treatment: [
        'Incorporate balanced fertilizers, heavily prioritizing potassium.',
        'Treat crop seeds with hot water (54°C) prior to seedling planting.',
        'Perform systematic crop rotation and remove alternative weed hosts.'
      ],
      iconClass: 'diseased',
      iconName: 'activity',
      confidenceBase: 88.7
    }
  };

  function addTerminalLog(text, className) {
    const logsContainer = document.getElementById('pipeline-logs');
    const logLine = document.createElement('div');
    logLine.className = `pipeline-log-line ${className}`;
    logLine.textContent = text;
    logsContainer.appendChild(logLine);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  analyzeBtn.addEventListener('click', () => {
    if (state.isProcessing || !state.uploadedImageSrc) return;

    state.isProcessing = true;
    analyzeBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Show scanner animations
    scanLine.style.display = 'block';
    scannerOverlay.style.display = 'flex';

    // Clear previous logs and run steps
    const logsContainer = document.getElementById('pipeline-logs');
    logsContainer.innerHTML = '';
    
    const steps = [
      { text: '> Loading image matrix into NumPy array...', delay: 200, class: 'system' },
      { text: `> Matrix parsed. Dimensions: 1200 x 980 | Channel: RGB.`, delay: 500, class: 'system' },
      { text: '> Resizing image to standard 512 x 512 pixels...', delay: 800, class: 'process' },
      { text: '> Converting RGB color coordinates to HSV channel space...', delay: 1100, class: 'process' },
      { text: '> Running Gaussian Blur filter (kernel size = 5) for noise reduction...', delay: 1400, class: 'process' },
      { text: '> Applying color threshold mask to isolate chlorophyll (green pixels)...', delay: 1700, class: 'process' },
      { text: '> Computing Otsu thresholding to segment lesions from leaf blades...', delay: 2000, class: 'process' },
      { text: '> Finding lesion contours using cv2.findContours()...', delay: 2300, class: 'process' },
      { text: '> Extracting shape parameters and lesion-to-leaf area ratio...', delay: 2600, class: 'process' },
      { text: '> Analyzing feature vector in classification model...', delay: 2900, class: 'process' },
      { text: '> Classification complete.', delay: 3200, class: 'success' }
    ];

    steps.forEach(step => {
      setTimeout(() => {
        addTerminalLog(step.text, step.class);
      }, step.delay);
    });

    // Complete processing
    setTimeout(() => {
      // Determine disease based on file name contents or fall back to random selection
      let diagnosedKey = '';
      if (state.uploadedFileName.includes('early') || state.uploadedFileName.includes('blight_early')) {
        diagnosedKey = 'early_blight';
      } else if (state.uploadedFileName.includes('late') || state.uploadedFileName.includes('blight_late')) {
        diagnosedKey = 'late_blight';
      } else if (state.uploadedFileName.includes('brown') || state.uploadedFileName.includes('spot')) {
        diagnosedKey = 'brown_spot';
      } else if (state.uploadedFileName.includes('healthy') || state.uploadedFileName.includes('normal')) {
        diagnosedKey = 'healthy';
      } else {
        // Randomly pick key if no obvious match
        const keys = Object.keys(diseaseData);
        diagnosedKey = keys[Math.floor(Math.random() * keys.length)];
      }

      const disease = diseaseData[diagnosedKey];
      const randomOffset = (Math.random() * 4 - 2).toFixed(1); // -2% to +2%
      const finalConfidence = (disease.confidenceBase + parseFloat(randomOffset)).toFixed(1);

      // Hide scanner animations
      scanLine.style.display = 'none';
      scannerOverlay.style.display = 'none';

      // Show Result Card & Hide Placeholder
      document.getElementById('result-placeholder').style.display = 'none';
      const resultCard = document.getElementById('result-card');
      resultCard.style.display = 'block';

      // Update Result details
      document.getElementById('confidence-badge').textContent = `${finalConfidence}% Match`;
      document.getElementById('disease-title').textContent = disease.title;
      document.getElementById('crop-type').textContent = disease.crop;
      document.getElementById('symptom-text').textContent = disease.symptoms;
      document.getElementById('cause-text').textContent = disease.causes;

      // Update Icon
      const diseaseIconDiv = document.getElementById('disease-icon');
      diseaseIconDiv.className = `disease-icon ${disease.iconClass}`;
      diseaseIconDiv.innerHTML = disease.iconClass === 'healthy' 
        ? '<i data-lucide="smile"></i>' 
        : '<i data-lucide="frown"></i>';

      // Update Treatments List
      const treatmentList = document.getElementById('treatment-list');
      treatmentList.innerHTML = '';
      disease.treatment.forEach(treatmentText => {
        const li = document.createElement('li');
        li.innerHTML = `<i data-lucide="check-circle-2"></i><span>${treatmentText}</span>`;
        treatmentList.appendChild(li);
      });

      // Final terminal message
      addTerminalLog(`> Diagnostic target identified: ${disease.title} (Confidence: ${finalConfidence}%)`, 'success');
      addTerminalLog(`> Results pushed to local dashboard statistics database.`, 'system');

      // Update State Statistics
      state.stats.total += 1;
      if (diagnosedKey === 'healthy') {
        state.stats.healthy += 1;
      } else {
        state.stats.diseased += 1;
        if (diagnosedKey === 'early_blight') state.stats.earlyBlight += 1;
        if (diagnosedKey === 'late_blight') state.stats.lateBlight += 1;
        if (diagnosedKey === 'brown_spot') state.stats.brownSpot += 1;
      }

      // Refresh charts and numbers
      updateDashboardUI();

      // Reset controls
      state.isProcessing = false;
      analyzeBtn.disabled = false;
      resetBtn.disabled = false;
      
      lucide.createIcons();

      // Auto scroll to results in mobile view
      if (window.innerWidth <= 1024) {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    }, 3500);
  });

  // --- RESULT TABS (Inside detection result card) ---
  const resultTabBtns = document.querySelectorAll('.result-tab-btn');
  const resultTabContents = document.querySelectorAll('.result-tab-content');

  resultTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');

      resultTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      resultTabContents.forEach(content => {
        if (content.id === `res-${tabTarget}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // --- DISEASE ENCYCLOPEDIA (Info Page Tabs & Selector) ---
  const selectorBtns = document.querySelectorAll('.selector-btn');
  const diseaseInfoDisplays = document.querySelectorAll('.disease-info-display');

  selectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedDisease = btn.getAttribute('data-disease');

      // Update selector buttons styling
      selectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle display panels
      diseaseInfoDisplays.forEach(display => {
        if (display.id === `info-${selectedDisease}`) {
          display.classList.add('active');
          setupInfoTabs(display); // Reset default tab on view
        } else {
          display.classList.remove('active');
        }
      });
      lucide.createIcons();
    });
  });

  function setupInfoTabs(activeDisplayPanel) {
    const infoTabBtns = activeDisplayPanel.querySelectorAll('.info-tab-btn');
    const infoTabPanes = activeDisplayPanel.querySelectorAll('.info-tab-pane');

    // Ensure first tab is default active
    infoTabBtns.forEach((btn, idx) => {
      if (idx === 0) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    infoTabPanes.forEach((pane, idx) => {
      if (idx === 0) pane.classList.add('active');
      else pane.classList.remove('active');
    });

    // Add click events to tabs within this panel
    infoTabBtns.forEach(btn => {
      // Clear old listeners to avoid multiple fires
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', () => {
        const tabTarget = newBtn.getAttribute('data-tab');
        const activeDiseaseId = activeDisplayPanel.id.replace('info-', '');

        infoTabBtns.forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');
        activeDisplayPanel.querySelectorAll('.info-tab-btn').forEach(b => {
          if (b.getAttribute('data-tab') === tabTarget) b.classList.add('active');
          else b.classList.remove('active');
        });

        infoTabPanes.forEach(pane => {
          if (pane.id === `${activeDiseaseId}-${tabTarget}`) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      });
    });
  }

  // Initialize info tabs for default active healthy display
  setupInfoTabs(document.getElementById('info-healthy'));

  // --- DASHBOARD CHARTS REDRAW ---
  function updateDashboardUI() {
    // 1. Update text metrics numbers
    document.getElementById('dash-total').textContent = state.stats.total;
    document.getElementById('dash-healthy').textContent = state.stats.healthy;
    document.getElementById('dash-diseased').textContent = state.stats.diseased;

    // 2. Redraw Donut Chart
    const total = state.stats.total;
    const healthy = state.stats.healthy;
    const diseased = state.stats.diseased;
    const healthyPercent = ((healthy / total) * 100).toFixed(0);
    const diseasedPercent = 100 - healthyPercent;

    document.getElementById('pie-center-text').textContent = `${healthyPercent}% OK`;

    // Circumference of our SVG Donut circle (r=40) is 2 * pi * 40 = 251.327
    const circumference = 251.327;
    const healthyStroke = (healthy / total) * circumference;
    const diseasedStroke = (diseased / total) * circumference;

    const healthySegment = document.getElementById('pie-segment-healthy');
    const diseasedSegment = document.getElementById('pie-segment-diseased');

    healthySegment.setAttribute('stroke-dasharray', `${healthyStroke} ${circumference}`);
    diseasedSegment.setAttribute('stroke-dasharray', `${diseasedStroke} ${circumference}`);
    diseasedSegment.setAttribute('stroke-dashoffset', -healthyStroke);

    // Update legend values if text exists
    const legendSpans = document.querySelectorAll('#dashboard .chart-legend')[0].querySelectorAll('span');
    legendSpans[0].textContent = `Healthy (${((healthy / total) * 100).toFixed(1)}%)`;
    legendSpans[1].textContent = `Diseased (${((diseased / total) * 100).toFixed(1)}%)`;

    // 3. Redraw Bar Chart
    const early = state.stats.earlyBlight;
    const late = state.stats.lateBlight;
    const brown = state.stats.brownSpot;
    const maxVal = Math.max(early, late, brown, 10); // Minimum scale of 10
    
    // Max height in our SVG coordinate system is 90px (from y=10 to y=100)
    const scaleFactor = 90 / maxVal;

    const barEarly = document.getElementById('bar-early-blight');
    const valEarlyText = document.getElementById('val-early-blight');
    const earlyHeight = early * scaleFactor;
    barEarly.setAttribute('height', earlyHeight);
    barEarly.setAttribute('y', 100 - earlyHeight);
    valEarlyText.textContent = early;
    valEarlyText.setAttribute('y', Math.min(100 - earlyHeight - 4, 95));

    const barLate = document.getElementById('bar-late-blight');
    const valLateText = document.getElementById('val-late-blight');
    const lateHeight = late * scaleFactor;
    barLate.setAttribute('height', lateHeight);
    barLate.setAttribute('y', 100 - lateHeight);
    valLateText.textContent = late;
    valLateText.setAttribute('y', Math.min(100 - lateHeight - 4, 95));

    const barBrown = document.getElementById('bar-brown-spot');
    const valBrownText = document.getElementById('val-brown-spot');
    const brownHeight = brown * scaleFactor;
    barBrown.setAttribute('height', brownHeight);
    barBrown.setAttribute('y', 100 - brownHeight);
    valBrownText.textContent = brown;
    valBrownText.setAttribute('y', Math.min(100 - brownHeight - 4, 95));
  }

  // --- CONTACT FORM & MODAL HANDLER ---
  const feedbackForm = document.getElementById('feedback-form');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Perform form validations
    const name = document.getElementById('fb-name').value.trim();
    const email = document.getElementById('fb-email').value.trim();
    const role = document.getElementById('fb-role').value;
    const message = document.getElementById('fb-message').value.trim();

    if (!name || !email || !role || !message) {
      alert('Please fill out all the fields in the feedback form.');
      return;
    }

    // Show Success Modal
    modalOverlay.style.display = 'flex';
  });

  // Modal Close Action
  modalCloseBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
    feedbackForm.reset(); // Reset form inputs after submission
  });

  // Click outside modal card to close
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
      feedbackForm.reset();
    }
  });
});
