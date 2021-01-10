const goBackLink = document.getElementsByClassName("top-nav-left")[0].firstElementChild;
const image = goBackLink.firstElementChild;
const textDiv = goBackLink.lastElementChild;

function startAnimation() {
    image.style.marginLeft =  "8px";
    image.style.opacity =  "50%";
    textDiv.style.marginLeft =  "12px";
    textDiv.style.textDecoration =  "underline";
    textDiv.style.color =  "#707070";
}

function stopAnimation() {
    image.style.marginLeft =  "10px";
    image.style.opacity =  "100%";
    textDiv.style.marginLeft =  "10px";
    textDiv.style.textDecoration =  "none";
    textDiv.style.color =  "black";
}

goBackLink.addEventListener("mouseover", startAnimation, true);
goBackLink.addEventListener("mouseout", stopAnimation, true);