// ==UserScript==
// @name         annas-archive
// @namespace    https://github.com/hanekawa-shiki/tampermonkey_scripts
// @version      1.0.11
// @description  导出annas-archive网站的/torrents路径下的torrents和magnets下载链接到文件
// @author       hanekawa-shiki
// @match        *://*.annas-archive.org/torrents/*
// @match        *://*.annas-archive.gl/torrents/*
// @match        *://*.annas-archive.pk/torrents/*
// @match        *://*.annas-archive.gd/torrents/*
// @grant        unsafeWindow
// @license MIT
// ==/UserScript==

"use strict";
(() => {
  // src/annaTorExport.ts
  (function() {
    "use strict";
    const DOMAIN = window.location.origin;
    const downloadFile = (content, fileName, mimeType = "text/plain") => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    const getData = () => {
      const tbody = document.querySelector(
        ".overflow-hidden.max-w-full table tbody"
      );
      if (!tbody) {
        console.warn("[annaTorExport] \u672A\u627E\u5230\u79CD\u5B50\u8868\u683C\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u9875\u9762\u5305\u542B\u79CD\u5B50\u5217\u8868");
        return {};
      }
      const rows = Array.from(tbody.children).filter(
        (item) => item.hasAttribute("class") && item.getAttribute("class") === ""
      );
      const parsed = rows.map((row) => {
        const obj = { date: "", torrent: "", magnet: "" };
        Array.from(row.children).forEach((cell) => {
          if (cell.getAttribute("title") === "Date added") {
            obj.date = cell.textContent?.trim() ?? "";
          }
          if (cell.className === "p-0 break-all") {
            Array.from(cell.children).forEach((link) => {
              const text = link.textContent ?? "";
              const href = link.getAttribute("href") ?? "";
              if (text.includes("torrent")) {
                obj.torrent = DOMAIN + href;
              }
              if (text.includes("magnet")) {
                obj.magnet = href;
              }
            });
          }
        });
        return obj;
      });
      const valid = parsed.filter(
        (item) => item.torrent || item.magnet
      );
      const res = {};
      valid.forEach(({ date, torrent, magnet }) => {
        if (!date) return;
        if (!res[date]) {
          res[date] = { torrent: [], magnet: [] };
        }
        if (torrent) res[date].torrent.push(torrent);
        if (magnet) res[date].magnet.push(magnet);
      });
      return res;
    };
    const handleDownload = (obj) => {
      const hasData = Object.values(obj).some(
        (v) => v.torrent.length > 0 || v.magnet.length > 0
      );
      if (!hasData) {
        alert("\u5F53\u524D\u9875\u9762\u6CA1\u6709\u627E\u5230\u53EF\u5BFC\u51FA\u7684\u79CD\u5B50\u6216\u78C1\u529B\u94FE\u63A5");
        return;
      }
      const time = (/* @__PURE__ */ new Date()).getTime();
      const lines = { torrent: [], magnet: [] };
      Object.entries(obj).forEach(([date, { torrent, magnet }]) => {
        lines.torrent.push(`\r
\r
${date}\r
${torrent.join("\r\n")}`);
        lines.magnet.push(`\r
\r
${date}\r
${magnet.join("\r\n")}`);
      });
      downloadFile(lines.torrent.join(""), `Torrent_${time}.txt`);
      downloadFile(lines.magnet.join(""), `Magnet_${time}.txt`);
    };
    function createStyledDownloadButton() {
      const button = document.createElement("button");
      button.textContent = "\u5BFC\u51FA\u79CD\u5B50/\u78C1\u529B\u94FE\u63A5";
      button.type = "button";
      Object.assign(button.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "10px 20px",
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        fontSize: "14px",
        zIndex: "9999",
        transition: "background-color 0.2s"
      });
      button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "#0056b3";
      });
      button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "#007BFF";
      });
      button.addEventListener("click", () => {
        handleDownload(getData());
      });
      document.body.appendChild(button);
    }
    createStyledDownloadButton();
  })();
})();
// @license MIT
