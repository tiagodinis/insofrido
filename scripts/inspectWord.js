const page = document.getElementsByClassName("page")[0];
const word = document.getElementsByClassName("word")[0];
const syllables = document.getElementsByClassName("syllable-dot");
const phonetic = document.getElementsByClassName("word-phonetic")[0];
const type = document.getElementsByClassName("word-type")[0];
const separator = document.getElementsByClassName("separator")[0];
const wordMeaning1 = document.getElementsByClassName("word-meaning1")[0];
const wordMeaning2 = document.getElementsByClassName("word-meaning2")[0];
const wordMeaning3 = document.getElementsByClassName("word-meaning3")[0];
const dictNav = document.getElementsByClassName("dict-nav")[0];
const isSmall = window.innerWidth < 680;
const decenterName = isSmall ? "decenter-word" : "decenter-word-large";
const expansionAnim = isSmall ? "expand-syllables" : "expand-syllables-large";

function inspect() {
    word.classList.add(decenterName);
    for(i = 0; i < syllables.length; i++)
        syllables[i].classList.add(expansionAnim);
    phonetic.classList.add("show-phonetic");
    type.classList.add("show-type");
    separator.classList.add("draw-separator");
    wordMeaning1.classList.add("show-word-meaning1");
    wordMeaning2.classList.add("show-word-meaning2");
    wordMeaning3.classList.add("show-word-meaning3");
    dictNav.classList.add("show-dict-nav");
}

inspect();