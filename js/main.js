// Initialize EmailJS
(function() {
    emailjs.init("mnokoLGrRdxDKVI4y");
})();

const EMAIL_SERVICE_ID = "service_ydmcdh8";
const CUSTOMER_TEMPLATE = "template_qwlvpje"; // Your existing template ID
const ADMIN_TEMPLATE = "template_qwlvpje"; // Use SAME template for now 

let currentSlide = 0;

// Modal functions
function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('contactFormModal').reset();
        document.body.style.overflow = '';
    }
}

function openSuccessModal() {
    closeContactModal();
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Image Slider Functions
function nextSlide() {
    const container = document.getElementById('sliderContainer');
    if (!container) return;
    
    const slides = container.querySelectorAll('.slider-image');
    currentSlide = (currentSlide + 1) % slides.length;
    container.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function prevSlide() {
    const container = document.getElementById('sliderContainer');
    if (!container) return;
    
    const slides = container.querySelectorAll('.slider-image');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    container.style.transform = `translateX(-${currentSlide * 100}%)`;
}

let autoSlideInterval = setInterval(nextSlide, 5000);

const initSlider = () => {
    const slider = document.querySelector('.image-slider');
    if (slider) {
        slider.addEventListener('mouseenter', () => {
            clearInterval(autoSlideInterval);
        });
        
        slider.addEventListener('mouseleave', () => {
            autoSlideInterval = setInterval(nextSlide, 5000);
        });
    }
};

// Scroll reveal function
const scrollReveal = () => {
    const reveals = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    
    reveals.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('active');
        }
    });
};

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Add animations-ready class
    setTimeout(() => {
        document.body.classList.add('animations-ready');
        scrollReveal();
    }, 100);
    
    // Book buttons
    const bookBtn = document.getElementById('bookAppointmentBtn');
    const mobileBookBtn = document.getElementById('mobileBookBtn');
    const heroBookBtn = document.getElementById('heroBookBtn');
    
    if (bookBtn) bookBtn.addEventListener('click', (e) => { e.preventDefault(); openContactModal(); });
    if (mobileBookBtn) mobileBookBtn.addEventListener('click', (e) => { e.preventDefault(); openContactModal(); });
    if (heroBookBtn) heroBookBtn.addEventListener('click', (e) => { e.preventDefault(); openContactModal(); });
    
    // Close modal on backdrop click
    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        contactModal.addEventListener('click', function(e) {
            if (e.target === this) closeContactModal();
        });
    }
    
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === this) closeSuccessModal();
        });
    }
    
    const closeSuccessBtn = document.getElementById('closeSuccessModal');
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeSuccessModal);
    
    // ============================================
    // BOOKING FORM SUBMISSION 
    // ============================================
    const contactForm = document.getElementById('contactFormModal');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const contactViaArray = formData.getAll('contactVia');
            
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                name: formData.get('firstName') + ' ' + formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                contactVia: contactViaArray.length > 0 ? contactViaArray.join(', ') : 'Not specified',
                service: formData.get('serviceFor'),
                notes: formData.get('message') || 'No additional information provided',
                date: new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                }),
                time: new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', minute: '2-digit' 
                }),
                timestamp: new Date().toLocaleString()
            };
            
            try {
                const submitBtn = this.querySelector('.btn-submit');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = 'Sending...';
                submitBtn.disabled = true;
                
                // 1. Send confirmation to CUSTOMER
                const customerParams = {
                    to_name: data.name,
                    to_email: data.email,
                    from_name: 'Lavender Home Care',
                    from_email: 'info@lavenderhomecare.co.za',
                    phone: data.phone,
                    contact_method: data.contactVia,
                    service_for: data.service,
                    message: data.notes,
                    date: data.date,
                    time: data.time
                };
                
                console.log('Sending customer email with params:', customerParams);
                await emailjs.send(EMAIL_SERVICE_ID, CUSTOMER_TEMPLATE, customerParams);

                // 2. Send notification to ADMIN (using same template)
                const adminParams = {
                    to_name: 'Lavender Home Care Admin',
                    to_email: 'info@lavenderhomecare.co.za',
                    from_name: 'Lavender Home Care Booking System',
                    from_email: data.email,
                    date: data.date,
                    time: data.time,
                    service_for: data.service,
                    phone: data.phone,
                    contact_method: data.contactVia,
                    message: `NEW BOOKING REQUEST

Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Service: ${data.service}
Contact via: ${data.contactVia}

Customer Notes: ${data.notes}`
};

                console.log('Sending admin email with params:', adminParams);
                await emailjs.send(EMAIL_SERVICE_ID, ADMIN_TEMPLATE, adminParams);

                // 3. Save to Firebase (if configured)
                if (typeof db !== 'undefined') {
                    await db.collection('bookings').add({
                        ...data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'new'
                    });
                }
                
                this.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                openSuccessModal();
                
                console.log('✅ Booking submitted successfully');
                
            } catch (error) {
                console.error('❌ Submission failed:', error);
                alert('There was an error submitting your request. Please try again or contact us directly at info@lavenderhomecare.co.za');
                
                const submitBtn = this.querySelector('.btn-submit');
                submitBtn.innerHTML = 'Submit Request';
                submitBtn.disabled = false;
            }
        });
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (mobileMenu) mobileMenu.classList.add('hidden');
            }
        });
    });

    // Active nav on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
        
        scrollReveal();
    });
    
    // Close modal with Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeContactModal();
            closeSuccessModal();
        }
    });
    
    initSlider();
});