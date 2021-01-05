const song = document.getElementById("song");
const playButton = document.getElementById("play-button");
var isPlaying = false;

function toggleSong() {
	if (isPlaying){
		song.pause();
		playButton.src = "images/play.svg"
	}
	else{
		song.play();
		playButton.src = "images/pause.svg"
	}
	isPlaying = !isPlaying;
}

if (playButton) playButton.addEventListener("click", toggleSong, false);