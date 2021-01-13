const textLineList = document.getElementsByClassName("text-line-list")[0];
const letterCircle = document.getElementsByClassName("letter-circle")[0];
const letterArray = Array.from("INSOFRIDO");
const wordRepetition = 2;
const letterCount = letterArray.length * wordRepetition;
const circleInc = 36 / letterCount;
const width = window.innerWidth;
const height = window.innerHeight;
const isSmall = height < 680 || width < 680;
const nrLines = Math.ceil(height / (isSmall ? 37 : 74));
const scrollAnimName = isSmall ? "scroll" : "scroll-large";
const rotateAnimName = isSmall ? "rotate" : "rotate-large";
const textLineText = 'Suspendisse non finibus arcu. Donec quis leo dictum, lacinia ante id, tempus risus. Pellentesque nec sagittis ligula. Maecenas aliquam velit nec libero egestas, non hendrerit metus tristique. Donec quis sem euismod, pellentesque elit at, iaculis tortor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus eu nibh in lectus convallis iaculis ac tincidunt sem. Suspendisse vestibulum nulla erat, ut vehicula est pellentesque vitae. Curabitur pretium, ipsum et aliquam blandit, lectus dui pretium libero, vitae hendrerit enim nisi quis nisl. Morbi laoreet, tortor ac placerat rutrum, est elit hendrerit sapien, in pharetra ligula nisl tristique dui. Phasellus aliquet est orci, eget euismod nisl porta quis. Aliquam luctus elit sem, eget aliquam purus sollicitudin sit amet. Duis urna nibh, laoreet non dignissim eget, molestie in odio. Nullam vel dignissim ipsum. Suspendisse non finibus arcu. Donec quis leo dictum, lacinia ante id, tempus risus. Pellentesque nec sagittis ligula. Maecenas aliquam velit nec libero egestas, non hendrerit metus tristique. Donec quis sem euismod, pellentesque elit at, iaculis tortor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vivamus eu nibh in lectus convallis iaculis ac tincidunt sem. Suspendisse vestibulum nulla erat, ut vehicula est pellentesque vitae. Curabitur pretium, ipsum et aliquam blandit, lectus dui pretium libero, vitae hendrerit enim nisi quis nisl. Morbi laoreet, tortor ac placerat rutrum, est elit hendrerit sapien, in pharetra ligula nisl tristique dui. Phasellus aliquet est orci, eget euismod nisl porta quis. Aliquam luctus elit sem, eget aliquam purus sollicitudin sit amet. Duis urna nibh, laoreet non dignissim eget, molestie in odio. Nullam vel dignissim ipsum. ';

function setupElements() {
    // Clear children
    while (textLineList.firstChild) textLineList.firstChild.remove();
    while (letterCircle.firstChild) letterCircle.firstChild.remove();

    // Letter circle
    var letter = document.createElement("div");
    letter.classList.add("letter");
    for (i = 0; i < letterCount; i++) {
        var newLetter = letter.cloneNode(true);
        newLetter.innerText = letterArray[(i % letterArray.length)];
        var offset = -(circleInc * i) + "s";
        newLetter.style.animation = rotateAnimName + " 36s linear infinite " + offset;
        letterCircle.appendChild(newLetter);
    }

    // Background text lines
    var textLine = document.createElement("div");
    textLine.classList.add("text-line");
    textLine.innerText = textLineText;
    for (i = 0; i < nrLines; i++) {
        var newTextLine = textLine.cloneNode(true);
        var offset = Math.floor(getRandomArbitrary(-377, 0)) + "s";
        newTextLine.style.animation = scrollAnimName + " 377.25s linear infinite " + offset;
        textLineList.appendChild(newTextLine);
    }
}

window.addEventListener("resize", setupElements);

setupElements();

// -- Utils ----------------------------------------------------------------------------------------

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}