const page = document.getElementsByClassName("page")[0];
const word = document.getElementsByClassName("word")[0];
const syllables = document.getElementsByClassName("syllable-dot");
const phonetic = document.getElementsByClassName("word-phonetic")[0];
const type = document.getElementsByClassName("word-type")[0];
const separator = document.getElementsByClassName("separator")[0];
const wordMeaning1 = document.getElementsByClassName("word-meaning1")[0];
const wordMeaning2 = document.getElementsByClassName("word-meaning2")[0];
const wordMeaning3 = document.getElementsByClassName("word-meaning3")[0];
const resetButton = document.getElementsByClassName("reset-button")[0];

function inspect() {
    word.classList.add("decenter-word");
    for(i = 0; i < syllables.length; i++)
        syllables[i].classList.add("expand-syllables");
    phonetic.classList.add("show-phonetic");
    type.classList.add("show-type");
    separator.classList.add("draw-separator");
    wordMeaning1.classList.add("show-word-meaning1");
    wordMeaning2.classList.add("show-word-meaning2");
    wordMeaning3.classList.add("show-word-meaning3");
    resetButton.classList.add("show-reset-button");
}

function reset() {
    // word.classList.remove("decenter-word");
    // for(i = 0; i < syllables.length; i++)
    //     syllables[i].classList.remove("expand-syllables");
    // phonetic.classList.remove("show-phonetic");
    // type.classList.remove("show-type");
    // separator.classList.remove("draw-separator");
    // wordMeaning1.classList.remove("show-word-meaning1");
    // wordMeaning2.classList.remove("show-word-meaning2");
    // wordMeaning3.classList.remove("show-word-meaning3");
    // resetButton.classList.remove("show-reset-button");

    // word.classList.add("center-word");
    // for(i = 0; i < syllables.length; i++)
    //     syllables[i].classList.add("contract-syllables");
    // phonetic.classList.add("hide-phonetic");
    // type.classList.add("hide-type");
    // separator.classList.add("clear-separator");
    // wordMeaning1.classList.add("hide-word-meaning1");
    // wordMeaning2.classList.add("hide-word-meaning2");
    // wordMeaning3.classList.add("hide-word-meaning3");
    // resetButton.classList.add("hide-reset-button");
}

// if (word)
// {
    // word.addEventListener("click", inspect, false);
    // resetButton.addEventListener("animationend", setupReset, false);
    // page.addEventListener("click", reset, false);
// }

inspect();



// function inspect() {
//     word.classList.remove("word-interactable");
//     word.classList.add("word-decenter");
//     for(i = 0; i < syllables.length; i++)
//         syllables[i].classList.add("expand-syllables");
//     document.getElementsByClassName("word-phonetic")[0].classList.add("show-phonetic");
//     document.getElementsByClassName("word-type")[0].classList.add("show-type");
//     document.getElementsByClassName("separator")[0].classList.add("draw-separator");
//     document.getElementsByClassName("word-meaning1")[0].classList.add("show-word-meaning1");
//     document.getElementsByClassName("word-meaning2")[0].classList.add("show-word-meaning2");
//     document.getElementsByClassName("word-meaning3")[0].classList.add("show-word-meaning3");
// }