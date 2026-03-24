export function createSocialPanel() {
  const tab = document.createElement('div');
  tab.style.cssText = 'position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:15;cursor:pointer;background:rgba(0,10,20,0.85);border:1px solid rgba(0,255,255,0.3);border-left:none;border-radius:0 8px 8px 0;padding:10px 6px;writing-mode:vertical-rl;text-orientation:mixed;color:#00ffff;font-family:monospace;font-size:13px;letter-spacing:2px;backdrop-filter:blur(8px);transition:opacity 0.3s;';
  tab.textContent = 'Social';
  document.body.appendChild(tab);

  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:-220px;top:50%;transform:translateY(-50%);z-index:15;width:200px;background:rgba(0,10,20,0.9);border:1px solid rgba(0,255,255,0.3);border-left:none;border-radius:0 12px 12px 0;padding:20px;font-family:monospace;color:#ccc;font-size:13px;backdrop-filter:blur(10px);transition:left 0.3s ease;box-shadow:5px 0 30px rgba(0,255,255,0.1);cursor:pointer;';
  document.body.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'Follow Us';
  title.style.cssText = 'color:#00ffff;font-size:16px;margin-bottom:16px;text-shadow:0 0 8px #00ffff;border-bottom:1px solid rgba(0,255,255,0.2);padding-bottom:8px;';
  panel.appendChild(title);

  const links = [
    { name: 'Discord', url: 'https://discord.gg/ultrakingdoms', icon: '\uD83D\uDCAC' },
    { name: 'X / Twitter', url: 'https://x.com/ultrakingdoms', icon: '\uD835\uDD4F' },
    { name: 'YouTube', url: 'https://youtube.com/@ultrakingdoms', icon: '\u25B6' },
    { name: 'Instagram', url: 'https://instagram.com/ultrakingdoms', icon: '\uD83D\uDCF7' },
    { name: 'TikTok', url: 'https://tiktok.com/@ultrakingdoms', icon: '\u266A' },
  ];

  links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.cssText = 'display:block;color:#ccc;text-decoration:none;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);transition:color 0.2s;';
    a.textContent = link.icon + '  ' + link.name;
    a.addEventListener('mouseenter', () => { a.style.color = '#00ffff'; });
    a.addEventListener('mouseleave', () => { a.style.color = '#ccc'; });
    a.addEventListener('click', (e) => e.stopPropagation());
    panel.appendChild(a);
  });

  let open = false;

  function toggle() {
    open = !open;
    panel.style.left = open ? '0' : '-220px';
    tab.style.opacity = open ? '0' : '1';
    tab.style.pointerEvents = open ? 'none' : 'auto';
  }

  tab.addEventListener('click', toggle);
  panel.addEventListener('click', toggle);

  return { toggle };
}
