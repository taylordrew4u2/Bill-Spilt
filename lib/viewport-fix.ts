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
 * doesn't change (iOS's innerWidth does). A layout at least 960px wide is
 * desktop mode, where any real shrink (>= 1.15x) is corrected — that covers
 * small phones in landscape and foldables (1.3–1.5x). Narrower layouts are
 * page zoom, corrected only from 1.5x so a user's own mild zoom-out is left
 * alone. Orientation comes from the device (window.orientation, else the
 * screen's own shape), not the viewport's aspect, which differs from the
 * device's in a split-screen window; a window
 * narrower than the screen is measured by its visual viewport. Re-evaluated
 * on resize, rotation and load — skipped when nothing changed, since mobile
 * browsers fire resize while the URL bar hides on scroll — and exposed as
 * window.__bbViewportFix so the app can force a re-apply if React ever resets
 * <html>. Plain ES5, and wrapped so a failure can't block the page.
 */

/** Breakpoints (px) shared with the Tailwind config's responsive variants.
 *  Under the fix each one the real screen width meets sets `bb-w<N>`. */
export const BREAKPOINTS = {
  xs: 360,
  w400: 400,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// The fix only applies below 768px, so only the breakpoints under that can
// ever be met.
const PHONE_BREAKPOINTS = Object.values(BREAKPOINTS).filter((px) => px < 768);

export const VIEWPORT_FIX_SCRIPT = `(function(){try{
var d=document.documentElement,mq=window.matchMedia,BP=${JSON.stringify(PHONE_BREAKPOINTS)},last='';
function run(force){
  var on=false,r=1,dw=0,lw=d.clientWidth||window.innerWidth;
  if(mq&&mq('(pointer: coarse)').matches){
    var wo=window.orientation;
    var land=typeof wo==='number'?(wo===90||wo===-90):screen.width>screen.height;
    dw=land?Math.max(screen.width,screen.height):Math.min(screen.width,screen.height);
    var vv=window.visualViewport;
    if(vv&&vv.scale<1){var pw=vv.width*vv.scale;if(pw>100&&pw<dw-1){dw=pw;}}
    var ratio=dw?lw/dw:1;
    if(dw&&dw<768&&ratio>=(lw>=960?1.15:1.5)){on=true;r=Math.round(ratio*1000)/1000;}
  }
  var key=on+'|'+r+'|'+dw;
  if(!force&&key===last){return;}
  last=key;
  d.classList.toggle('bb-phone-fix',on);
  for(var i=0;i<BP.length;i++){d.classList.toggle('bb-w'+BP[i],on&&dw>=BP[i]);}
  d.style.fontSize=on?(r*100)+'%':'';
  d.style.setProperty('--bb-r',String(r));
}
window.__bbViewportFix=function(){run(true);};
run(true);
window.addEventListener('resize',function(){run();});
window.addEventListener('orientationchange',function(){run();});
window.addEventListener('load',function(){run();});
if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){run();});}
}catch(e){}})();`;
