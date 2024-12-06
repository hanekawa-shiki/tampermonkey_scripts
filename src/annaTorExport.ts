// ==UserScript==
// @name         annas torrents/magnet export
// @namespace    https://github.com/hanekawa-shiki/tampermonkey_scripts
// @version      2024-12-06
// @description  导出annas-archive当前页torrents/magnets
// @author       hanekawa-shiki
// @match        *://annas-archive.org/torrents/*
// @grant        unsafeWindow
// @license MIT
// ==/UserScript==

interface TorrentData {
  date: string;
  torrent?: string;
  magnet?: string;
}
interface DownloadData {
  [key: string]: {
    torrent: string[],
    magnet: string[]
  };
}

(function () {
  'use strict';
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
    const target = document.querySelector('.overflow-hidden.max-w-full table tbody')?.children;

    const targetList = target ? Array.from(target) : [];

    const targetListResult = targetList.filter((item: Element) =>
      item.hasAttribute('class') && item.getAttribute('class') === ''
    );

    const resList: TorrentData[] = targetListResult.map((item1: Element) => {
      const obj: TorrentData = { date: '', torrent: '', magnet: '' };

      Array.from(item1.children).forEach((item2: Element) => {
        if (item2.getAttribute('title') === 'Date added') {
          obj.date = item2.textContent?.trim() ?? '';
        }

        if (item2.className === 'p-0 break-all') {
          Array.from(item2.children).forEach((item3: Element) => {
            if (item3.textContent && item3.textContent.includes('torrent')) {
              obj.torrent = item3.getAttribute('href') ?? '';
            }
            if (item3.textContent && item3.textContent.includes('magnet')) {
              obj.magnet = item3.getAttribute('href') ?? '';
            }
          });
        }
      });

      return obj;
    });

    const resList1 = resList.filter(item => Object.keys(item).length > 1);

    const res: Record<string, { torrent: string[], magnet: string[] }> = {};

    resList1.forEach(({ date, torrent, magnet }) => {
      if (date) {
        if (!res[date]) {
          res[date] = { torrent: [], magnet: [] };
        }
        if (torrent) {
          res[date].torrent.push(torrent);
        }
        if (magnet) {
          res[date].magnet.push(magnet);
        }
      }
    });

    return res
  }


  const handleDownload = (obj: DownloadData): void => {
    let torrentContent = '';
    let magnetContent = '';
    const time = new Date().getTime();
    Object.entries(obj).forEach(([key, { torrent, magnet }]) => {
      torrentContent = `${torrentContent}\r\n\r\n${key}\r\n${torrent.join('\r\n')}`
      magnetContent = `${magnetContent}\r\n\r\n${key}\r\n${magnet.join('\r\n')}`
    })
    downloadFile(torrentContent, `Torrent_${time}.txt`);
    downloadFile(magnetContent, `Magnet_${time}.txt`);

  }



  function createStyledDownloadButton(): void {
    // 创建按钮元素
    const button = document.createElement('button');
    button.textContent = '导出种子/磁力链接';

    // 设置按钮样式
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
    });

    // 鼠标悬停样式
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#0056b3';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#007BFF';
    });

    // 定义下载事件
    button.addEventListener('click', () => {
      handleDownload(getData())
    });

    // 将按钮添加到页面
    document.body.appendChild(button);
  }

  createStyledDownloadButton();

})();

