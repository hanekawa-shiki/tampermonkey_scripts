// ==UserScript==
// @name         annas torrents/magnet export
// @namespace    https://github.com/hanekawa-shiki/tampermonkey_scripts
// @version      1.0.11
// @description  导出annas-archive当前页torrents/magnets
// @author       hanekawa-shiki
// @match        *://*.annas-archive.org/torrents/*
// @match        *://*.annas-archive.gl/torrents/*
// @match        *://*.annas-archive.pk/torrents/*
// @match        *://*.annas-archive.gd/torrents/*
// @grant        unsafeWindow
// @license MIT
// ==/UserScript==

interface TorrentData {
  date: string;
  torrent?: string;
  magnet?: string;
}

type DownloadData = Record<string, {
  torrent: string[];
  magnet: string[];
}>;

(function () {
  'use strict';
  const DOMAIN = window.location.origin;

  const downloadFile = (content: string, fileName: string, mimeType: string = 'text/plain'): void => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  const getData = (): DownloadData => {
    const tbody = document.querySelector(
      '.overflow-hidden.max-w-full table tbody'
    );

    if (!tbody) {
      console.warn('[annaTorExport] 未找到种子表格，请确认当前页面包含种子列表');
      return {};
    }

    const rows = Array.from(tbody.children).filter(
      (item) => item.hasAttribute('class') && item.getAttribute('class') === ''
    );

    const parsed: TorrentData[] = rows.map((row) => {
      const obj: TorrentData = { date: '', torrent: '', magnet: '' };

      Array.from(row.children).forEach((cell) => {
        if (cell.getAttribute('title') === 'Date added') {
          obj.date = cell.textContent?.trim() ?? '';
        }

        if (cell.className === 'p-0 break-all') {
          Array.from(cell.children).forEach((link) => {
            const text = link.textContent ?? '';
            const href = link.getAttribute('href') ?? '';
            if (text.includes('torrent')) {
              obj.torrent = DOMAIN + href;
            }
            if (text.includes('magnet')) {
              obj.magnet = href;
            }
          });
        }
      });

      return obj;
    });

    // 仅保留包含 torrent 或 magnet 链接的条目
    const valid = parsed.filter(
      (item) => item.torrent || item.magnet
    );

    const res: DownloadData = {};

    valid.forEach(({ date, torrent, magnet }) => {
      if (!date) return;
      if (!res[date]) {
        res[date] = { torrent: [], magnet: [] };
      }
      if (torrent) res[date].torrent.push(torrent);
      if (magnet) res[date].magnet.push(magnet);
    });

    return res;
  }


  const handleDownload = (obj: DownloadData): void => {
    const hasData = Object.values(obj).some(
      (v) => v.torrent.length > 0 || v.magnet.length > 0
    );

    if (!hasData) {
      alert('当前页面没有找到可导出的种子或磁力链接');
      return;
    }

    const time = new Date().getTime();
    const lines: Record<string, string[]> = { torrent: [], magnet: [] };

    Object.entries(obj).forEach(([date, { torrent, magnet }]) => {
      lines.torrent.push(`\r\n\r\n${date}\r\n${torrent.join('\r\n')}`);
      lines.magnet.push(`\r\n\r\n${date}\r\n${magnet.join('\r\n')}`);
    });

    downloadFile(lines.torrent.join(''), `Torrent_${time}.txt`);
    downloadFile(lines.magnet.join(''), `Magnet_${time}.txt`);
  };

  function createStyledDownloadButton(): void {
    const button = document.createElement('button');
    button.textContent = '导出种子/磁力链接';
    button.type = 'button';

    Object.assign(button.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '10px 20px',
      backgroundColor: '#007BFF',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      zIndex: '9999',
      transition: 'background-color 0.2s',
    });

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#0056b3';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#007BFF';
    });

    button.addEventListener('click', () => {
      handleDownload(getData());
    });

    document.body.appendChild(button);
  }

  createStyledDownloadButton();

})();

