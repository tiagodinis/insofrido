// Sticky sideNav consts
const sideNav = document.getElementsByClassName("side-nav")[0];
const postHeadingLine = document.getElementsByClassName("break-line")[0].offsetTop;

// Highlighted sideNav links consts
const sideNavLinks = document.querySelectorAll(".side-nav-button");
const sectionList = [];
for (let i = 0; i < sideNavLinks.length; ++i)
    sectionList[i] = document.querySelector(sideNavLinks.item(i).hash);

// Update sticky and link highlighting behaviours on sideNav
function updateSideNav() {
    const currentY = window.pageYOffset;
    const windowOffset = window.innerHeight * 0.35;

    for (let i = 0; i < sectionList.length; ++i) {
        let condition = false;
        const isBelowCurrent = currentY >= (sectionList[i].offsetTop - windowOffset);
        // condition = isBelowCurrent;
        if (i === sectionList.length - 1) condition = isBelowCurrent;
        else {
            const isAboveNext = currentY < (sectionList[i + 1].offsetTop - windowOffset);
            if (i === 0) {
                const isBelowHeading = currentY >= postHeadingLine;
                // Sticky sidenav
                enableOnElementIf("side-nav-sticky", sideNav, isBelowHeading);
                condition = isAboveNext && isBelowHeading;
            }
            else condition = isBelowCurrent && isAboveNext;
        }
        
        enableOnElementIf("side-nav-current", sideNavLinks.item(i), condition);
    }
}

// (!) Debounce to remove the sidenav highlight flicker
window.addEventListener("scroll", debounce(updateSideNav, 5));

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