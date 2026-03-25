import '../styles/modal.css';
import { state, BLOOM_STATES } from '../state/gameState.js';
import { NPC_DATA } from '../npcs/npcData.js';

export function createModal(callbacks) {
  const layer = document.getElementById('modal-layer');
  const backdrop = document.getElementById('modal-backdrop');

  function open(npcIndex) {
    if (state.modalOpen) return;
    const npc = NPC_DATA[npcIndex];
    state.modalOpen = true; state.modalNpcIndex = npcIndex;
    Object.assign(state, BLOOM_STATES.modal);

    layer.textContent = '';

    const closeBtn = document.createElement('button'); closeBtn.className = 'modal-close';
    closeBtn.textContent = '\u00D7'; closeBtn.addEventListener('click', close); layer.appendChild(closeBtn);

    const icon = document.createElement('div'); icon.className = 'modal-icon';
    icon.style.background = npc.hexColor; icon.style.boxShadow = '0 0 15px ' + npc.hexColor; layer.appendChild(icon);

    const name = document.createElement('div'); name.className = 'modal-npc-name';
    name.textContent = npc.name; name.style.color = npc.hexColor; name.style.textShadow = '0 0 10px ' + npc.hexColor; layer.appendChild(name);

    const quote = document.createElement('div'); quote.className = 'modal-quote';
    quote.style.borderColor = npc.hexColor; quote.textContent = npc.quote; layer.appendChild(quote);

    // Rich sections (headings, subheadings, bullets) or simple feature list
    if (npc.sections && npc.sections.length > 0) {
      npc.sections.forEach(section => {
        if (section.heading) {
          const h = document.createElement('div');
          h.textContent = section.heading;
          h.style.cssText = 'font-weight:bold;font-size:16px;color:#fff;margin:16px 0 10px;letter-spacing:2px;text-shadow:0 0 8px ' + npc.hexColor + ';';
          layer.appendChild(h);
        }
        if (section.subheading) {
          const sh = document.createElement('div');
          sh.textContent = section.subheading;
          sh.style.cssText = 'font-size:14px;color:' + npc.hexColor + ';margin:12px 0 6px;font-weight:bold;';
          layer.appendChild(sh);
        }
        if (section.bullets && section.bullets.length > 0) {
          const ul = document.createElement('ul'); ul.className = 'modal-features';
          section.bullets.forEach(b => { const li = document.createElement('li'); li.textContent = b; ul.appendChild(li); });
          layer.appendChild(ul);
        }
        if (section.platforms) {
          const platRow = document.createElement('div');
          platRow.style.cssText = 'display:flex;justify-content:center;gap:12px;margin:14px 0;flex-wrap:wrap;';
          const platIcons = { Xbox: '\u{1F3AE}', PlayStation: '\u{1F579}', Steam: '\u2668', Mobile: '\u{1F4F1}' };
          section.platforms.forEach(p => {
            const badge = document.createElement('div');
            badge.style.cssText = `display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:rgba(0,20,40,0.7);border:1px solid ${npc.hexColor}44;font-size:11px;color:#ccc;font-family:monospace;transition:border-color 0.3s,box-shadow 0.3s;`;
            badge.addEventListener('mouseenter', () => { badge.style.borderColor = npc.hexColor; badge.style.boxShadow = '0 0 10px ' + npc.hexColor + '44'; });
            badge.addEventListener('mouseleave', () => { badge.style.borderColor = npc.hexColor + '44'; badge.style.boxShadow = 'none'; });
            const ico = document.createElement('span');
            ico.textContent = platIcons[p] || '\u2B24';
            ico.style.fontSize = '14px';
            badge.appendChild(ico);
            const lbl = document.createElement('span');
            lbl.textContent = p;
            badge.appendChild(lbl);
            platRow.appendChild(badge);
          });
          const platLabel = document.createElement('div');
          platLabel.textContent = 'APPROVED PLATFORMS';
          platLabel.style.cssText = 'text-align:center;font-size:9px;color:#666;letter-spacing:2px;margin-bottom:4px;font-family:monospace;';
          layer.appendChild(platLabel);
          layer.appendChild(platRow);
        }
        if (section.stats) {
          const statsGrid = document.createElement('div');
          statsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:14px 0;';
          section.stats.forEach(stat => {
            const card = document.createElement('div');
            card.style.cssText = `text-align:center;padding:12px 8px;background:rgba(0,15,30,0.7);border:1px solid ${npc.hexColor}33;border-radius:8px;`;

            const numEl = document.createElement('div');
            numEl.style.cssText = `font-size:28px;font-weight:bold;color:${npc.hexColor};font-family:monospace;line-height:1;`;
            numEl.textContent = '0' + stat.suffix;
            card.appendChild(numEl);

            const labelEl = document.createElement('div');
            labelEl.textContent = stat.label;
            labelEl.style.cssText = 'font-size:11px;color:#ddd;margin-top:4px;font-weight:bold;';
            card.appendChild(labelEl);

            const subEl = document.createElement('div');
            subEl.textContent = stat.sublabel;
            subEl.style.cssText = 'font-size:9px;color:#777;margin-top:2px;';
            card.appendChild(subEl);

            statsGrid.appendChild(card);

            // Animate counter
            const target = stat.value;
            const isFloat = target % 1 !== 0;
            const duration = 1500;
            const startTime = performance.now();
            function tick(now) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = target * eased;
              numEl.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + stat.suffix;
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          });
          layer.appendChild(statsGrid);
        }
        if (section.tagline) {
          const tag = document.createElement('div');
          tag.style.cssText = `text-align:center;margin:16px 0 4px;padding:12px 16px;font-size:13px;color:#fff;font-style:italic;line-height:1.6;border-top:1px solid ${npc.hexColor}33;border-bottom:1px solid ${npc.hexColor}33;`;
          tag.textContent = '\u201C' + section.tagline + '\u201D';
          layer.appendChild(tag);
        }
        if (section.statement) {
          const stmtDiv = document.createElement('div');
          stmtDiv.style.cssText = 'margin:16px 0;padding:14px 16px;background:rgba(0,15,30,0.6);border-left:2px solid ' + npc.hexColor + '88;border-radius:4px;font-size:12px;color:#bbb;line-height:1.8;font-style:italic;';
          section.statement.split('\n\n').forEach((para, pi) => {
            if (pi > 0) {
              const br = document.createElement('div');
              br.style.height = '10px';
              stmtDiv.appendChild(br);
            }
            const p = document.createElement('div');
            p.textContent = para;
            stmtDiv.appendChild(p);
          });
          layer.appendChild(stmtDiv);
        }
        if (section.image) {
          const imgWrap = document.createElement('div');
          imgWrap.style.cssText = 'margin:12px 0;text-align:center;';
          const img = document.createElement('img');
          img.src = section.image;
          img.style.cssText = 'width:100%;border-radius:8px;border:1px solid ' + npc.hexColor + '33;';
          imgWrap.appendChild(img);
          layer.appendChild(imgWrap);
        }
        if (section.logoGrid && section.logoGrid.length > 0) {
          const grid = document.createElement('div');
          grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0;';
          section.logoGrid.forEach(partner => {
            const cell = document.createElement('a');
            cell.href = partner.url || '#';
            cell.target = '_blank';
            cell.rel = 'noopener';
            cell.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;background:rgba(0,15,30,0.7);border:1px solid ${npc.hexColor}33;border-radius:8px;text-decoration:none;transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s;cursor:pointer;`;
            cell.addEventListener('mouseenter', () => {
              cell.style.borderColor = npc.hexColor;
              cell.style.transform = 'translateY(-2px)';
              cell.style.boxShadow = '0 4px 15px ' + npc.hexColor + '33';
            });
            cell.addEventListener('mouseleave', () => {
              cell.style.borderColor = npc.hexColor + '33';
              cell.style.transform = 'translateY(0)';
              cell.style.boxShadow = 'none';
            });
            const img = document.createElement('img');
            img.src = partner.logo;
            img.alt = partner.name;
            img.style.cssText = 'width:48px;height:48px;object-fit:contain;border-radius:6px;background:rgba(255,255,255,0.05);padding:4px;';
            img.addEventListener('error', () => {
              img.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.textContent = partner.name.charAt(0);
              fallback.style.cssText = `width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:${npc.hexColor}22;color:${npc.hexColor};font-size:20px;font-weight:bold;`;
              cell.insertBefore(fallback, cell.firstChild);
            });
            cell.appendChild(img);
            const label = document.createElement('div');
            label.textContent = partner.name;
            label.style.cssText = 'font-size:8px;color:#999;margin-top:4px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px;';
            cell.appendChild(label);
            grid.appendChild(cell);
          });
          layer.appendChild(grid);
        }
        if (section.carousel && section.carousel.length > 0) {
          const count = section.carousel.length;
          let activeIndex = 0;

          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:relative;margin:16px 0;height:180px;perspective:600px;';

          const stage = document.createElement('div');
          stage.style.cssText = 'position:relative;width:100%;height:100%;';
          wrapper.appendChild(stage);

          const slides = [];

          section.carousel.forEach((partner, i) => {
            const slide = document.createElement('a');
            slide.href = partner.url || '#';
            slide.target = '_blank';
            slide.rel = 'noopener';
            slide.style.cssText = 'position:absolute;top:50%;left:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;background:rgba(0,15,30,0.85);border:1px solid ' + npc.hexColor + '33;border-radius:10px;text-decoration:none;cursor:pointer;transition:all 0.5s ease;transform-origin:center center;';

            const img = document.createElement('img');
            img.src = partner.logo;
            img.alt = partner.name;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px;';
            img.addEventListener('error', () => {
              img.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.textContent = partner.name.charAt(0);
              fallback.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:8px;background:${npc.hexColor}22;color:${npc.hexColor};font-size:28px;font-weight:bold;`;
              slide.insertBefore(fallback, slide.firstChild);
            });
            slide.appendChild(img);


            slide.addEventListener('click', (e) => {
              if (i !== activeIndex) {
                e.preventDefault();
                e.stopPropagation();
                activeIndex = i;
                layoutSlides();
              }
            });

            stage.appendChild(slide);
            slides.push(slide);
          });

          function layoutSlides() {
            slides.forEach((slide, i) => {
              let offset = i - activeIndex;
              // Wrap around for circular effect
              if (offset > count / 2) offset -= count;
              if (offset < -count / 2) offset += count;

              const absOffset = Math.abs(offset);
              const isFocused = offset === 0;

              const size = isFocused ? 120 : Math.max(50, 80 - absOffset * 15);
              const widthSize = size * 2;
              const xShift = offset * (isFocused ? 0 : 120 + absOffset * 10);
              const zShift = isFocused ? 0 : -40 - absOffset * 20;
              const opacity = absOffset > 3 ? 0 : (isFocused ? 1 : Math.max(0.3, 0.8 - absOffset * 0.2));
              const zIndex = 10 - absOffset;

              slide.style.width = widthSize + 'px';
              slide.style.height = size + 'px';
              slide.style.transform = `translate(-50%,-50%) translateX(${xShift}px) translateZ(${zShift}px)`;
              slide.style.opacity = opacity;
              slide.style.zIndex = zIndex;
              slide.style.borderColor = isFocused ? npc.hexColor : npc.hexColor + '33';
              slide.style.boxShadow = isFocused ? '0 0 25px ' + npc.hexColor + '55' : 'none';

            });
          }

          // Navigation arrows
          const prevBtn = document.createElement('button');
          prevBtn.textContent = '\u25C0';
          prevBtn.style.cssText = `position:absolute;left:4px;top:50%;transform:translateY(-50%);z-index:15;background:rgba(0,10,20,0.8);border:1px solid ${npc.hexColor}44;color:${npc.hexColor};border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:13px;`;
          prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeIndex = (activeIndex - 1 + count) % count;
            layoutSlides();
          });

          const nextBtn = document.createElement('button');
          nextBtn.textContent = '\u25B6';
          nextBtn.style.cssText = `position:absolute;right:4px;top:50%;transform:translateY(-50%);z-index:15;background:rgba(0,10,20,0.8);border:1px solid ${npc.hexColor}44;color:${npc.hexColor};border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:13px;`;
          nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeIndex = (activeIndex + 1) % count;
            layoutSlides();
          });

          wrapper.appendChild(prevBtn);
          wrapper.appendChild(nextBtn);

          layoutSlides();

          // Auto-rotate every 3 seconds
          let autoRotate = setInterval(() => {
            activeIndex = (activeIndex + 1) % count;
            layoutSlides();
          }, 3000);

          // Pause on hover, resume on leave
          wrapper.addEventListener('mouseenter', () => clearInterval(autoRotate));
          wrapper.addEventListener('mouseleave', () => {
            autoRotate = setInterval(() => {
              activeIndex = (activeIndex + 1) % count;
              layoutSlides();
            }, 3000);
          });

          // Clean up when modal closes
          const carouselObserver = new MutationObserver(() => {
            if (layer.style.display === 'none') {
              clearInterval(autoRotate);
              carouselObserver.disconnect();
            }
          });
          carouselObserver.observe(layer, { attributes: true, attributeFilter: ['style'] });

          layer.appendChild(wrapper);
        }
        if (section.cards && section.cards.length > 0) {
          const isPyramid = section.layout === 'pyramid';
          const isHoneycomb = section.layout === 'honeycomb';
          const scale = state.fontScale || 1;
          const size = (isPyramid ? 100 : isHoneycomb ? 90 : 72) * scale;

          const hexGrid = document.createElement('div');
          if (isPyramid) {
            hexGrid.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;margin:12px 0;';
          } else if (isHoneycomb) {
            hexGrid.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;margin:12px 0;';
          } else {
            hexGrid.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:12px 0;';
          }

          // Split cards into rows based on layout
          let pyramidRows;
          if (isPyramid) {
            pyramidRows = [
              section.cards.slice(0, 3),
              section.cards.slice(3, 5),
              section.cards.slice(5, 6),
            ];
          } else if (isHoneycomb) {
            // Alternating rows: 4, 3, 4, 3... or fit to count
            const rows = [];
            let idx = 0;
            let rowSize = 4;
            while (idx < section.cards.length) {
              rows.push(section.cards.slice(idx, idx + rowSize));
              idx += rowSize;
              rowSize = rowSize === 4 ? 3 : 4;
            }
            pyramidRows = rows;
          } else {
            pyramidRows = [section.cards];
          }

          const detailPanel = document.createElement('div');
          detailPanel.style.cssText = 'margin:10px 0;padding:0;max-height:0;overflow:hidden;transition:max-height 0.4s ease,padding 0.4s ease;border-radius:8px;';

          let activeHex = null;
          const allHexes = [];
          let globalCardIndex = 0;

          function createHexCard(card, ci, parentEl) {
            const hex = document.createElement('div');
            hex.style.cssText = `width:${size}px;height:${size * 1.15}px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:rgba(0,20,40,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.3s,filter 0.3s;position:relative;perspective:200px;`;

            const inner = document.createElement('div');
            const isLarge = isPyramid || isHoneycomb;
            inner.style.cssText = `position:absolute;inset:2px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:rgba(0,15,30,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${isLarge ? '4' : '2'}px;padding:4px;transition:transform 0.6s ease;transform-origin:left center;`;

            const iconEl = document.createElement('div');
            iconEl.textContent = card.icon || '';
            iconEl.style.cssText = `font-size:${(isLarge ? 24 : 18) * scale}px;line-height:1;`;
            inner.appendChild(iconEl);

            const titleEl = document.createElement('div');
            titleEl.textContent = card.title;
            titleEl.style.cssText = `font-size:${(isLarge ? 12 : 7) * scale}px;color:#ccc;text-align:center;line-height:1.2;font-weight:bold;padding:0 6px;`;
            inner.appendChild(titleEl);

            // Page fold corner
            const fold = document.createElement('div');
            fold.style.cssText = `position:absolute;top:0;right:0;width:16px;height:16px;background:linear-gradient(135deg,transparent 50%,${npc.hexColor}44 50%);opacity:0;transition:opacity 0.4s ease;pointer-events:none;`;
            inner.appendChild(fold);

            hex.appendChild(inner);

            hex.addEventListener('mouseenter', () => {
              hex.style.background = npc.hexColor;
              hex.style.transform = 'scale(1.12)';
              hex.style.filter = 'drop-shadow(0 0 8px ' + npc.hexColor + ')';
            });
            hex.addEventListener('mouseleave', () => {
              if (activeHex !== ci) {
                hex.style.background = 'rgba(0,20,40,0.8)';
                hex.style.transform = 'scale(1)';
                hex.style.filter = 'none';
              }
            });

            hex.addEventListener('click', (e) => {
              e.stopPropagation();
              if (activeHex === ci) {
                activeHex = null;
                hex.style.background = 'rgba(0,20,40,0.8)';
                hex.style.transform = 'scale(1)';
                hex.style.filter = 'none';
                detailPanel.style.maxHeight = '0';
                detailPanel.style.padding = '0';
                return;
              }
              activeHex = ci;
              hexGrid.querySelectorAll('[data-hex]').forEach(h => {
                h.style.background = 'rgba(0,20,40,0.8)';
                h.style.transform = 'scale(1)';
                h.style.filter = 'none';
              });
              hex.style.background = npc.hexColor;
              hex.style.transform = 'scale(1.12)';
              hex.style.filter = 'drop-shadow(0 0 12px ' + npc.hexColor + ')';

              detailPanel.textContent = '';
              detailPanel.style.cssText = 'margin:10px 0;padding:14px 16px;max-height:120px;overflow:hidden;transition:max-height 0.4s ease,padding 0.4s ease;border-radius:8px;background:rgba(0,15,30,0.8);border:1px solid ' + npc.hexColor + '66;';

              const dHead = document.createElement('div');
              dHead.style.marginBottom = '8px';
              const dIcon = document.createElement('span');
              dIcon.textContent = card.icon + ' ';
              dIcon.style.fontSize = '16px';
              dHead.appendChild(dIcon);
              const dTitle = document.createElement('span');
              dTitle.textContent = card.title;
              dTitle.style.cssText = 'font-weight:bold;font-size:13px;color:' + npc.hexColor + ';';
              dHead.appendChild(dTitle);
              detailPanel.appendChild(dHead);

              const dDesc = document.createElement('div');
              dDesc.textContent = card.desc;
              dDesc.style.cssText = 'font-size:12px;color:#bbb;line-height:1.5;';
              detailPanel.appendChild(dDesc);
            });

            hex.setAttribute('data-hex', ci);
            allHexes.push({ hex, inner, fold });
            parentEl.appendChild(hex);
          }

          // Build rows
          let rowIndex = 0;
          pyramidRows.forEach(rowCards => {
            if (isPyramid || isHoneycomb) {
              const row = document.createElement('div');
              const gap = isHoneycomb ? '4px' : '6px';
              const offset = isHoneycomb && rowIndex % 2 === 1 ? `margin-top:-${size * 0.15}px;` : isHoneycomb ? `margin-top:-${size * 0.15}px;` : '';
              const firstRow = rowIndex === 0 ? '' : offset;
              row.style.cssText = `display:flex;justify-content:center;gap:${gap};${firstRow}`;
              rowCards.forEach(card => {
                createHexCard(card, globalCardIndex, row);
                globalCardIndex++;
              });
              hexGrid.appendChild(row);
              rowIndex++;
            } else {
              rowCards.forEach(card => {
                createHexCard(card, globalCardIndex, hexGrid);
                globalCardIndex++;
              });
            }
          });

          // Random page fold animation — one hex at a time
          let foldInterval = null;
          let currentFolding = -1;

          function doRandomFold() {
            // Pick a random hex that isn't the active one
            let candidates = allHexes.map((_, i) => i).filter(i => i !== activeHex && i !== currentFolding);
            if (candidates.length === 0) return;
            const idx = candidates[Math.floor(Math.random() * candidates.length)];
            const { inner, fold } = allHexes[idx];
            currentFolding = idx;

            // Show fold corner and tilt the inner panel
            fold.style.opacity = '1';
            inner.style.transform = 'rotateY(-15deg)';

            // Fold back after a moment
            setTimeout(() => {
              inner.style.transform = 'rotateY(0deg)';
              fold.style.opacity = '0';
              currentFolding = -1;
            }, 800);
          }

          foldInterval = setInterval(doRandomFold, 2500 + Math.random() * 2000);

          // Clean up interval when modal closes (use MutationObserver)
          const observer = new MutationObserver(() => {
            if (layer.style.display === 'none' || !document.body.contains(hexGrid)) {
              clearInterval(foldInterval);
              observer.disconnect();
            }
          });
          observer.observe(layer, { attributes: true, attributeFilter: ['style'] });

          layer.appendChild(hexGrid);
          layer.appendChild(detailPanel);
        }
      });
    } else if (npc.features.length > 0) {
      const featureList = document.createElement('ul'); featureList.className = 'modal-features';
      npc.features.forEach(f => { const li = document.createElement('li'); li.textContent = f; featureList.appendChild(li); });
      layer.appendChild(featureList);
    }

    // visual box removed

    layer.style.display = 'block';
    layer.style.borderLeft = '1px solid ' + npc.hexColor;
    layer.style.boxShadow = '-5px 0 30px ' + npc.hexColor + '33';
    backdrop.style.display = 'block';
    layer.classList.remove('glitch-out'); layer.classList.add('glitch-in');
  }

  function close() {
    if (!state.modalOpen) return;
    layer.classList.remove('glitch-in'); layer.classList.add('glitch-out');
    const closedIdx = state.modalNpcIndex;
    setTimeout(() => {
      layer.style.display = 'none'; backdrop.style.display = 'none';
      layer.classList.remove('glitch-out');
      state.modalOpen = false; Object.assign(state, BLOOM_STATES.exploring);
      if (closedIdx === 5 && !state.finalCtaTriggered) { state.finalCtaTriggered = true; callbacks.onOracleFirstClose?.(); }
      state.modalNpcIndex = -1;
    }, 300);
  }

  // Click outside modal (on backdrop) to close
  backdrop.addEventListener('click', close);

  return { open, close };
}
