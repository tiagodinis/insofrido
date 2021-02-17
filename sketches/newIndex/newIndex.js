//-- Index setup -----------------------------------------------------------------------------------

const textLineList = document.getElementsByClassName("text-line-background")[0];
const letterCircle = document.getElementsByClassName("letter-circle")[0];
const discCollider = document.getElementsByClassName("disc-collider")[0].firstElementChild;
const letterArray = Array.from("INSOFRIDO");
const wordRepetition = 2;
const loopTime = 36;
const nrLetters = letterArray.length * wordRepetition;
const circleInc = loopTime / nrLetters; // 360deg / nrLetters
const textLineText = 'Suspendisse non finibus arcu. Donec quis leo dictum, lacinia ante id, tempus risus. Pellentesque nec sagittis ligula. Maecenas aliquam velit nec libero egestas, non hendrerit metus tristique. Donec quis sem euismod, pellentesque elit at, iaculis tortor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus eu nibh in lectus convallis iaculis ac tincidunt sem. Suspendisse vestibulum nulla erat, ut vehicula est pellentesque vitae. Curabitur pretium, ipsum et aliquam blandit, lectus dui pretium libero, vitae hendrerit enim nisi quis nisl. Morbi laoreet, tortor ac placerat rutrum, est elit hendrerit sapien, in pharetra ligula nisl tristique dui. Phasellus aliquet est orci, eget euismod nisl porta quis. Aliquam luctus elit sem, eget aliquam purus sollicitudin sit amet. Duis urna nibh, laoreet non dignissim eget, molestie in odio. Nullam vel dignissim ipsum. Suspendisse non finibus arcu. Donec quis leo dictum, lacinia ante id, tempus risus. Pellentesque nec sagittis ligula. Maecenas aliquam velit nec libero egestas, non hendrerit metus tristique. Donec quis sem euismod, pellentesque elit at, iaculis tortor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus eu nibh in lectus convallis iaculis ac tincidunt sem. Suspendisse vestibulum nulla erat, ut vehicula est pellentesque vitae. Curabitur pretium, ipsum et aliquam blandit, lectus dui pretium libero, vitae hendrerit enim nisi quis nisl. Morbi laoreet, tortor ac placerat rutrum, est elit hendrerit sapien, in pharetra ligula nisl tristique dui. Phasellus aliquet est orci, eget euismod nisl porta quis. Aliquam luctus elit sem, eget aliquam purus sollicitudin sit amet. Duis urna nibh, laoreet non dignissim eget, molestie in odio. Nullam vel dignissim ipsum. ';
const textLineMold = document.createElement("div");
textLineMold.classList.add("text-line");
textLineMold.innerText = textLineText;
const letterMold = document.createElement("div");
letterMold.style.position = "absolute";

function setupIndex() {
    const isSmall = window.innerHeight < 680 || window.innerWidth < 680;
    const nrLines = Math.ceil(window.innerHeight / (isSmall ? 37 : 74)); // divide by line height
    const scrollAnimName = isSmall ? "scroll" : "scroll-large";
    const rotateAnimName = isSmall ? "rotate" : "rotate-large";

    // Clear children (will be the case on window resize)
    while (textLineList.lastChild) textLineList.lastChild.remove();
    while (letterCircle.lastChild) letterCircle.lastChild.remove();

    // Letter circle
    for (iLetter = 0; iLetter < nrLetters; iLetter++) {
        var newLetter = letterMold.cloneNode(true);
        newLetter.innerText = letterArray[(iLetter % letterArray.length)];
        var offset = -(circleInc * iLetter) + "s";
        newLetter.style.animation = rotateAnimName + " " + loopTime + "s linear infinite " + offset;
        letterCircle.appendChild(newLetter);
    }

    // Background text lines
    for (iTextLine = 0; iTextLine < nrLines; iTextLine++) {
        var newTextLine = textLineMold.cloneNode(true);
        // TODO: create reset only once, so that on resize it doesn't jump around everywhere
        var offset = Math.floor(getRandomArbitrary(-377, 0)) + "s";
        newTextLine.style.animation = scrollAnimName + " 377.25s linear infinite " + offset;
        textLineList.appendChild(newTextLine);
    }
}

//-- Transition ------------------------------------------------------------------------------------

