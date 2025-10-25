import { Application } from "../Application.js";

export default class BlogApp extends Application {
  _onLaunch() {
    const win = new $Window({
      title: "My 90s Blog",
      width: 800,
      height: 600,
      resizable: true,
      content: `<iframe src="src/data/blog/index.html" style="width: 100%; height: 100%; border: 0;"></iframe>`,
    });

    const iframe = win.element.querySelector("iframe");
    iframe.addEventListener("load", () => {
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.addEventListener("click", (e) => {
        const target = e.target.closest("a");
        if (target && target.href) {
          e.preventDefault();
          this.openPost(target.href, target.textContent);
        }
      });
    });

    win.show();
  }

  openPost(url, linkText) {
    const postWin = new $Window({
      title: `Blog Post: ${linkText}`,
      width: 640,
      height: 480,
      resizable: true,
      content: `<iframe src="${url}" style="width: 100%; height: 100%; border: 0;"></iframe>`,
    });
    postWin.show();
  }
}
