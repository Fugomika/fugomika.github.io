export function displayDialogue(text, onDisplayEnd, k){
    const dialogueUI = document.getElementById("textbox-container");
    const dialogue = document.getElementById("dialogue");

    dialogueUI.style.display = "block";

    let index = 0;
    let displayText = "";
    let typing = null;
    k.loadSound("text", "./text.mp3");
    typing = k.play("text", {
        volume: 0.5, // set the volume to 50%
        speed: 1.5, // speed up the sound
        loop: true, // loop the sound
    });
    const intervalRef = setInterval(()  => {
        if (index < text.length){
            displayText += text[index];
            dialogue.innerHTML = displayText;
            index++;
            return;
        }

        typing.stop()
        clearInterval(intervalRef);
    }, 20);

    const closeBtn = document.getElementById("close");

    function onCloseBtnClick(){
        onDisplayEnd();
        typing.stop();
        dialogueUI.style.display = "none";
        dialogue.innerHTML = "";
        clearInterval(intervalRef);
        closeBtn.removeEventListener("click", onCloseBtnClick);
    }

    closeBtn.addEventListener("click", onCloseBtnClick);
}

export function setCamScale(k) {
    const resizeFactor = k.width() / k.height();
    if (resizeFactor < 1){
        k.camScale(k.vec2(1));
        return;
    }

    // k.camScale(k.vec2(1.5));
}

