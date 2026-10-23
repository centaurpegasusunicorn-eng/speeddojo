// Kept out of lib/theme.ts (a client module) so the root layout, a Server
// Component, can read it as a plain string.
export const THEME_KEY = "dojo_theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
