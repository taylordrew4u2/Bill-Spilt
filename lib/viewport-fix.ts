/**
 * Inline <head> script (runs before first paint) that keeps a phone on the
 * phone layout, at phone size, when the browser lays the page out
 * desktop-wide.
 *
 * "Desktop site" mode — Chrome and Samsung Internet's menu toggle, Safari's
 * "Request Desktop Website" — ignores the viewport meta tag and lays the page
 * out 980px wide, then shrinks it to fit the screen: 17px text lands at ~7px
 * and the tablet/desktop breakpoints switch on. No page can turn that mode
 * off, but it can undo its effect.
 *
 * When a touch screen under 768px wide (in its current orientation) is
 * showing a layout at least 1.5x its own width, raise the root font size by
 * that ratio. Every size in the app is in rem, so the whole UI scales back to
 * phone size — without CSS zoom, which scales viewport units, skews pointer
 * math for gestures and positioned popovers, and differs between WebKit and
 * Chromium. It also adds `bb-phone-fix` plus `bb-w<N>` for each breakpoint
 * the real screen width meets; the Tailwind config uses those so responsive
 * variants follow the phone's width rather than the 980px layout.
 *
 * The layout width comes from documentElement.clientWidth, which pinch-zoom
 * doesn't change (iOS's innerWidth does). 1.5x targets desktop mode (2.3–2.7x
 * on phones) and leaves a user's own mild page zoom alone. Re-evaluated on
 * resize and rotation, and exposed as window.__bbViewportFix so the app can
 * re-apply it if React ever resets <html>. Plain ES5, and wrapped so a
 * failure can't block the page.
 */
export const VIEWPORT_FIX_SCRIPT = `(function(){try{
var d=document.documentElement,mq=window.matchMedia,BP=[360,400,640,768,1024,1280,1536];
function run(){
  var on=false,r=1,dw=0;
  if(mq&&mq('(pointer: coarse)').matches){
    var land=mq('(orientation: landscape)').matches;
    dw=land?Math.max(screen.width,screen.height):Math.min(screen.width,screen.height);
    var lw=d.clientWidth||window.innerWidth;
    if(dw&&dw<768&&lw/dw>=1.5){on=true;r=Math.round(lw/dw*1000)/1000;}
  }
  d.classList.toggle('bb-phone-fix',on);
  for(var i=0;i<BP.length;i++){d.classList.toggle('bb-w'+BP[i],on&&dw>=BP[i]);}
  d.style.fontSize=on?(r*100)+'%':'';
}
window.__bbViewportFix=run;
run();
window.addEventListener('resize',run);
window.addEventListener('orientationchange',run);
}catch(e){}})();`;
