(function () {

    async function injectAsync(id, url) {
        var el = document.getElementById(id);
        if (!el) return;
        try {
            var res = await fetch(url);
            if (!res.ok) return;
            var html = await res.text();

            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var frag = document.createDocumentFragment();
            while (doc.body.firstChild) frag.appendChild(doc.body.firstChild);
            el.parentNode.replaceChild(frag, el);
        } catch (e) {
            console.warn('Failed to inject', url, e);
        }
    }

    // Resolve base path from script src so it works from any sub-folder
    var scripts = document.getElementsByTagName('script');
    var scriptSrc = scripts[scripts.length - 1].src;
    var base = scriptSrc ? scriptSrc.replace(/assets\/js\/includes\.js.*/, '') : '';

    var cb = Date.now();
    
    // Inject header and footer asynchronously, then run initializers
    Promise.all([
        injectAsync('site-header', base + 'assets/includes/header.html?' + cb),
        injectAsync('site-footer', base + 'assets/includes/footer.html?' + cb)
    ]).then(function () {
        // Guarantee the 3rd city card always has its content
        var cards = document.querySelectorAll('.footer-city-card');
        if (cards.length >= 3 && !cards[2].querySelector('.footer-city-info')) {
            var info = document.createElement('div');
            info.className = 'footer-city-info';
            info.innerHTML = '<div class="footer-city-name"><i class="ri-map-pin-2-fill"></i> Yekaterinburg</div>' +
                '<p class="footer-city-addr">ulitsa Belinskogo, off. 108,<br>Ekaterinburg, Sverdlovsk Oblast, 620063, Russia</p>';
            cards[2].appendChild(info);
        }

        // Active nav link highlighting
        var page = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.header-nav .nav-link').forEach(function (a) {
            var href = (a.getAttribute('href') || '').split('#')[0].split('/').pop();
            if (href && href === page) a.classList.add('active');
        });

        // Quote modal
        var modal = document.getElementById('quoteModal');
        var closeBtn = document.getElementById('quoteModalClose');
        if (modal) {
            document.addEventListener('click', function (e) {
                var btn = e.target.closest('.quote-btn');
                if (btn && !btn.classList.contains('customize-nav-btn')) {
                    e.preventDefault();
                    modal.classList.add('qm-open');
                    document.body.style.overflow = 'hidden';
                }
            });
            function closeModal() {
                modal.classList.remove('qm-open');
                document.body.style.overflow = '';
            }
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeModal();
            });
        }

        // Customise Request modal — event delegation so CMS-injected flip cards also work
        var customiseModal = document.getElementById('customiseModal');
        var customiseCloseBtn = document.getElementById('customiseModalClose');
        if (customiseModal) {
            document.addEventListener('click', function (e) {
                if (e.target.closest('.customize-nav-btn')) {
                    e.preventDefault();
                    customiseModal.classList.add('qm-open');
                    document.body.style.overflow = 'hidden';
                }
            });
            function closeCustomiseModal() {
                customiseModal.classList.remove('qm-open');
                document.body.style.overflow = '';
            }
            if (customiseCloseBtn) customiseCloseBtn.addEventListener('click', closeCustomiseModal);
            customiseModal.addEventListener('click', function (e) {
                if (e.target === customiseModal) closeCustomiseModal();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeCustomiseModal();
            });
        }

        // Quote form submit handler (scripts inside injected HTML don't execute)
        var quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var btn = quoteForm.querySelector('button[type="submit"]');
                var origText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="icon"><img src="/assets/img/arrow-icon-header.svg" alt=""></span>SENDING…';

                var payload = Object.fromEntries(new FormData(quoteForm));
                // FormData skips <select> whose selected option is disabled — read them manually
                quoteForm.querySelectorAll('select[name]').forEach(function (sel) {
                    if (!(sel.name in payload)) payload[sel.name] = sel.value;
                });

                fetch('/api/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    btn.disabled = false;
                    btn.innerHTML = origText;
                    if (data.success) {
                        var el = document.getElementById('quoteSuccess');
                        if (!el) { el = document.createElement('div'); el.id = 'quoteSuccess'; quoteForm.appendChild(el); }
                        el.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:16px;padding:14px 18px;background:#eafaf1;border:1.5px solid #69AA48;border-radius:10px;color:#1a6b35;font-size:15px;font-weight:500;';
                        el.innerHTML = '<span style="font-size:22px;color:#69AA48;">&#10003;</span>Your request has been sent successfully! Our team will get back to you shortly.';
                    } else {
                        var er = document.getElementById('quoteFormError');
                        if (!er) { er = document.createElement('div'); er.id = 'quoteFormError'; quoteForm.appendChild(er); }
                        er.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:16px;padding:14px 18px;background:#fff0f0;border:1.5px solid #e53935;border-radius:10px;color:#c62828;font-size:15px;font-weight:500;';
                        er.innerHTML = '<span style="font-size:20px;">&#9888;</span>' + (data.error || 'Something went wrong. Please try again.');
                    }
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.innerHTML = origText;
                    var er = document.getElementById('quoteFormError');
                    if (!er) { er = document.createElement('div'); er.id = 'quoteFormError'; quoteForm.appendChild(er); }
                    er.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:16px;padding:14px 18px;background:#fff0f0;border:1.5px solid #e53935;border-radius:10px;color:#c62828;font-size:15px;font-weight:500;';
                    er.innerHTML = '<span style="font-size:20px;">&#9888;</span>Network error. Please check your connection and try again.';
                });
            });
        }

        // Signal that the header is fully injected and ready
        document.dispatchEvent(new Event('headerReady'));
    });

    // Newsletter Lottie icon
    function initNewsletterLottie() {
        var el = document.getElementById('newsletter-lottie-icon');
        if (!el || !window.lottie) return;
        lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: base + 'assets/img/email.json'
        });
    }

    (function loadLottie() {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
        s.onload = function () {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initNewsletterLottie);
            } else {
                initNewsletterLottie();
            }
        };
        document.head.appendChild(s);
    })();


})();
