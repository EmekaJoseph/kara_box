import * as bootstrap from 'bootstrap';

export default {
    mounted(el: string | Element) {
        new bootstrap.Tooltip(el);
    },
    unmounted(el: string | Element) {
        const tooltipInstance = bootstrap.Tooltip.getInstance(el);
        if (tooltipInstance) tooltipInstance.dispose();
    },
};
