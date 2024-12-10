import { Tooltip } from 'bootstrap';

export default {
    mounted(el) {
        new Tooltip(el);
    },
    unmounted(el) {
        const tooltipInstance = Tooltip.getInstance(el);
        if (tooltipInstance) tooltipInstance.dispose();
    },
};
