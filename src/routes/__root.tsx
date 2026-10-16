import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Genesis Engine";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "A cosmological laboratory. Sculpt ΛCDM, watch a galaxy, hunt four thin corridors. The physics is not for sale.",
      },
      { name: "theme-color", content: "#09061a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Genesis" },
      { name: "application-name", content: APP_NAME },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="boot" role="status" aria-live="polite">
          <div className="boot-card">
            <p className="boot-name">Genesis</p>
            <p className="boot-line" id="boot-line" suppressHydrationWarning>
              Loading
            </p>
            <div className="boot-track" aria-hidden="true">
              <span className="boot-bar" />
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{var l="";try{l=localStorage.getItem("genesis-engine-locale")||""}catch(e){}var t=l==="ru"?"Небо ещё собирается":l==="be"?"Неба яшчэ збіраецца":"The sky is still gathering";var n=document.getElementById("boot-line");if(n)n.textContent=t;window.__bootAt=performance.now();})();`,
          }}
        />
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
