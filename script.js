// ============== 粒子动画 ==============
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    let particles = [];
    const PARTICLE_COUNT = 80;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        w = canvas.parentElement.clientWidth;
        h = canvas.parentElement.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
    }

    function createParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 0.6,
            color: Math.random() > 0.5 ? '99, 102, 241' : '6, 182, 212'
        };
    }

    function init() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);
        // 绘制连线
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(99, 102, 241, ' + (0.18 * (1 - dist / 130)) + ')';
                    ctx.lineWidth = 0.6;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        // 绘制粒子
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + p.color + ', 0.8)';
            ctx.fill();
        }
        requestAnimationFrame(animate);
    }

    resize();
    init();
    animate();
    window.addEventListener('resize', () => { resize(); init(); });
})();

// ============== 数字滚动动画 ==============
(function countUp() {
    const stats = document.querySelectorAll('.stat-num');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                let current = 0;
                const step = Math.ceil(target / 40);
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = current + '+';
                }, 30);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    stats.forEach(s => observer.observe(s));
})();

// ============== 滚动显效 ==============
(function revealOnScroll() {
    const items = document.querySelectorAll('.skill-card, .project-card, .edu-card, .quote-card, .demo-info, .demo-canvas-wrap');
    items.forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach(el => observer.observe(el));
})();
// ============== BFS 连连看寻路 ==============
(function bfsDemo() {
    const canvas = document.getElementById('bfsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 11;
    const ROWS = 7;
    const MAX_TURNS = 2;
    const PADDING = 30;

    let cellSize;
    function resizeCanvas() {
        const cssW = canvas.parentElement.clientWidth - 56;
        const cssH = Math.round(cssW * (ROWS / COLS));
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cellSize = (cssW - PADDING * 2) / COLS;
        draw();
    }

    // 状态: 0 空 1 起点 2 终点 3 墙
    let grid = [];
    let start = null;   // {r,c}
    let end = null;
    let mode = 'pick';
    let isRunning = false;
    let lastResult = null;

    function initGrid() {
        grid = [];
        for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
                row.push({ type: 0, visited: false, inPath: false });
            }
            grid.push(row);
        }
        start = null;
        end = null;
        lastResult = null;
        updateStats(0, 0, 0, 0);
        draw();
    }

    function setMode(newMode) {
        mode = newMode;
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    function canvasToCell(x, y) {
        const rect = canvas.getBoundingClientRect();
        const px = x - rect.left;
        const py = y - rect.top;
        const c = Math.floor((px - PADDING) / cellSize);
        const r = Math.floor((py - PADDING) / cellSize);
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
        return { r, c };
    }

    function onCanvasClick(e) {
        if (isRunning) return;
        const cell = canvasToCell(e.clientX, e.clientY);
        if (!cell) return;
        if (mode === 'pick') {
            if (!start) {
                start = { r: cell.r, c: cell.c };
                grid[cell.r][cell.c].type = 1;
            } else if (!end && !(cell.r === start.r && cell.c === start.c)) {
                end = { r: cell.r, c: cell.c };
                grid[cell.r][cell.c].type = 2;
            } else {
                // 重置起点终点
                if (start) grid[start.r][start.c].type = 0;
                if (end) grid[end.r][end.c].type = 0;
                start = { r: cell.r, c: cell.c };
                end = null;
                grid[cell.r][cell.c].type = 1;
            }
        } else if (mode === 'wall') {
            if ((start && cell.r === start.r && cell.c === start.c) ||
                (end && cell.r === end.r && cell.c === end.c)) return;
            grid[cell.r][cell.c].type = grid[cell.r][cell.c].type === 3 ? 0 : 3;
        } else if (mode === 'erase') {
            if ((start && cell.r === start.r && cell.c === start.c) ||
                (end && cell.r === end.r && cell.c === end.c)) return;
            grid[cell.r][cell.c].type = 0;
        }
        lastResult = null;
        updateStats(0, 0, 0, 0);
        draw();
    }

    function draw() {
        const cssW = parseFloat(canvas.style.width);
        const cssH = parseFloat(canvas.style.height);
        ctx.clearRect(0, 0, cssW, cssH);

        // 网格背景
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = PADDING + c * cellSize;
                const y = PADDING + r * cellSize;
                const cell = grid[r][c];
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

                if (cell.visited) {
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
                    ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
                }
                if (cell.inPath) {
                    const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    grad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
                    grad.addColorStop(1, 'rgba(99, 102, 241, 0.85)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
                }

                if (cell.type === 3) {
                    ctx.fillStyle = '#1f2740';
                    ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
                    ctx.strokeStyle = 'rgba(107, 116, 148, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 2, y + 2, cellSize - 6, cellSize - 6);
                }

                if (cell.type === 1) {
                    const grad = ctx.createRadialGradient(
                        x + cellSize / 2, y + cellSize / 2, 1,
                        x + cellSize / 2, y + cellSize / 2, cellSize / 2
                    );
                    grad.addColorStop(0, '#34d399');
                    grad.addColorStop(1, '#059669');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold ' + Math.floor(cellSize * 0.4) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('起', x + cellSize / 2, y + cellSize / 2);
                }
                if (cell.type === 2) {
                    const grad = ctx.createRadialGradient(
                        x + cellSize / 2, y + cellSize / 2, 1,
                        x + cellSize / 2, y + cellSize / 2, cellSize / 2
                    );
                    grad.addColorStop(0, '#f87171');
                    grad.addColorStop(1, '#dc2626');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold ' + Math.floor(cellSize * 0.4) + 'px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('终', x + cellSize / 2, y + cellSize / 2);
                }
            }
        }
    }

    // ============== 核心算法 ==============
    // 多维 BFS: 状态 (r, c, turns, entryDir)
    // entryDir: 0 上 1 右 2 下 3 左 (进入当前格子的方向)
    // 转折判断: 新方向 != entryDir 则 turn++
    async function runBFS() {
        if (isRunning) return;
        if (!start || !end) {
            alert('请先选择起点和终点！');
            return;
        }

        // 重置访问状态
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                grid[r][c].visited = false;
                grid[r][c].inPath = false;
            }
        }
        lastResult = null;
        updateStats(0, 0, 0, 0);

        const t0 = performance.now();
        const queue = [];
        const visited = new Map();
        // 入队起点 - 四个方向都可以，turns=0
        for (let d = 0; d < 4; d++) {
            queue.push({ r: start.r, c: start.c, turns: 0, dir: d, parent: null });
            visited.set(start.r + ',' + start.c + ',' + d, true);
        }
        grid[start.r][start.c].visited = true;

        const dirs = [
            { dr: -1, dc: 0, d: 0 },
            { dr: 0, dc: 1, d: 1 },
            { dr: 1, dc: 0, d: 2 },
            { dr: 0, dc: -1, d: 3 }
        ];

        let visitedCount = 0;
        let foundNode = null;
        const stepDelay = 18;
        let stepCounter = 0;

        while (queue.length > 0) {
            const cur = queue.shift();
            visitedCount++;

            // 到达终点
            if (cur.r === end.r && cur.c === end.c) {
                foundNode = cur;
                break;
            }

            for (const dir of dirs) {
                if (cur.dir === (dir.d + 2) % 4) continue; // 不能回头
                const nr = cur.r + dir.dr;
                const nc = cur.c + dir.dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                if (grid[nr][nc].type === 3) continue;
                // 起点终点可走
                const newTurns = (dir.d === cur.dir) ? cur.turns : cur.turns + 1;
                if (newTurns > MAX_TURNS) continue;
                const key = nr + ',' + nc + ',' + dir.d;
                if (visited.has(key)) continue;
                visited.set(key, true);
                queue.push({ r: nr, c: nc, turns: newTurns, dir: dir.d, parent: cur });
            }

            stepCounter++;
            if (stepCounter % 4 === 0) {
                grid[cur.r][cur.c].visited = true;
                updateStats(visitedCount, 0, 0, performance.now() - t0);
                draw();
                await new Promise(r => setTimeout(r, stepDelay));
            }
        }

        const elapsed = Math.round(performance.now() - t0);

        // 标记访问过
        for (const cell of visited.keys()) {
            const [r, c] = cell.split(',').map(Number);
            grid[r][c].visited = true;
        }

        if (foundNode) {
            // 回溯路径
            const path = [];
            let cur = foundNode;
            while (cur) {
                path.push(cur);
                cur = cur.parent;
            }
            for (let i = 0; i < path.length; i++) {
                grid[path[i].r][path[i].c].inPath = true;
            }
            draw();
            updateStats(visitedCount, path.length, foundNode.turns, elapsed);
            lastResult = { found: true, path: path, turns: foundNode.turns };
        } else {
            draw();
            updateStats(visitedCount, 0, 0, elapsed);
            lastResult = { found: false };
            setTimeout(() => alert('未找到路径：折弯次数超过 ' + MAX_TURNS + ' 次'), 100);
        }
    }

    function updateStats(visited, length, turns, ms) {
        document.getElementById('statVisited').textContent = visited;
        document.getElementById('statLength').textContent = length;
        document.getElementById('statTurns').textContent = turns;
        document.getElementById('statTime').textContent = ms + ' ms';
    }

    function addRandomWalls() {
        if (isRunning) return;
        const count = Math.floor(Math.random() * 12) + 6;
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if ((start && r === start.r && c === start.c) ||
                (end && r === end.r && c === end.c)) continue;
            grid[r][c].type = 3;
        }
        lastResult = null;
        updateStats(0, 0, 0, 0);
        draw();
    }

    function reset() {
        initGrid();
    }

    // 绑定事件
    canvas.addEventListener('click', onCanvasClick);
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
    document.getElementById('btnStart').addEventListener('click', () => {
        if (!isRunning) {
            isRunning = true;
            runBFS().finally(() => { isRunning = false; });
        }
    });
    document.getElementById('btnRandom').addEventListener('click', addRandomWalls);
    document.getElementById('btnReset').addEventListener('click', reset);
    window.addEventListener('resize', resizeCanvas);

    // 初始化
    initGrid();
    // 默认放置一个示例
    setTimeout(() => {
        start = { r: 1, c: 1 };
        end = { r: 5, c: 9 };
        grid[1][1].type = 1;
        grid[5][9].type = 2;
        // 一些示例障碍
        grid[2][3].type = 3;
        grid[2][4].type = 3;
        grid[3][6].type = 3;
        grid[4][3].type = 3;
        grid[4][4].type = 3;
        grid[4][5].type = 3;
        draw();
    }, 300);
})();

