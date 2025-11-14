// Africa-RII Website - JavaScript Functionality

// ========================================
// Navigation Scroll Effect
// ========================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ========================================
// Mobile Menu Toggle
// ========================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.getElementById('navLinks');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenuToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// ========================================
// Hero Slideshow
// ========================================
const slides = document.querySelectorAll('.slide');
const slideIndicatorsContainer = document.getElementById('slideIndicators');

if (slides.length > 0) {
    let currentSlide = 0;
    
    slides[currentSlide].classList.add('active');
    
    slides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('slide-indicator');
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(index));
        if (slideIndicatorsContainer) {
            slideIndicatorsContainer.appendChild(indicator);
        }
    });
    
    const indicators = document.querySelectorAll('.slide-indicator');
    
    function goToSlide(n) {
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');
        
        currentSlide = n;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;
        
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }
    
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }
    
    setInterval(nextSlide, 5000);
}

// ========================================
// Animated Counters
// ========================================
const statNumbers = document.querySelectorAll('.stat-number');

const animateCounters = () => {
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                stat.textContent = Math.ceil(current);
                setTimeout(updateCounter, 20);
            } else {
                stat.textContent = target;
            }
        };
        
        updateCounter();
    });
};

const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

const statsSection = document.getElementById('impact-stats');
if (statsSection) {
    observer.observe(statsSection);
}

// ========================================
// Contact Form Submission
// ========================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    const fileUploadZone = document.getElementById('fileUploadZone');
    const fileUpload = document.getElementById('file-upload');
    const fileList = document.getElementById('fileList');
    let selectedFiles = [];
    
    if (fileUploadZone && fileUpload) {
        fileUploadZone.addEventListener('click', () => fileUpload.click());
        
        fileUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadZone.style.borderColor = '#3B82F6';
            fileUploadZone.style.background = '#DBEAFE';
        });
        
        fileUploadZone.addEventListener('dragleave', () => {
            fileUploadZone.style.borderColor = '';
            fileUploadZone.style.background = '';
        });
        
        fileUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadZone.style.borderColor = '';
            fileUploadZone.style.background = '';
            
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });
        
        fileUpload.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });
    }
    
    function handleFiles(files) {
        selectedFiles = files;
        displayFileList();
    }
    
    function displayFileList() {
        if (!fileList) return;
        
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name} (${formatFileSize(file.size)})</span>
                <button type="button" class="file-item-remove" onclick="removeFile(${index})">Remove</button>
            `;
            fileList.appendChild(fileItem);
        });
    }
    
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        displayFileList();
    };
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formMessage = document.getElementById('formMessage');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            if (selectedFiles.length > 0) {
                const fileFormData = new FormData();
                selectedFiles.forEach(file => {
                    fileFormData.append('file', file);
                });
                
                const fileResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: fileFormData
                });
                
                if (!fileResponse.ok) {
                    throw new Error('File upload failed');
                }
            }
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Thank you! Your message has been sent successfully.';
                contactForm.reset();
                selectedFiles = [];
                if (fileList) fileList.innerHTML = '';
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Oops! Something went wrong. Please try again.';
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

// ========================================
// Donation Form Submission
// ========================================
const donateForm = document.getElementById('donateForm');

if (donateForm) {
    donateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = donateForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        
        try {
            const formData = {
                name: document.getElementById('donate-name').value,
                email: document.getElementById('donate-email').value,
                amount: document.getElementById('donate-amount').value,
                message: document.getElementById('donate-message').value
            };
            
            const response = await fetch('/api/donate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Thank you for your generous support! We will contact you shortly with donation details.');
                donateForm.reset();
            } else {
                throw new Error(data.error || 'Failed to submit donation');
            }
        } catch (error) {
            alert('Oops! Something went wrong. Please try again.');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Donation Interest';
        }
    });
}

// ========================================
// Smooth Scrolling for Anchor Links
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});