const body = document.getElementsByTagName("body")[0];
const index = document.getElementsByClassName("index")[0];
const dict = document.getElementsByClassName("dict")[0];
var towardsDict;

function highlightLetterCircle() {
    letterCircle.style.color = "#707070";
}

function dehighlightLetterCircle() {
    if (body.style.pointerEvents !== "none") letterCircle.style.color = "black";
}

function indexToDict() {
    // Disable element interactions and fade-in
    body.style.pointerEvents = "none";
    index.style.animation = "fade-out 1s ease-out forwards";
    towardsDict = true;
}

function dictToIndex() {
    body.style.pointerEvents = "none";
    dict.style.animation = "fade-out 1s ease-out forwards";
    towardsDict = false;
}

function animationEndBrancher() {
    if (!towardsDict) // dict to index, end of fade-out
    {
        // Remove animation properties (avoids instant playing when dict is displayed)
        word.style.removeProperty("animation");
        for(i = 0; i < syllables.length; i++)
            syllables[i].style.removeProperty("animation");
        phonetic.style.removeProperty("animation");
        type.style.removeProperty("animation");
        separator.style.removeProperty("animation");
        wordMeaning1.style.removeProperty("animation");
        wordMeaning2.style.removeProperty("animation");
        wordMeaning3.style.removeProperty("animation");
        resetButton.style.removeProperty("animation");
        dict.style.removeProperty("animation");
        animatingDict = false;

        dict.style.display = "none";
        index.style.display = "initial";
        index.style.animation = "fade-in 1s ease-in forwards";
        body.style.pointerEvents = "auto";
        dehighlightLetterCircle();
    }
    else if (dict.style.display !== "initial") { // index to dict, end of fade-out
        index.style.display = "none";
        dict.style.display = "initial";
        dict.style.animation = "fade-in 1s ease-in forwards";
    }
    // index to dict, end of fade-in
    else dictAnimation();
}

//-- Dict animation --------------------------------------------------------------------------------

const word = document.getElementsByClassName("word")[0];
const syllables = document.getElementsByClassName("syllable-dot");
const phonetic = document.getElementsByClassName("word-phonetic")[0];
const type = document.getElementsByClassName("word-type")[0];
const separator = document.getElementsByClassName("separator")[0];
const wordMeaning1 = document.getElementsByClassName("word-meaning1")[0];
const wordMeaning2 = document.getElementsByClassName("word-meaning2")[0];
const wordMeaning3 = document.getElementsByClassName("word-meaning3")[0];
const resetButton = document.getElementsByClassName("reset-button")[0];
var animatingDict;

function dictAnimation() {
    if (animatingDict) return;
    else animatingDict = true;

    const isSmall = window.innerHeight < 680 || window.innerWidth < 680;
    const decenterAnimName = isSmall ? "decenter-word" : "decenter-word-large";
    const expansionAnimName = isSmall ? "expand-syllables" : "expand-syllables-large";

    word.style.animation = decenterAnimName + " 0.5s ease-in-out forwards 1";
    for(i = 0; i < syllables.length; i++)
        syllables[i].style.animation = expansionAnimName + " 0.5s ease-out forwards 0.55s 1";
    phonetic.style.animation = "fade-in 0.8s linear forwards 1.1s 1";
    type.style.animation = "fade-in 0.7s linear forwards 1.6s 1";
    separator.style.animation = "stretch-right 0.5s ease-out forwards 2.1s 1";
    wordMeaning1.style.animation = "fade-in 1.3s ease-in forwards 2.5s 1";
    wordMeaning2.style.animation = "fade-in 1.3s ease-in forwards 2.8s 1";
    wordMeaning3.style.animation = "fade-in 1.3s ease-in forwards 3.1s 1";
    resetButton.style.animation = "fade-in 1s ease-in forwards 4.5s 1";
    body.style.pointerEvents = "auto";
}

window.addEventListener("resize", setupIndex);
discCollider.addEventListener("mouseover", highlightLetterCircle);
discCollider.addEventListener("mouseleave", dehighlightLetterCircle);
discCollider.addEventListener("click", indexToDict);
resetButton.addEventListener("click", dictToIndex);
index.addEventListener("animationend", animationEndBrancher);
dict.addEventListener("animationend", animationEndBrancher);

setupIndex();

// -- Utils ----------------------------------------------------------------------------------------

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}