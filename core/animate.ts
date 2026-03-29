/*
 * Animation System - Ported from webcube2026
 * Combines composable animations with hardcoded Animate.css keyframes
 * 
 * Usage:
 * - Composable: <div class="animate-in fade-in slide-in-from-bottom zoom-in">
 * - Hardcoded: <div class="animate-bounce-in">
 */

// CSS 變數定義
export const 動畫CSS變數 = `
:root {
  /* Animation control variables */
  --tw-duration: 0s;
  --tw-ease: ease;
  --tw-delay: 0s;
  --tw-repeat: 1;
  --tw-fill-mode: forwards;
  --tw-direction: normal;
  
  /* Transform variables for composable animations */
  --tw-opacity: 1;
  --tw-scale: 1;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-rotate-x: 0;
  --tw-rotate-y: 0;
  --tw-rotate-z: 0;
  --tw-rotate-angle: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-translate-z: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-blur: 0;
  --tw-perspective: 1000px;
  --tw-transform-origin: center;
}
`;

// Keyframes 定義
export const 動畫Keyframes = `
/* ============================================
   Composable Animation Keyframes
   ============================================ */

@keyframes enter {
  from {
    opacity: var(--tw-opacity, 1);
    transform: perspective(var(--tw-perspective, 1000px))
               translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), var(--tw-translate-z, 0))
               scale3d(calc(var(--tw-scale, 1) * var(--tw-scale-x, 1)), calc(var(--tw-scale, 1) * var(--tw-scale-y, 1)), var(--tw-scale, 1))
               rotate3d(var(--tw-rotate-x, 0), var(--tw-rotate-y, 0), var(--tw-rotate-z, 0), var(--tw-rotate-angle, 0))
               skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0));
    transform-origin: var(--tw-transform-origin, center);
    filter: blur(var(--tw-blur, 0));
  }
}

@keyframes exit {
  to {
    opacity: var(--tw-opacity, 1);
    transform: perspective(var(--tw-perspective, 1000px))
               translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), var(--tw-translate-z, 0))
               scale3d(calc(var(--tw-scale, 1) * var(--tw-scale-x, 1)), calc(var(--tw-scale, 1) * var(--tw-scale-y, 1)), var(--tw-scale, 1))
               rotate3d(var(--tw-rotate-x, 0), var(--tw-rotate-y, 0), var(--tw-rotate-z, 0), var(--tw-rotate-angle, 0))
               skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0));
    transform-origin: var(--tw-transform-origin, center);
    filter: blur(var(--tw-blur, 0));
  }
}

/* Special utility animations */
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height, auto); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height, auto); }
  to { height: 0; }
}

@keyframes collapsible-down {
  from { height: 0; }
  to { height: var(--radix-collapsible-content-height, auto); }
}

@keyframes collapsible-up {
  from { height: var(--radix-collapsible-content-height, auto); }
  to { height: 0; }
}

@keyframes caret-blink {
  0%, 70%, 100% { opacity: 1; }
  20%, 50% { opacity: 0; }
}

/* ============================================
   Hardcoded Animate.css Keyframes
   ============================================ */

/* Attention Seekers */
@keyframes bounce {
  from, 20%, 53%, 80%, to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0) scaleY(1.1);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0) scaleY(1.05);
  }
  90% { transform: translate3d(0, -4px, 0) scaleY(1.02); }
}

@keyframes flash {
  from, 50%, to { opacity: 1; }
  25%, 75% { opacity: 0; }
}

@keyframes pulse {
  from { transform: scale3d(1, 1, 1); }
  50% { transform: scale3d(1.05, 1.05, 1.05); }
  to { transform: scale3d(1, 1, 1); }
}

@keyframes rubberBand {
  from { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
  to { transform: scale3d(1, 1, 1); }
}

@keyframes shakeX {
  from, to { transform: translate3d(0, 0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate3d(-10px, 0, 0); }
  20%, 40%, 60%, 80% { transform: translate3d(10px, 0, 0); }
}

@keyframes shakeY {
  from, to { transform: translate3d(0, 0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate3d(0, -10px, 0); }
  20%, 40%, 60%, 80% { transform: translate3d(0, 10px, 0); }
}

@keyframes headShake {
  0% { transform: translateX(0); }
  6.5% { transform: translateX(-6px) rotateY(-9deg); }
  18.5% { transform: translateX(5px) rotateY(7deg); }
  31.5% { transform: translateX(-3px) rotateY(-5deg); }
  43.5% { transform: translateX(2px) rotateY(3deg); }
  50% { transform: translateX(0); }
}

@keyframes swing {
  20% { transform: rotate3d(0, 0, 1, 15deg); }
  40% { transform: rotate3d(0, 0, 1, -10deg); }
  60% { transform: rotate3d(0, 0, 1, 5deg); }
  80% { transform: rotate3d(0, 0, 1, -5deg); }
  to { transform: rotate3d(0, 0, 1, 0deg); }
}

@keyframes tada {
  from { transform: scale3d(1, 1, 1); }
  10%, 20% { transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg); }
  30%, 50%, 70%, 90% { transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg); }
  40%, 60%, 80% { transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg); }
  to { transform: scale3d(1, 1, 1); }
}

@keyframes wobble {
  from { transform: translate3d(0, 0, 0); }
  15% { transform: translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg); }
  30% { transform: translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg); }
  45% { transform: translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg); }
  60% { transform: translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg); }
  75% { transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes jello {
  from, 11.1%, to { transform: translate3d(0, 0, 0); }
  22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); }
  33.3% { transform: skewX(6.25deg) skewY(6.25deg); }
  44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); }
  55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); }
  66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); }
  77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); }
  88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); }
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

/* Back Entrances */
@keyframes backInDown {
  0% { opacity: 0.7; transform: translateY(-200%) scale(0.7); }
  80% { opacity: 0.7; transform: translateY(0px) scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes backInLeft {
  0% { opacity: 0; transform: translateX(-100%) scale(0.7); }
  80% { opacity: 0.7; transform: translateX(0px) scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes backInRight {
  0% { opacity: 0; transform: translateX(100%) scale(0.7); }
  80% { opacity: 0.7; transform: translateX(0px) scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes backInUp {
  0% { opacity: 0.7; transform: translateY(200%) scale(0.7); }
  80% { opacity: 0.7; transform: translateY(0px) scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}

/* Back Exits */
@keyframes backOutDown {
  0% { opacity: 1; transform: scale(1); }
  80% { opacity: 0.7; transform: translateY(0px) scale(0.7); }
  100% { opacity: 0.7; transform: translateY(200%) scale(0.7); }
}

@keyframes backOutLeft {
  0% { opacity: 1; transform: scale(1); }
  80% { opacity: 0.7; transform: translateX(0px) scale(0.7); }
  100% { opacity: 0; transform: translateX(-100%) scale(0.7); }
}

@keyframes backOutRight {
  0% { opacity: 1; transform: scale(1); }
  80% { opacity: 0.7; transform: translateX(0px) scale(0.7); }
  100% { opacity: 0; transform: translateX(100%) scale(0.7); }
}

@keyframes backOutUp {
  0% { opacity: 1; transform: scale(1); }
  80% { opacity: 0.7; transform: translateY(0px) scale(0.7); }
  100% { opacity: 0.7; transform: translateY(-200%) scale(0.7); }
}

/* Bouncing Entrances */
@keyframes bounceIn {
  from, 20%, 40%, 60%, 80%, to { animation-timing-function: ease-in-out; }
  0% { transform: scale3d(0.3, 0.3, 0.3); opacity: 0; }
  20% { transform: scale3d(1.1, 1.1, 1.1); }
  40% { transform: scale3d(0.9, 0.9, 0.9); }
  60% { transform: scale3d(1.03, 1.03, 1.03); opacity: 1; }
  80% { transform: scale3d(0.97, 0.97, 0.97); }
  to { transform: scale3d(1, 1, 1); opacity: 1; }
}

@keyframes bounceInDown {
  from, 60%, 75%, 90%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
  0% { transform: translate3d(0, -3000px, 0); opacity: 0; }
  60% { transform: translate3d(0, 25px, 0); opacity: 1; }
  75% { transform: translate3d(0, -10px, 0); }
  90% { transform: translate3d(0, 5px, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes bounceInLeft {
  from, 60%, 75%, 90%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
  0% { transform: translate3d(-3000px, 0, 0); opacity: 0; }
  60% { transform: translate3d(25px, 0, 0); opacity: 1; }
  75% { transform: translate3d(-10px, 0, 0); }
  90% { transform: translate3d(5px, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes bounceInRight {
  from, 60%, 75%, 90%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
  0% { transform: translate3d(3000px, 0, 0); opacity: 0; }
  60% { transform: translate3d(-25px, 0, 0); opacity: 1; }
  75% { transform: translate3d(10px, 0, 0); }
  90% { transform: translate3d(-5px, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes bounceInUp {
  from, 60%, 75%, 90%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
  0% { transform: translate3d(0, 3000px, 0); opacity: 0; }
  60% { transform: translate3d(0, -20px, 0); opacity: 1; }
  75% { transform: translate3d(0, 10px, 0); }
  90% { transform: translate3d(0, -5px, 0); }
  to { transform: translate3d(0, 0, 0); }
}

/* Bouncing Exits */
@keyframes bounceOut {
  20% { transform: scale3d(0.9, 0.9, 0.9); }
  50%, 55% { transform: scale3d(1.1, 1.1, 1.1); opacity: 1; }
  to { transform: scale3d(0.3, 0.3, 0.3); opacity: 0; }
}

@keyframes bounceOutDown {
  20% { transform: translate3d(0, 10px, 0); }
  40%, 45% { transform: translate3d(0, -20px, 0); opacity: 1; }
  to { transform: translate3d(0, 2000px, 0); opacity: 0; }
}

@keyframes bounceOutLeft {
  20% { transform: translate3d(20px, 0, 0); opacity: 1; }
  to { transform: translate3d(-2000px, 0, 0); opacity: 0; }
}

@keyframes bounceOutRight {
  20% { transform: translate3d(-20px, 0, 0); opacity: 1; }
  to { transform: translate3d(2000px, 0, 0); opacity: 0; }
}

@keyframes bounceOutUp {
  20% { transform: translate3d(0, -10px, 0); }
  40%, 45% { transform: translate3d(0, 20px, 0); opacity: 1; }
  to { transform: translate3d(0, -2000px, 0); opacity: 0; }
}

/* Flippers */
@keyframes flip {
  from { transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, -360deg); animation-timing-function: ease-out; }
  40% { transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px) rotate3d(0, 1, 0, -190deg); animation-timing-function: ease-out; }
  50% { transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px) rotate3d(0, 1, 0, -170deg); animation-timing-function: ease-in; }
  80% { transform: perspective(400px) scale3d(0.95, 0.95, 0.95) translate3d(0, 0, 0) rotate3d(0, 1, 0, 0deg); animation-timing-function: ease-in; }
  to { transform: perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, 0deg); animation-timing-function: ease-in; }
}

@keyframes flipInX {
  from { transform: perspective(400px) rotate3d(1, 0, 0, 90deg); animation-timing-function: ease-in; opacity: 0; }
  40% { transform: perspective(400px) rotate3d(1, 0, 0, -20deg); animation-timing-function: ease-in; }
  60% { transform: perspective(400px) rotate3d(1, 0, 0, 10deg); opacity: 1; }
  80% { transform: perspective(400px) rotate3d(1, 0, 0, -5deg); }
  to { transform: perspective(400px); }
}

@keyframes flipInY {
  from { transform: perspective(400px) rotate3d(0, 1, 0, 90deg); animation-timing-function: ease-in; opacity: 0; }
  40% { transform: perspective(400px) rotate3d(0, 1, 0, -20deg); animation-timing-function: ease-in; }
  60% { transform: perspective(400px) rotate3d(0, 1, 0, 10deg); opacity: 1; }
  80% { transform: perspective(400px) rotate3d(0, 1, 0, -5deg); }
  to { transform: perspective(400px); }
}

@keyframes flipOutX {
  from { transform: perspective(400px); }
  30% { transform: perspective(400px) rotate3d(1, 0, 0, -20deg); opacity: 1; }
  to { transform: perspective(400px) rotate3d(1, 0, 0, 90deg); opacity: 0; }
}

@keyframes flipOutY {
  from { transform: perspective(400px); }
  30% { transform: perspective(400px) rotate3d(0, 1, 0, -15deg); opacity: 1; }
  to { transform: perspective(400px) rotate3d(0, 1, 0, 90deg); opacity: 0; }
}

/* Specials */
@keyframes hinge {
  0% { transform-origin: top left; animation-timing-function: ease-in-out; }
  20%, 60% { transform-origin: top left; animation-timing-function: ease-in-out; transform: rotate3d(0, 0, 1, 80deg); }
  40%, 80% { transform-origin: top left; animation-timing-function: ease-in-out; transform: rotate3d(0, 0, 1, 60deg); }
  to { transform: translate3d(0, 700px, 0); opacity: 0; }
}

@keyframes jackInTheBox {
  from { opacity: 0; transform-origin: center bottom; transform: scale(0.1) rotate(30deg); }
  50% { transform: rotate(-10deg); }
  70% { transform: rotate(3deg); }
  to { transform: scale(1); }
}

@keyframes rollIn {
  from { opacity: 0; transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes rollOut {
  from { opacity: 1; }
  to { opacity: 0; transform: translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg); }
}

/* Spin - basic utility */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// 組合動畫規則 - 用於 UnoCSS
export const 組合動畫規則 = [
  // 基礎進入/退出
  ['animate-in', { animation: 'enter var(--tw-duration, 1000ms) var(--tw-ease, ease) var(--tw-delay, 0s) var(--tw-repeat, 1) var(--tw-direction, normal) var(--tw-fill-mode, none)' }],
  ['animate-out', { animation: 'exit var(--tw-duration, 1000ms) var(--tw-ease, ease) var(--tw-delay, 0s) var(--tw-repeat, 1) var(--tw-direction, normal) var(--tw-fill-mode, forwards)' }],
  
  // 淡入淡出
  ['fade-in', { '--tw-opacity': '0' }],
  ['fade-out', { '--tw-opacity': '0' }],
  [/^fade-in-(\d+)$/, ([, d]: any) => ({ '--tw-opacity': `${Number(d) / 100}` })],
  [/^fade-out-(\d+)$/, ([, d]: any) => ({ '--tw-opacity': `${Number(d) / 100}` })],
  
  // 縮放
  ['zoom-in', { '--tw-scale': '0' }],
  ['zoom-out', { '--tw-scale': '0' }],
  [/^zoom-in-(\d+)$/, ([, d]: any) => ({ '--tw-scale': `${Number(d) / 100}` })],
  [/^zoom-out-(\d+)$/, ([, d]: any) => ({ '--tw-scale': `${Number(d) / 100}` })],
  
  // 旋轉 - Z軸
  ['spin-in', { '--tw-rotate-z': '1', '--tw-rotate-angle': '360deg' }],
  ['spin-out', { '--tw-rotate-z': '1', '--tw-rotate-angle': '360deg' }],
  [/^spin-in-(\d+)$/, ([, d]: any) => ({ '--tw-rotate-z': '1', '--tw-rotate-angle': `${d}deg` })],
  [/^spin-out-(\d+)$/, ([, d]: any) => ({ '--tw-rotate-z': '1', '--tw-rotate-angle': `${d}deg` })],
  
  // 旋轉 - X軸（3D）
  ['spin-in-x', { '--tw-rotate-x': '1', '--tw-rotate-angle': '90deg' }],
  ['spin-out-x', { '--tw-rotate-x': '1', '--tw-rotate-angle': '90deg' }],
  [/^spin-in-x-(\d+)$/, ([, d]: any) => ({ '--tw-rotate-x': '1', '--tw-rotate-angle': `${d}deg` })],
  [/^spin-out-x-(\d+)$/, ([, d]: any) => ({ '--tw-rotate-x': '1', '--tw-rotate-angle': `${d}deg` })],
  
  // 旋轉 - Y軸（3D）
  ['spin-in-y', { '--tw-rotate-y': '1', '--tw-rotate-angle': '90deg' }],
  ['spin-out-y', { '--tw-rotate-y': '1', '--tw-rotate-angle': '90deg' }],
  [/^spin-in-y-(\d+)$/, ([, d]: any) => ({ '--tw-rotate-y': '1', '--tw-rotate-angle': `${d}deg` })],
  [/^spin-out-y-(\d+)$/, ([, d]: any) => ({ '--tw-rotate-y': '1', '--tw-rotate-angle': `${d}deg` })],
  
  // 滑動進入
  ['slide-in-from-top', { '--tw-translate-y': '-200%' }],
  ['slide-in-from-bottom', { '--tw-translate-y': '200%' }],
  ['slide-in-from-left', { '--tw-translate-x': '-200%' }],
  ['slide-in-from-right', { '--tw-translate-x': '200%' }],
  [/^slide-in-from-top-(\d+)$/, ([, d]: any) => ({ '--tw-translate-y': `-${d}%` })],
  [/^slide-in-from-bottom-(\d+)$/, ([, d]: any) => ({ '--tw-translate-y': `${d}%` })],
  [/^slide-in-from-left-(\d+)$/, ([, d]: any) => ({ '--tw-translate-x': `-${d}%` })],
  [/^slide-in-from-right-(\d+)$/, ([, d]: any) => ({ '--tw-translate-x': `${d}%` })],
  
  // 滑動退出
  ['slide-out-to-top', { '--tw-translate-y': '-200%' }],
  ['slide-out-to-bottom', { '--tw-translate-y': '200%' }],
  ['slide-out-to-left', { '--tw-translate-x': '-200%' }],
  ['slide-out-to-right', { '--tw-translate-x': '200%' }],
  [/^slide-out-to-top-(\d+)$/, ([, d]: any) => ({ '--tw-translate-y': `-${d}%` })],
  [/^slide-out-to-bottom-(\d+)$/, ([, d]: any) => ({ '--tw-translate-y': `${d}%` })],
  [/^slide-out-to-left-(\d+)$/, ([, d]: any) => ({ '--tw-translate-x': `-${d}%` })],
  [/^slide-out-to-right-(\d+)$/, ([, d]: any) => ({ '--tw-translate-x': `${d}%` })],
  
  // 模糊
  ['blur-in', { '--tw-blur': '8px' }],
  ['blur-out', { '--tw-blur': '8px' }],
  [/^blur-in-(\d+)$/, ([, d]: any) => ({ '--tw-blur': `${d}px` })],
  [/^blur-out-(\d+)$/, ([, d]: any) => ({ '--tw-blur': `${d}px` })],
  
  // 傾斜 (Skew)
  ['skew-in-x', { '--tw-skew-x': '12deg' }],
  ['skew-in-y', { '--tw-skew-y': '12deg' }],
  ['skew-out-x', { '--tw-skew-x': '12deg' }],
  ['skew-out-y', { '--tw-skew-y': '12deg' }],
  [/^skew-in-x-(\d+)$/, ([, d]: any) => ({ '--tw-skew-x': `${d}deg` })],
  [/^skew-in-y-(\d+)$/, ([, d]: any) => ({ '--tw-skew-y': `${d}deg` })],
  [/^skew-out-x-(\d+)$/, ([, d]: any) => ({ '--tw-skew-x': `${d}deg` })],
  [/^skew-out-y-(\d+)$/, ([, d]: any) => ({ '--tw-skew-y': `${d}deg` })],
  
  // 縮放 X/Y 軸分離
  ['scale-x-in', { '--tw-scale-x': '0' }],
  ['scale-y-in', { '--tw-scale-y': '0' }],
  ['scale-x-out', { '--tw-scale-x': '0' }],
  ['scale-y-out', { '--tw-scale-y': '0' }],
  [/^scale-x-in-(\d+)$/, ([, d]: any) => ({ '--tw-scale-x': `${Number(d) / 100}` })],
  [/^scale-y-in-(\d+)$/, ([, d]: any) => ({ '--tw-scale-y': `${Number(d) / 100}` })],
  [/^scale-x-out-(\d+)$/, ([, d]: any) => ({ '--tw-scale-x': `${Number(d) / 100}` })],
  [/^scale-y-out-(\d+)$/, ([, d]: any) => ({ '--tw-scale-y': `${Number(d) / 100}` })],
  
  // 透視 (Perspective)
  [/^perspective-(\d+)$/, ([, d]: any) => ({ '--tw-perspective': `${d}px` })],
  
  // 變換原點 (Transform Origin)
  ['origin-center', { '--tw-transform-origin': 'center' }],
  ['origin-top', { '--tw-transform-origin': 'top' }],
  ['origin-top-right', { '--tw-transform-origin': 'top right' }],
  ['origin-right', { '--tw-transform-origin': 'right' }],
  ['origin-bottom-right', { '--tw-transform-origin': 'bottom right' }],
  ['origin-bottom', { '--tw-transform-origin': 'bottom' }],
  ['origin-bottom-left', { '--tw-transform-origin': 'bottom left' }],
  ['origin-left', { '--tw-transform-origin': 'left' }],
  ['origin-top-left', { '--tw-transform-origin': 'top left' }],
] as any;

// 特殊動畫規則 - 硬編碼 keyframes
export const 特殊動畫規則 = [
  // 特殊實用動畫
  ['accordion-down', { animation: 'accordion-down 0.2s ease-out' }],
  ['accordion-up', { animation: 'accordion-up 0.2s ease-out' }],
  ['collapsible-down', { animation: 'collapsible-down 0.2s ease-out' }],
  ['collapsible-up', { animation: 'collapsible-up 0.2s ease-out' }],
  ['caret-blink', { animation: 'caret-blink 1.25s ease-out infinite' }],
  
  // Attention Seekers
  ['animate-bounce', { animation: 'bounce 1s infinite' }],
  ['animate-flash', { animation: 'flash 1s' }],
  ['animate-pulse', { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }],
  ['animate-rubber-band', { animation: 'rubberBand 1s' }],
  ['animate-shake-x', { animation: 'shakeX 1s' }],
  ['animate-shake-y', { animation: 'shakeY 1s' }],
  ['animate-head-shake', { animation: 'headShake 1s' }],
  ['animate-swing', { animation: 'swing 1s' }],
  ['animate-tada', { animation: 'tada 1s' }],
  ['animate-wobble', { animation: 'wobble 1s' }],
  ['animate-jello', { animation: 'jello 1s' }],
  ['animate-heart-beat', { animation: 'heartBeat 1.3s' }],
  
  // Back Entrances
  ['animate-back-in-down', { animation: 'backInDown 1s' }],
  ['animate-back-in-left', { animation: 'backInLeft 1s' }],
  ['animate-back-in-right', { animation: 'backInRight 1s' }],
  ['animate-back-in-up', { animation: 'backInUp 1s' }],
  
  // Back Exits
  ['animate-back-out-down', { animation: 'backOutDown 1s forwards' }],
  ['animate-back-out-left', { animation: 'backOutLeft 1s forwards' }],
  ['animate-back-out-right', { animation: 'backOutRight 1s forwards' }],
  ['animate-back-out-up', { animation: 'backOutUp 1s forwards' }],
  
  // Bouncing Entrances
  ['animate-bounce-in', { animation: 'bounceIn 750ms' }],
  ['animate-bounce-in-down', { animation: 'bounceInDown 750ms' }],
  ['animate-bounce-in-left', { animation: 'bounceInLeft 750ms' }],
  ['animate-bounce-in-right', { animation: 'bounceInRight 750ms' }],
  ['animate-bounce-in-up', { animation: 'bounceInUp 750ms' }],
  
  // Bouncing Exits
  ['animate-bounce-out', { animation: 'bounceOut 750ms forwards' }],
  ['animate-bounce-out-down', { animation: 'bounceOutDown 750ms forwards' }],
  ['animate-bounce-out-left', { animation: 'bounceOutLeft 750ms forwards' }],
  ['animate-bounce-out-right', { animation: 'bounceOutRight 750ms forwards' }],
  ['animate-bounce-out-up', { animation: 'bounceOutUp 750ms forwards' }],
  
  // Flippers
  ['animate-flip', { animation: 'flip 1s', backfaceVisibility: 'visible' }],
  ['animate-flip-in-x', { animation: 'flipInX 1s', backfaceVisibility: 'visible' }],
  ['animate-flip-in-y', { animation: 'flipInY 1s', backfaceVisibility: 'visible' }],
  ['animate-flip-out-x', { animation: 'flipOutX 1s forwards', backfaceVisibility: 'visible' }],
  ['animate-flip-out-y', { animation: 'flipOutY 1s forwards', backfaceVisibility: 'visible' }],
  
  // Specials
  ['animate-hinge', { animation: 'hinge 2s' }],
  ['animate-jack-in-the-box', { animation: 'jackInTheBox 1s' }],
  ['animate-roll-in', { animation: 'rollIn 1s' }],
  ['animate-roll-out', { animation: 'rollOut 1s forwards' }],
  
  // Basic utilities
  ['animate-spin', { animation: 'spin 1s linear infinite' }],
] as any;

// 動畫參數規則
export const 動畫參數規則 = [
  // 持續時間
  [/^duration-(\d+)$/, ([, d]: any) => ({ '--tw-duration': `${d}ms` })],
  
  // 延遲
  [/^delay-(\d+)$/, ([, d]: any) => ({ '--tw-delay': `${d}ms` })],
  
  // 重複次數
  [/^repeat-(\d+)$/, ([, d]: any) => ({ '--tw-repeat': d })],
  ['repeat-infinite', { '--tw-repeat': 'infinite' }],
  
  // 填充模式
  ['fill-none', { '--tw-fill-mode': 'none' }],
  ['fill-forwards', { '--tw-fill-mode': 'forwards' }],
  ['fill-backwards', { '--tw-fill-mode': 'backwards' }],
  ['fill-both', { '--tw-fill-mode': 'both' }],
  
  // 方向
  ['direction-normal', { '--tw-direction': 'normal' }],
  ['direction-reverse', { '--tw-direction': 'reverse' }],
  ['direction-alternate', { '--tw-direction': 'alternate' }],
  ['direction-alternate-reverse', { '--tw-direction': 'alternate-reverse' }],
  
  // Easing
  ['ease-linear', { '--tw-ease': 'linear' }],
  ['ease-in', { '--tw-ease': 'ease-in' }],
  ['ease-out', { '--tw-ease': 'ease-out' }],
  ['ease-in-out', { '--tw-ease': 'ease-in-out' }],
] as any;

// 所有動畫規則匯總
export const 所有動畫規則 = [
  ...組合動畫規則,
  ...特殊動畫規則,
  ...動畫參數規則,
];

// 生成 CSS 變數和 Keyframes
export function 生成動畫CSS(): string {
  return `${動畫CSS變數}\n${動畫Keyframes}`;
}

// 生成完整的動畫 CSS（包含基礎類）
export function 生成完整動畫CSS(): string {
  return `
${生成動畫CSS()}

/* ============================================
   Animation Base Classes
   ============================================ */

.animate-in {
  animation: enter var(--tw-duration, 1000ms) var(--tw-ease, ease) var(--tw-delay, 0s) var(--tw-repeat, 1) var(--tw-direction, normal) var(--tw-fill-mode, none);
}

.animate-out {
  animation: exit var(--tw-duration, 1000ms) var(--tw-ease, ease) var(--tw-delay, 0s) var(--tw-repeat, 1) var(--tw-direction, normal) var(--tw-fill-mode, forwards);
}
`;
}
