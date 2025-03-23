import kaplay from "kaplay";

export const k = kaplay({
    global: false, //make kaplay not global
    touchToMouse: true, //enable touch to mouse     
    canvas: document.getElementById("game")
})