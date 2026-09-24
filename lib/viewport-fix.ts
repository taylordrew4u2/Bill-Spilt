/**
 * Inline <head> script (runs before first paint) that keeps a phone on the
 * phone layout when the browser lays the page out desktop-wide.
 *
 * "Desktop site" mode — Chrome and Samsung Internet's menu toggle, Safari's
 * "Request Desktop Website" — ignores the viewport meta tag and lays the page
 * out 980px wide, then shrinks it to fit the screen: 17px text lands at ~7px,
 * and the tablet/desktop breakpoints switch on. A page zoomed below 100% does
 * the same to a lesser degree. No page can turn that mode off, but it can
 * undo its effect: when a touch screen under 768px wide (in its current
 * orientation) is showing a layout at least 15% wider than itself, scale the
 * root back up by that ratio and add `bb-phone-fix`, which the Tailwind
 * config uses to keep the sm/md/lg breakpoints off. `--bb-zoom` lets CSS
 * undo the zoom on viewport units, which it would otherwise scale too (a
 * 100dvh box would be 2.4 screens tall). Re-evaluated on resize
 * and rotation. Plain ES5 so it runs anywhere, and wrapped so a failure
 * can't block the page.
 */
export const VIEWPORT_FIX_SCRIPT = `(function(){try{
var d=document.documentElement,mq=window.matchMedia;
function run(){
  var on=false,r=1;
  if(mq&&mq('(pointer: coarse)').matches){
    var land=mq('(orientation: landscape)').matches;
    var dw=land?Math.max(screen.width,screen.height):Math.min(screen.width,screen.height);
    var lw=window.innerWidth;
    if(dw&&dw<768&&lw/dw>=1.15){on=true;r=Math.round(lw/dw*1000)/1000;}
  }
  d.classList.toggle('bb-phone-fix',on);
  d.style.zoom=on?String(r):'';
  d.style.setProperty('--bb-zoom',String(r));
}
run();
window.addEventListener('resize',run);
window.addEventListener('orientationchange',run);
}catch(e){}})();`;
