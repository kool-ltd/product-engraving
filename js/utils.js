/* HELPERS */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    i.src = src;
  });
}

function fitInBox(canvas, img, wrapper) {
  const wrapW = wrapper.clientWidth;
  const scale = wrapW / img.naturalWidth;
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  return scale;
}

function measureText(ctx, text, fontSize, font, weight = '400') {
  ctx.font = `${weight} ${fontSize}px ${font}`;
  return { w: ctx.measureText(text).width, h: fontSize };
}

function toFullCoords(canvas, wrapper, cx, cy) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (cx - r.left) * (wrapper.full.width / r.width),
    y: (cy - r.top) * (wrapper.full.height / r.height)
  };
}

function hitTest(fx, fy, posY, dims, scale, textRightX) {
  const x = textRightX - dims.w * scale;
  return fx >= x && fx <= textRightX &&
         fy >= posY && fy <= posY + dims.h * scale;
}

function hasBigKnives(selected) {
  return selected.some(input => knives.big.includes(input.dataset.name));
}

function hasSmallKnives(selected) {
  return selected.some(input => knives.small.includes(input.dataset.name));
}

function hasOtherItems(selected) {
  return selected.some(input => knives.others.includes(input.dataset.name));
}