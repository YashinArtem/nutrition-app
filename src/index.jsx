/* @refresh reload */
import { render } from 'solid-js/web';
import { NutritionFacts } from './nutrition-facts';
import { createSignal } from 'solid-js';
import './style.css';

const root = document.getElementById('root');

const SCROLL_SPEED = 20;

const weightedSum = {
  "calories": -1.0,
  "saturated_fat": -100.0,
  "total_sugars": -20.0,
  "dietary_fiber": 100.0,
  "protein": 50.0,
  "sodium": -1000.0,
};

const getScore = (item) => {
  let score = 0;
  for (const key in item) {
    if (key in weightedSum) {
      score += weightedSum[key] * item[key];
    }
  }
  return score;
};

let sortedItems = [];

const [nutritionDataIndex, setNutritionDataIndex] = createSignal(1);
const [showNail, setShowNail] = createSignal(false); // Add state for nail visibility

let time = 0;
let mousePressed = false;
let mouseOffset = 0;
let sliderValue = 1200;
let lastOffset = 0;

function App(props) {
  const data = props.data;
  const slider = <div class="main-slider">&lt; &lt; &lt; &gt; &gt; &gt;</div>;
  slider.onpointerdown = (e) => sliderMouseDown(e);
  document.addEventListener('pointerup', () => mouseUp());
  document.addEventListener('pointermove', (e) => mouseMove(e));
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f') {
      setShowNail(!showNail());
    }
  });
  return (
    <>
      <div class="container">
        <div class="image-area">
          {props.canvas}
        </div>
        <div class="nutrition-facts">
          {makeNutritionTable(data)}
        </div>
        {slider}
      </div>
      {showNail() && (
        <>
          <img id='nail' src='./etc/nail.png' onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); }} />
          <img id='nail-pressed' src='./etc/nail-pressed.png' onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); }} />
        </>
      )}
    </>
  );
}

function makeNutritionTable(data) {
  return (
    <>
      <h1>Nutrition facts per 100g</h1>
      <div class='line-bold'></div>
      <div>{data[nutritionDataIndex()].item}</div>
    </>
  );
}

function sliderMouseDown(e) {
  mousePressed = true;
  mouseOffset = e.clientX;
}

function mouseUp() {
  mousePressed = false;
  lastOffset = 0;
}

function mouseMove(e) {
  if (mousePressed) {
    const offset = e.clientX - mouseOffset;
    sliderValue += (offset - lastOffset) * SCROLL_SPEED;
    sliderValue = Math.max(0, Math.min(4200, sliderValue));
    lastOffset = offset;
  }

  if (!showNail()) return;

  const nail = document.querySelector('#nail');
  if (!nail) return;
  nail.style.left = e.clientX - 20 + 'px';
  nail.style.top = e.clientY - 65 + 'px';
  const nailPressed = document.querySelector('#nail-pressed');
  if (!nailPressed) return;
  nailPressed.style.left = e.clientX - 20 + 'px';
  nailPressed.style.top = e.clientY - 65 + 'px';
}

function drawImages(ctx, images, offset) {
  const size = 1500;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < images.length; i++) {
    const img = images[sortedItems[i]];
    ctx.drawImage(img, 0, 0, size, size, 100 + i * 600 - offset, 150, 600, 600);
  }
}

function update(ctx, images) {
  const closestValue = Math.round(sliderValue / 600) * 600;
  setNutritionDataIndex(Math.round(sliderValue / 600));
  if (!mousePressed) {
    sliderValue += (closestValue - sliderValue) / 3;
  }
  drawImages(ctx, images, sliderValue);

  if (showNail()) {
    const nail = document.querySelector('#nail');
    const nailPressed = document.querySelector('#nail-pressed');
    if (nail && nailPressed) {
      if (mousePressed) {
        nailPressed.style.display = 'block';
        nail.style.display = 'none';
      }
      else {
        nailPressed.style.display = 'none';
        nail.style.display = 'block';
      }
    }
    document.documentElement.style.cursor = 'none';
  } else {
    document.documentElement.style.cursor = 'default';
  }

  time += 20;
  requestAnimationFrame(() => update(ctx, images));
}

async function init() {
  const nutritions = await fetch('./etc/nutrition.json');
  const nutritionsJson = await nutritions.json();
  const indexedJsons = nutritionsJson.map((item, index) => { return { index, item } });
  indexedJsons.sort((a, b) => getScore(b.item) - getScore(a.item));
  sortedItems = indexedJsons.map((item) => item.index);
  const data = indexedJsons.map((food) => { return { index: food.index, item: NutritionFacts.print(food.item) } });
  const canvas = <canvas id="cnv" width="800" height="800"></canvas>;
  const ctx = canvas.getContext('2d');
  const images = [];
  for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `./img/${i}.jpg`;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    images.push(img);
  }
  update(ctx, images);
  render(() => <App data={data} canvas={canvas} />, root);
}

init();