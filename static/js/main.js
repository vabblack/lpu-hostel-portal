/**
 * Hostel Allocation & Roommate Matching System
 * Vanilla JavaScript interactions (Zero framework dependencies)
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Auto-dismiss flash messages after 6 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function (alert) {
        // Close button click handler
        const closeBtn = alert.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                alert.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                alert.style.opacity = '0';
                alert.style.transform = 'translateY(-10px)';
                setTimeout(function () {
                    alert.remove();
                }, 300);
            });
        }

        // Auto timer
        setTimeout(function () {
            if (document.body.contains(alert)) {
                alert.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                alert.style.opacity = '0';
                alert.style.transform = 'translateY(-10px)';
                setTimeout(function () {
                    if (document.body.contains(alert)) {
                        alert.remove();
                    }
                }, 500);
            }
        }, 6000);
    });

    // 2. Tab Navigation Component (Vanilla JS)
    const tabContainers = document.querySelectorAll('[data-tab-container]');
    tabContainers.forEach(function (container) {
        const tabButtons = container.querySelectorAll('[data-tab-target]');
        const tabPanels = container.querySelectorAll('[data-tab-panel]');

        tabButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const targetId = btn.getAttribute('data-tab-target');

                tabButtons.forEach(function (b) { b.classList.remove('active'); });
                tabPanels.forEach(function (p) { p.classList.add('hidden'); });

                btn.classList.add('active');
                const activePanel = container.querySelector('#' + targetId);
                if (activePanel) {
                    activePanel.classList.remove('hidden');
                }
            });
        });
    });
});

