import '../styles/hud.css';
import { state, STATION_COUNT } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createHud(callbacks) {
  const container = document.getElementById('hud-layer');

  const titleDiv = document.createElement('div'); titleDiv.className = 'hud-title';
  const h1 = document.createElement('h1'); h1.textContent = 'ULTRA KINGDOMS';
  const tagline = document.createElement('div'); tagline.className = 'tagline'; tagline.textContent = 'ENTER THE MULTIVERSE';
  titleDiv.appendChild(h1); titleDiv.appendChild(tagline); container.appendChild(titleDiv);

  const audioDiv = document.createElement('div'); audioDiv.className = 'hud-audio';
  const audioBtn = document.createElement('button'); audioBtn.textContent = '\u{1F50A} OFF';
  audioBtn.addEventListener('click', () => callbacks.onAudioToggle());
  audioDiv.appendChild(audioBtn);
  const volSlider = document.createElement('input');
  volSlider.type = 'range'; volSlider.min = '0'; volSlider.max = '100'; volSlider.value = '50';
  volSlider.style.cssText = 'width:80px;height:4px;accent-color:#00ffff;cursor:pointer;vertical-align:middle;margin-left:8px;opacity:0.7;';
  volSlider.addEventListener('input', () => callbacks.onVolumeChange(volSlider.value / 100));
  volSlider.style.display = 'none';
  audioDiv.appendChild(volSlider);
  container.appendChild(audioDiv);

  const navDiv = document.createElement('div'); navDiv.className = 'hud-nav';
  const prevBtn = document.createElement('button'); prevBtn.textContent = '\u25C0'; prevBtn.disabled = true;
  prevBtn.addEventListener('click', () => callbacks.onPrev());
  const hintWrap = document.createElement('div'); hintWrap.className = 'nav-hint-wrap';
  const hint = document.createElement('span'); hint.className = 'nav-hint'; hint.textContent = 'Use Arrows, Mouse Scroll or A/D';
  const hint2 = document.createElement('span'); hint2.className = 'nav-hint'; hint2.textContent = 'Click or press E to interact';
  hintWrap.appendChild(hint); hintWrap.appendChild(hint2);
  const nextBtn = document.createElement('button'); nextBtn.textContent = '\u25B6';
  nextBtn.addEventListener('click', () => callbacks.onNext());
  navDiv.appendChild(prevBtn); navDiv.appendChild(hintWrap); navDiv.appendChild(nextBtn);
  container.appendChild(navDiv);

  // Progress dots removed — replaced by minimap

  const ctaDiv = document.createElement('div'); ctaDiv.className = 'hud-cta'; ctaDiv.id = 'hud-cta-btn';
  const ctaLink = document.createElement('a'); ctaLink.href = '#'; ctaLink.textContent = 'JOIN THE MULTIVERSE';
  ctaLink.addEventListener('click', (e) => e.preventDefault());
  const ctaMenu = document.createElement('div'); ctaMenu.className = 'hud-cta-menu';
  const dl = document.createElement('a'); dl.href = 'https://ukclient.ultrakingdoms.com/launcher/UltraKingdomsLauncher.exe'; dl.textContent = 'DOWNLOAD ULTRA KINGDOMS';
  const su = document.createElement('a'); su.href = 'https://dashboard.ultrakingdoms.com/register'; su.textContent = 'SIGNUP ON DASHBOARD';
  const merch = document.createElement('a'); merch.href = 'https://ultrakingdoms.store'; merch.target = '_blank'; merch.textContent = 'MERCHANDISE';
  const partner = document.createElement('a'); partner.href = '#'; partner.textContent = 'BECOME A PARTNER';
  partner.addEventListener('click', (e) => { e.preventDefault(); partnerModal.style.display = 'block'; partnerBackdrop.style.display = 'block'; });
  ctaMenu.appendChild(dl); ctaMenu.appendChild(su); ctaMenu.appendChild(merch); ctaMenu.appendChild(partner);
  ctaDiv.appendChild(ctaMenu); ctaDiv.appendChild(ctaLink); container.appendChild(ctaDiv);

  // Partner application modal
  const partnerBackdrop = document.createElement('div');
  partnerBackdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:25;background:rgba(0,0,0,0.6);';
  document.body.appendChild(partnerBackdrop);

  const partnerModal = document.createElement('div');
  partnerModal.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:26;background:rgba(0,10,20,0.95);border:1px solid rgba(0,255,255,0.4);border-radius:12px;padding:28px;max-width:450px;width:90%;box-shadow:0 0 50px rgba(0,255,255,0.2);backdrop-filter:blur(12px);font-family:monospace;';
  document.body.appendChild(partnerModal);

  function closePartner() { partnerModal.style.display = 'none'; partnerBackdrop.style.display = 'none'; }
  partnerBackdrop.addEventListener('click', closePartner);

  const pClose = document.createElement('button');
  pClose.textContent = '\u00D7';
  pClose.style.cssText = 'position:absolute;top:10px;right:14px;background:none;border:none;color:#00ffff;font-size:22px;cursor:pointer;';
  pClose.addEventListener('click', closePartner);
  partnerModal.appendChild(pClose);

  const pTitle = document.createElement('h2');
  pTitle.textContent = 'Partnership Application';
  pTitle.style.cssText = 'margin:0 0 6px;color:#00ffff;font-size:18px;text-shadow:0 0 10px #00ffff;';
  partnerModal.appendChild(pTitle);

  const pSub = document.createElement('p');
  pSub.textContent = 'Join the Ultra Kingdoms partner program.';
  pSub.style.cssText = 'margin:0 0 20px;color:#888;font-size:12px;';
  partnerModal.appendChild(pSub);

  const form = document.createElement('form');
  form.style.cssText = 'display:flex;flex-direction:column;gap:12px;';

  const fieldStyle = 'background:rgba(0,20,40,0.8);border:1px solid rgba(0,255,255,0.2);border-radius:6px;padding:10px 12px;color:#eee;font-family:monospace;font-size:13px;outline:none;';
  const labelStyle = 'color:#aaa;font-size:11px;margin-bottom:2px;';

  const fields = [
    { label: 'Full Name', type: 'text', name: 'name', placeholder: 'Your name' },
    { label: 'Email', type: 'email', name: 'email', placeholder: 'you@example.com' },
    { label: 'Company / Brand', type: 'text', name: 'company', placeholder: 'Your company or brand' },
    { label: 'Website / Social', type: 'url', name: 'website', placeholder: 'https://' },
  ];

  fields.forEach(f => {
    const wrap = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.textContent = f.label;
    lbl.style.cssText = labelStyle;
    wrap.appendChild(lbl);
    const input = document.createElement('input');
    input.type = f.type; input.name = f.name; input.placeholder = f.placeholder; input.required = true;
    input.style.cssText = fieldStyle + 'width:100%;box-sizing:border-box;';
    input.addEventListener('focus', () => { input.style.borderColor = 'rgba(0,255,255,0.5)'; });
    input.addEventListener('blur', () => { input.style.borderColor = 'rgba(0,255,255,0.2)'; });
    wrap.appendChild(input);
    form.appendChild(wrap);
  });

  const msgWrap = document.createElement('div');
  const msgLbl = document.createElement('div');
  msgLbl.textContent = 'Why do you want to partner?';
  msgLbl.style.cssText = labelStyle;
  msgWrap.appendChild(msgLbl);
  const textarea = document.createElement('textarea');
  textarea.name = 'message'; textarea.rows = 3; textarea.placeholder = 'Tell us about your partnership goals...';
  textarea.style.cssText = fieldStyle + 'width:100%;box-sizing:border-box;resize:vertical;';
  textarea.addEventListener('focus', () => { textarea.style.borderColor = 'rgba(0,255,255,0.5)'; });
  textarea.addEventListener('blur', () => { textarea.style.borderColor = 'rgba(0,255,255,0.2)'; });
  msgWrap.appendChild(textarea);
  form.appendChild(msgWrap);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'SUBMIT APPLICATION';
  submitBtn.style.cssText = 'background:rgba(0,255,255,0.15);border:1px solid #00ffff;border-radius:6px;padding:12px;color:#00ffff;font-family:monospace;font-size:14px;cursor:pointer;transition:background 0.2s;margin-top:4px;';
  submitBtn.addEventListener('mouseenter', () => { submitBtn.style.background = 'rgba(0,255,255,0.3)'; });
  submitBtn.addEventListener('mouseleave', () => { submitBtn.style.background = 'rgba(0,255,255,0.15)'; });
  form.appendChild(submitBtn);

  const statusMsg = document.createElement('div');
  statusMsg.style.cssText = 'text-align:center;font-size:13px;margin-top:8px;display:none;';
  form.appendChild(statusMsg);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'SUBMITTING...';
    // Simulate submission — replace with real API call
    setTimeout(() => {
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#00ffaa';
      statusMsg.textContent = 'Application submitted! We\u2019ll be in touch.';
      submitBtn.textContent = 'SUBMITTED';
      setTimeout(closePartner, 2000);
      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'SUBMIT APPLICATION';
        statusMsg.style.display = 'none';
      }, 2500);
    }, 1000);
  });

  partnerModal.appendChild(form);

  function update() {
    prevBtn.disabled = state.currentStation <= 0 || state.isTransitioning;
    nextBtn.disabled = state.currentStation >= STATION_COUNT - 1 || state.isTransitioning;
  }
  function setAudioState(playing) {
    audioBtn.textContent = playing ? '\u{1F50A} ON' : '\u{1F50A} OFF';
    volSlider.style.display = playing ? 'inline-block' : 'none';
  }
  function hideCta() { ctaDiv.style.display = 'none'; }
  function showCta() { ctaDiv.style.display = 'block'; }
  return { update, setAudioState, hideCta, showCta };
}
