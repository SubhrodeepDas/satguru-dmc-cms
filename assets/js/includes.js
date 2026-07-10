(function () {

    function cmsApiBase() {
        if (window.satguruCMS && window.satguruCMS.url) return window.satguruCMS.url;
        if (typeof window.getCmsUrl === 'function') return window.getCmsUrl();
        var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        return local ? 'http://localhost:10006' : 'http://194.67.119.189:10006';
    }

    function assetUrl(path) {
        if (typeof window.satguruUrl === 'function') return "https://satgurutravel.ru/dmc" + path;
        return path;
    }

    async function injectAsync(id, url) {
        var el = document.getElementById(id);
        if (!el) return;
        try {
            var res = await fetch(url);
            if (!res.ok) {
                console.error('[Satguru] Failed to load include:', url, res.status);
                return;
            }
            var html = await res.text();
            if (window.prefixRootHtml) html = window.prefixRootHtml(html);

            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var frag = document.createDocumentFragment();
            while (doc.body.firstChild) frag.appendChild(doc.body.firstChild);
            el.parentNode.replaceChild(frag, el);
        } catch (e) {
            console.warn('Failed to inject', url, e);
        }
    }

    // Email verification widget — wraps an <input type="email"> in a
    // [data-email-verify] div and adds a "Verify email" button that sends a
    // 6-digit code, then a code field to confirm it. Used by the Contact form
    // and the Customise Your Request modal so a submission can't go through
    // with a fake/typo'd email. Exposed on window so pages with their own
    // separate inline submit-handler script (e.g. contact.html) can check
    // `window.isEmailVerifyWrapVerified(form)` before allowing submit.
    function initEmailVerify(wrap) {
        if (wrap.dataset.evInit) return;
        wrap.dataset.evInit = '1';
        var input = wrap.querySelector('input[type="email"]');
        if (!input) return;

        var status = document.createElement('div');
        status.className = 'email-verify-status';
        wrap.appendChild(status);

        var lastVerifiedValue = '';
        // Some forms (e.g. the 3-column Customise Your Request modal) don't
        // have room to overlay the button inside the input — those opt out
        // via data-email-verify-stacked and always render below instead.
        var allowInline = !wrap.hasAttribute('data-email-verify-stacked');

        function setVerified(isVerified) {
            wrap.dataset.verified = isVerified ? 'true' : 'false';
        }

        function renderIdle(msg, isError) {
            setVerified(false);
            // Fits inside the input only while it's just the bare button —
            // once there's a message alongside it, drop below for room.
            status.classList.toggle('ev-inline', allowInline && !msg);
            status.innerHTML = '<button type="button" class="ev-verify-btn">Verify email</button>' +
                (msg ? '<span class="ev-msg' + (isError ? ' ev-error' : '') + '">' + msg + '</span>' : '');
            status.querySelector('.ev-verify-btn').addEventListener('click', sendCode);
        }

        function renderCodeStep(email, msg, isError) {
            status.classList.remove('ev-inline');
            status.innerHTML =
                '<div class="ev-code-row">' +
                '<input type="text" class="ev-code-input field-input" placeholder="6-digit code" maxlength="6" inputmode="numeric">' +
                '<button type="button" class="ev-confirm-btn">Confirm</button>' +
                '</div>' +
                (msg ? '<span class="ev-msg' + (isError ? ' ev-error' : '') + '">' + msg + '</span>' : '');
            var codeInput = status.querySelector('.ev-code-input');
            codeInput.addEventListener('input', function () {
                codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
            });
            status.querySelector('.ev-confirm-btn').addEventListener('click', function () {
                confirmCode(email, codeInput.value.trim());
            });
        }

        function renderVerified(email) {
            setVerified(true);
            lastVerifiedValue = email;
            if (allowInline) status.classList.add('ev-inline');
            status.innerHTML = '<span class="ev-verified">&#10003; Email verified</span>';
        }

        function sendCode() {
            var email = input.value.trim();
            if (!email || input.validity.badInput || input.validity.typeMismatch) {
                renderIdle('Enter a valid email first.', true);
                return;
            }
            var btn = status.querySelector('.ev-verify-btn');
            btn.disabled = true;
            btn.textContent = 'Sending…';
            fetch(cmsApiBase() + '/api/verify-email/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.success) {
                        renderCodeStep(email, 'Code sent — check your inbox.', false);
                    } else {
                        renderIdle(data.error || 'Could not send code.', true);
                    }
                })
                .catch(function () {
                    renderIdle('Network error. Please try again.', true);
                });
        }

        function confirmCode(email, code) {
            var btn = status.querySelector('.ev-confirm-btn');
            btn.disabled = true;
            btn.textContent = 'Verifying…';
            fetch(cmsApiBase() + '/api/verify-email/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, code: code })
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.success) {
                        renderVerified(email);
                    } else {
                        renderCodeStep(email, data.error || 'Incorrect code.', true);
                    }
                })
                .catch(function () {
                    renderCodeStep(email, 'Network error. Please try again.', true);
                });
        }

        // If the visitor edits the email after verifying, the checkmark must
        // reset — a verified flag can't be reused for a different inbox.
        input.addEventListener('input', function () {
            if (wrap.dataset.verified === 'true' && input.value.trim() !== lastVerifiedValue) {
                renderIdle('', false);
            }
        });

        renderIdle('', false);
    }

    // Returns false (and shows an inline message) if `form` contains a
    // [data-email-verify] wrapper that hasn't been confirmed yet.
    function isFormEmailVerified(form) {
        var wrap = form.querySelector('[data-email-verify]');
        if (!wrap) return true; // form has no email-verify field — nothing to gate
        if (wrap.dataset.verified === 'true') return true;
        var status = wrap.querySelector('.email-verify-status');
        if (status && !status.querySelector('.ev-error')) {
            var msg = document.createElement('span');
            msg.className = 'ev-msg ev-error';
            msg.style.display = 'block';
            msg.style.marginTop = '6px';
            msg.textContent = 'Please verify your email address before submitting.';
            status.appendChild(msg);
        }
        return false;
    }
    window.isFormEmailVerified = isFormEmailVerified;

    // Generic wiring for static enquiry forms. Mark a <form> with
    // data-cms-form="contact" or data-cms-form="quote" and it posts to the CMS,
    // shows a success/error message, and resets on success.
    function wireCmsForm(form) {
        var kind = form.getAttribute('data-cms-form');
        var endpoint = kind === 'quote' ? '/api/quote' : '/api/contact';

        function showMsg(type, text) {
            form.querySelectorAll('.cms-form-msg').forEach(function (n) { n.remove(); });
            var el = document.createElement('div');
            el.className = 'cms-form-msg';
            var ok = type === 'success';
            el.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:16px;padding:14px 18px;border-radius:10px;font-size:15px;font-weight:500;' +
                (ok ? 'background:#eafaf1;border:1.5px solid #69AA48;color:#1a6b35;' : 'background:#fff0f0;border:1.5px solid #e53935;color:#c62828;');
            el.innerHTML = (ok ? '<span style="font-size:22px;color:#69AA48;">&#10003;</span>' : '<span style="font-size:20px;">&#9888;</span>') + text;
            form.appendChild(el);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('button[type="submit"], [type="submit"]');
            var origText = btn ? btn.innerHTML : '';
            if (btn) { btn.disabled = true; btn.innerHTML = 'SENDING…'; }

            var payload = Object.fromEntries(new FormData(form));
            form.querySelectorAll('select[name]').forEach(function (sel) {
                if (!(sel.name in payload)) payload[sel.name] = sel.value;
            });

            fetch(cmsApiBase() + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
                    if (data.success) {
                        showMsg('success', kind === 'quote'
                            ? 'Your request has been sent successfully! Our team will get back to you shortly.'
                            : 'Your message has been sent successfully! We\'ll get back to you shortly.');
                        form.reset();
                    } else {
                        showMsg('error', data.error || 'Something went wrong. Please try again.');
                    }
                })
                .catch(function () {
                    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
                    showMsg('error', 'Network error. Please check your connection and try again.');
                });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('form[data-cms-form]').forEach(wireCmsForm);
    });

    var cb = Date.now();

    // Inject header and footer asynchronously, then run initializers
    Promise.all([
        injectAsync('site-header', assetUrl('/assets/includes/header.html')),
        injectAsync('site-footer', assetUrl('/assets/includes/footer.html'))
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

        // Email verification widgets — covers both the just-injected Customise
        // Your Request modal and any [data-email-verify] already present in
        // the page's own static markup (e.g. contact.html's Contact form).
        document.querySelectorAll('[data-email-verify]').forEach(initEmailVerify);

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
                if (!isFormEmailVerified(quoteForm)) return;
                var btn = quoteForm.querySelector('button[type="submit"]');
                var origText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="icon"><img src="/assets/img/arrow-icon-header.svg" alt=""></span>SENDING…';

                var payload = Object.fromEntries(new FormData(quoteForm));
                // FormData skips <select> whose selected option is disabled — read them manually
                quoteForm.querySelectorAll('select[name]').forEach(function (sel) {
                    if (!(sel.name in payload)) payload[sel.name] = sel.value;
                });

                var apiBase = cmsApiBase();
                fetch(apiBase + '/api/quote', {
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

        // Newsletter subscribe — two-step: send a 6-digit code to the email,
        // then confirm the subscription once that code is verified.
        var newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            var nlEmailInput = document.getElementById('newsletterEmailInput');
            var nlCodeInput = document.getElementById('newsletterCodeInput');
            var nlSubmitBtn = document.getElementById('newsletterSubmitBtn');
            var nlInitialBtnHtml = nlSubmitBtn.innerHTML;
            var nlStep = 'email'; // 'email' | 'code'
            var nlPendingEmail = '';

            nlCodeInput.addEventListener('input', function () {
                nlCodeInput.value = nlCodeInput.value.replace(/\D/g, '').slice(0, 6);
            });

            // Rebuilds the button with its icon span intact — plain text swaps
            // (e.g. `.innerHTML = 'Verify Code'`) drop the icon markup, which is
            // what the button's flex layout relies on to look right.
            function nlSetBtnText(text) {
                nlSubmitBtn.innerHTML = '<span class="bannerPackage"><img src="/assets/img/org-arrow.svg" alt="" loading="lazy"></span>' + text;
            }

            function nlApiBase() {
                return cmsApiBase();
            }

            function nlShowMsg(type, text) {
                // Appended after the form (not inside it) — the form is a
                // fixed-height flex pill, so a message inside it gets squeezed
                // into the same row as the input/button instead of its own line.
                newsletterForm.parentElement.querySelectorAll('.nl-form-msg').forEach(function (n) { n.remove(); });
                var el = document.createElement('div');
                el.className = 'nl-form-msg';
                var ok = type === 'success';
                el.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 16px;border-radius:10px;font-size:14px;font-weight:500;width:100%;' +
                    (ok ? 'background:#eafaf1;border:1.5px solid #69AA48;color:#1a6b35;' : 'background:#fff0f0;border:1.5px solid #e53935;color:#c62828;');
                el.innerHTML = (ok ? '<span style="font-size:20px;color:#69AA48;">&#10003;</span>' : '<span style="font-size:18px;">&#9888;</span>') + text;
                newsletterForm.parentElement.appendChild(el);
            }

            function nlResetToEmailStep() {
                nlStep = 'email';
                nlPendingEmail = '';
                nlCodeInput.value = '';
                nlCodeInput.style.display = 'none';
                nlEmailInput.style.display = '';
                nlEmailInput.disabled = false;
                nlSubmitBtn.innerHTML = nlInitialBtnHtml;
            }

            newsletterForm.addEventListener('submit', function (e) {
                e.preventDefault();
                newsletterForm.parentElement.querySelectorAll('.nl-form-msg').forEach(function (n) { n.remove(); });
                nlSubmitBtn.disabled = true;

                if (nlStep === 'email') {
                    var email = nlEmailInput.value.trim();
                    var origHtml = nlSubmitBtn.innerHTML;
                    nlSetBtnText('SENDING…');

                    fetch(nlApiBase() + '/api/newsletter/request-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    })
                        .then(function (r) { return r.json(); })
                        .then(function (data) {
                            nlSubmitBtn.disabled = false;
                            if (data.success) {
                                nlPendingEmail = email;
                                nlStep = 'code';
                                nlEmailInput.style.display = 'none';
                                nlEmailInput.disabled = true;
                                nlCodeInput.style.display = '';
                                nlCodeInput.focus();
                                nlSetBtnText('Verify Code');
                                nlShowMsg('success', 'We\'ve sent a 6-digit code to ' + email + '. Enter it above to confirm.');
                            } else {
                                nlSubmitBtn.innerHTML = origHtml;
                                nlShowMsg('error', data.error || 'Something went wrong. Please try again.');
                            }
                        })
                        .catch(function () {
                            nlSubmitBtn.disabled = false;
                            nlSubmitBtn.innerHTML = origHtml;
                            nlShowMsg('error', 'Network error. Please check your connection and try again.');
                        });
                } else {
                    var code = nlCodeInput.value.trim();
                    var origHtml2 = nlSubmitBtn.innerHTML;
                    nlSetBtnText('VERIFYING…');

                    fetch(nlApiBase() + '/api/newsletter/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: nlPendingEmail, code: code })
                    })
                        .then(function (r) { return r.json(); })
                        .then(function (data) {
                            nlSubmitBtn.disabled = false;
                            if (data.success) {
                                nlShowMsg('success', 'You\'re subscribed! Check your inbox for a welcome email.');
                                newsletterForm.reset();
                                nlResetToEmailStep();
                            } else {
                                nlSubmitBtn.innerHTML = origHtml2;
                                nlShowMsg('error', data.error || 'Incorrect code. Please try again.');
                            }
                        })
                        .catch(function () {
                            nlSubmitBtn.disabled = false;
                            nlSubmitBtn.innerHTML = origHtml2;
                            nlShowMsg('error', 'Network error. Please check your connection and try again.');
                        });
                }
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
            path: assetUrl('/assets/img/email.json')
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
