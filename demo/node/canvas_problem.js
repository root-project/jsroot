import { writeFileSync } from 'fs';
import { loadImage, createCanvas } from 'canvas';

let img = await loadImage('canvas_problem.svg');

const canvas = createCanvas(img.width, img.height, 'png');

canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

let buf = canvas.toBuffer('image/png');

writeFileSync('canvas_problem.png', buf);

console.log(`Writing image ${img.width} x ${img.height} png file ${buf.byteLength}`);