// ============== 兜底：确保所有 reveal 元素最终都可见 ==============
setTimeout(function() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
        el.classList.add('visible');
    });
}, 2500);


// ============== 证书灯箱 ==============
(function certLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxPdf = document.getElementById('lightboxPdf');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxClose = document.getElementById('lightboxClose');

    function openLightbox(certSrc, certType, certTitle) {
        lightboxTitle.textContent = certTitle;
        if (certType === 'pdf') {
            lightboxImg.style.display = 'none';
            lightboxPdf.style.display = 'block';
            lightboxPdf.src = certSrc;
        } else {
            lightboxPdf.style.display = 'none';
            lightboxImg.style.display = 'block';
            lightboxImg.src = certSrc;
        }
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        // 延迟清除 src，避免关闭瞬间闪烁
        setTimeout(() => {
            lightboxImg.src = '';
            lightboxPdf.src = '';
        }, 300);
    }

    // 绑定证书卡片点击
    document.querySelectorAll('.cert-card').forEach(card => {
        card.addEventListener('click', () => {
            const cert = card.dataset.cert;
            const type = card.dataset.type;
            const title = card.dataset.title;
            openLightbox(cert, type, title);
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);

    // 点击背景关闭
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === lightboxTitle) {
            closeLightbox();
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
})();
