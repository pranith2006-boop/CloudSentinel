const canvas = document.getElementById("particleCanvas");

if(canvas){

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for(let i=0;i<80;i++){

particles.push({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,

vx:Math.random()*1-0.5,
vy:Math.random()*1-0.5

});

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

particles.forEach(p=>{

p.x+=p.vx;
p.y+=p.vy;

ctx.fillStyle="#0ea5e9";

ctx.fillRect(p.x,p.y,2,2);

});

requestAnimationFrame(animate);

}

animate();

}