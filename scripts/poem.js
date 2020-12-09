const topNav = document.getElementsByClassName("top-nav")[0];

function updateTopNav () {
	enableOnElementIf("top-nav-scrolled", topNav, window.pageYOffset >= 50)
}

window.addEventListener("scroll", debounce(updateTopNav, 5));

// -- Utils ----------------------------------------------------------------------------------------

// Call "func" after it stops being called for "ms" milliseconds
// immediate = true triggers the function on the leading edge, instead of the trailing
function debounce(func, ms, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, ms);
		if (callNow) func.apply(context, args);
	};
};

function enableOnElementIf(classStr, element, condition) {
    if (condition) element.classList.add(classStr);
    else element.classList.remove(classStr);
}