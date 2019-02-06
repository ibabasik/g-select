// var Vue=require('vue')
// Vue.config.debug = true
// var select = require('./vue-g-select.vue');
//
// new Vue({
//     el: '#app',
//     components: {
//         select:select
//     }
// });

import gSelect from './vue-g-select.vue';
import gAutocomplete from './vue-g-autocomplete.vue';

export {
    gSelect,
    gAutocomplete
};

export function install (Vue, options = {}) {
	if (install.installed) return;
	install.installed = true;

	const finalOptions = {};
	merge(finalOptions, defaultOptions, options);

	plugin.options = finalOptions;

	Vue.component('g-select', gSelect);
	Vue.component('g-autocomplete', gAutocomplete);
}

const plugin = {
	install,

	get enabled () {
		return state.enabled
	},

	set enabled (value) {
		state.enabled = value
	},
};

// Auto-install
let GlobalVue = null;
if (typeof window !== 'undefined') {
	GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
	GlobalVue = global.Vue
}
if (GlobalVue) {
	GlobalVue.use(plugin)
}

export default plugin