(function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    function init() {
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Reveal: fade + slide content into view
        if (!reduceMotion) {
            document.querySelectorAll('.reveal').forEach(function (el) {
                // Skip elements already in the viewport — show them immediately
                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.95) {
                    gsap.set(el, { autoAlpha: 1, y: 0 });
                    return;
                }
                gsap.fromTo(el,
                    { autoAlpha: 0, y: 50 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1.0,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 92%',
                            toggleActions: 'play none none none',
                            once: true,
                            invalidateOnRefresh: true
                        }
                    }
                );
            });
        }

        ScrollTrigger.refresh();
    }

    // Wait for full load so layout (images, fonts) is stable before measuring positions
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
