'use client';

/**
 * ThemeScript — injected as the very first child of <html> so the correct
 * data-theme is set before any CSS or React paint, preventing a flash of the
 * wrong theme on reload.
 */
export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('lumina-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}var p=new URLSearchParams(window.location.search);var l=p.get('locale')||p.get('lang')||localStorage.getItem('lumina-locale');if(l&&['ar','he','fa','ur'].some(function(rtl){return l.startsWith(rtl)})){document.documentElement.dir='rtl';document.documentElement.lang=l}}catch(e){}})();`,
      }}
    />
  );
}
