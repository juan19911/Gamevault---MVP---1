// ===================================================
// GameVault SPA Controller (Vanilla ES6+ Reactive App)
// TUDAI - Taller de Desarrollo de Aplicaciones
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentView = 'catalog';
    let libraryStatusFilter = 'all';
    let libraryPriorityFilter = 'all';
    let catalogDebounceTimer = null;
    let libraryDebounceTimer = null;
    let statusChartInstance = null;
    let genreChartInstance = null;

    // Cache DOM Elements
    const views = {
        catalog: document.getElementById('view-catalog'),
        library: document.getElementById('view-library'),
        discovery: document.getElementById('view-discovery'),
        dashboard: document.getElementById('view-dashboard')
    };

    const navBtns = document.querySelectorAll('.nav-btn');
    const userLoggedBox = document.getElementById('user-logged-box');
    const btnOpenAuth = document.getElementById('btn-open-auth');
    const navUserName = document.getElementById('nav-user-name');
    const navUserAvatar = document.getElementById('nav-user-avatar');

    // Init App
    initAuthUI();
    initNavigation();
    initFilters();
    loadCatalog();

    // Default session date to today
    const sessionDateInput = document.getElementById('session-date');
    if (sessionDateInput) {
        sessionDateInput.value = new Date().toISOString().split('T')[0];
    }

    // ==========================================
    // 1. AUTHENTICATION & SESSION HANDLING (HU-01)
    // ==========================================
    function initAuthUI() {
        const user = API.getUser();
        if (user && API.getToken()) {
            userLoggedBox.style.display = 'flex';
            btnOpenAuth.style.display = 'none';
            navUserName.textContent = user.username;
            navUserAvatar.src = user.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150';
        } else {
            userLoggedBox.style.display = 'none';
            btnOpenAuth.style.display = 'inline-flex';
        }
    }

    // Login & Register Tab Switcher
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    tabLogin.addEventListener('click', () => {
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
        tabLogin.style.fontWeight = '700';
        tabRegister.style.fontWeight = 'normal';
    });

    tabRegister.addEventListener('click', () => {
        formLogin.style.display = 'none';
        formRegister.style.display = 'block';
        tabRegister.style.fontWeight = '700';
        tabLogin.style.fontWeight = 'normal';
    });

    btnOpenAuth.addEventListener('click', () => openModal('modal-auth'));

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await API.login(email, password);
            showToast(`¡Bienvenido de nuevo, ${res.user.username}!`);
            closeModal('modal-auth');
            initAuthUI();
            if (currentView === 'library' || currentView === 'dashboard') {
                switchView(currentView);
            } else {
                loadCatalog();
            }
        } catch (err) {
            showToast(err.message, true);
        }
    });

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const res = await API.register(username, email, password);
            showToast('¡Cuenta creada exitosamente en GameVault!');
            closeModal('modal-auth');
            initAuthUI();
            loadCatalog();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        API.logout();
    });

    // Profile Modal (HU-02)
    document.getElementById('btn-open-profile')?.addEventListener('click', async () => {
        try {
            const res = await API.getProfile();
            const user = res.user;
            document.getElementById('profile-avatar').src = user.avatar;
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-platform-badge').textContent = user.platform || 'PC';
            document.getElementById('profile-bio').textContent = user.bio || 'Sin biografía.';

            const favGrid = document.getElementById('profile-favorites-grid');
            favGrid.innerHTML = '';

            const favs = res.favorites || [];
            for (let i = 0; i < 4; i++) {
                const fav = favs[i];
                const slot = document.createElement('div');
                slot.style.border = '1px dashed var(--border-color)';
                slot.style.borderRadius = '10px';
                slot.style.height = '140px';
                slot.style.display = 'flex';
                slot.style.flexDirection = 'column';
                slot.style.alignItems = 'center';
                slot.style.justifyContent = 'center';
                slot.style.background = 'var(--bg-card)';
                slot.style.overflow = 'hidden';
                slot.style.position = 'relative';

                if (fav) {
                    slot.style.border = '1px solid var(--primary)';
                    slot.innerHTML = `
                        <img src="${fav.cover_url}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); padding: 4px; text-align: center; font-size: 0.7rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${fav.title}
                        </div>
                    `;
                } else {
                    slot.innerHTML = `
                        <span style="font-size: 1.5rem; opacity: 0.3;">⭐</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Slot ${i+1} Libre</span>
                    `;
                }
                favGrid.appendChild(slot);
            }

            openModal('modal-profile');
        } catch (err) {
            showToast('Inicia sesión para consultar tu perfil', true);
        }
    });

    // ==========================================
    // 2. VIEW NAVIGATION
    // ==========================================
    function initNavigation() {
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetView = btn.dataset.view;
                switchView(targetView);
            });
        });

        document.getElementById('brand-logo').addEventListener('click', () => {
            switchView('catalog');
        });
    }

    function switchView(viewName) {
        currentView = viewName;

        navBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.view === viewName);
        });

        Object.keys(views).forEach(k => {
            views[k].style.display = (k === viewName) ? 'block' : 'none';
        });

        if (viewName === 'catalog') loadCatalog();
        if (viewName === 'library') loadLibrary();
        if (viewName === 'discovery') loadDiscovery();
        if (viewName === 'dashboard') loadDashboard();
    }

    // ==========================================
    // 3. CATALOG VIEW (HU-03)
    // ==========================================
    async function initFilters() {
        try {
            const res = await API.getFilters();
            const genreSelect = document.getElementById('filter-genre');
            const platformSelect = document.getElementById('filter-platform');

            res.genres.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = g;
                genreSelect.appendChild(opt);
            });

            res.platforms.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                platformSelect.appendChild(opt);
            });

            genreSelect.addEventListener('change', () => loadCatalog());
            platformSelect.addEventListener('change', () => loadCatalog());

            // Search input with 300ms debounce (RNF-02)
            document.getElementById('input-search').addEventListener('input', (e) => {
                clearTimeout(catalogDebounceTimer);
                catalogDebounceTimer = setTimeout(() => {
                    loadCatalog();
                }, 300);
            });
        } catch (err) {
            console.error('Error cargando filtros:', err);
        }
    }

    async function loadCatalog() {
        const search = document.getElementById('input-search').value;
        const genre = document.getElementById('filter-genre').value;
        const platform = document.getElementById('filter-platform').value;

        const grid = document.getElementById('grid-games');
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Cargando catálogo...</div>';

        try {
            // Also fetch user's library if logged in to show badges
            let userGameMap = {};
            if (API.getToken()) {
                try {
                    const libRes = await API.getLibrary();
                    (libRes.data || []).forEach(item => {
                        userGameMap[item.game_id] = item;
                    });
                } catch {}
            }

            const res = await API.getGames({ search, genre, platform });
            grid.innerHTML = '';

            if (res.data.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🔍</span>
                        No se encontraron videojuegos que coincidan con la búsqueda.
                    </div>
                `;
                return;
            }

            res.data.forEach(game => {
                const libEntry = userGameMap[game.id];
                const card = document.createElement('div');
                card.className = 'game-card';

                let badgeHtml = '';
                if (libEntry) {
                    const statusText = {
                        pending: 'Pendiente',
                        playing: 'Jugando',
                        completed: 'Completado',
                        dropped: 'Abandonado'
                    }[libEntry.status] || libEntry.status;

                    badgeHtml = `<span class="status-badge badge-${libEntry.status}">${statusText}</span>`;
                }

                card.innerHTML = `
                    <div class="card-img-wrap">
                        <img src="${game.cover_url}" alt="${game.title}" class="card-img" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'">
                        ${badgeHtml}
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${game.title}</h3>
                        <div class="card-meta">
                            <span>🎮 ${game.genre}</span>
                            <span>📅 ${game.release_year || 'N/A'}</span>
                            <span>💻 ${game.platform}</span>
                        </div>
                        <p class="card-synopsis">${game.synopsis || 'Sin descripción disponible.'}</p>
                        <div class="card-footer">
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${game.developer || ''}</span>
                            <button class="btn btn-primary btn-sm btn-action-game" data-id="${game.id}">
                                ${libEntry ? '✏️ Modificar' : '➕ Añadir'}
                            </button>
                        </div>
                    </div>
                `;

                card.querySelector('.btn-action-game').addEventListener('click', () => {
                    if (!API.getToken()) {
                        showToast('Debes iniciar sesión para gestionar tu colección', true);
                        openModal('modal-auth');
                        return;
                    }
                    openGameFormModal(game, libEntry);
                });

                grid.appendChild(card);
            });
        } catch (err) {
            grid.innerHTML = `<div style="grid-column: 1/-1; color: #ef4444; text-align: center;">Error al cargar el catálogo: ${err.message}</div>`;
        }
    }

    // ==========================================
    // 4. LIBRARY VIEW & CRUD (HU-04)
    // ==========================================
    document.getElementById('tabs-status').addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            document.querySelectorAll('#tabs-status .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            libraryStatusFilter = e.target.dataset.status;
            loadLibrary();
        }
    });

    document.getElementById('filter-library-priority').addEventListener('change', (e) => {
        libraryPriorityFilter = e.target.value;
        loadLibrary();
    });

    document.getElementById('library-search').addEventListener('input', () => {
        clearTimeout(libraryDebounceTimer);
        libraryDebounceTimer = setTimeout(() => {
            loadLibrary();
        }, 300);
    });

    async function loadLibrary() {
        if (!API.getToken()) {
            views.library.innerHTML = `
                <div style="text-align: center; padding: 5rem 1rem;">
                    <h2>🔒 Acceso Restringido</h2>
                    <p style="color: var(--text-muted); margin: 1rem 0 1.5rem 0;">Inicia sesión para ver y organizar tu biblioteca de videojuegos.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('btn-open-auth').click()">Iniciar Sesión</button>
                </div>
            `;
            return;
        }

        const search = document.getElementById('library-search')?.value || '';
        const grid = document.getElementById('grid-library');
        if (!grid) return;

        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Cargando tu colección...</div>';

        try {
            const res = await API.getLibrary({
                status: libraryStatusFilter,
                priority: libraryPriorityFilter,
                search
            });

            grid.innerHTML = '';

            if (res.data.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🎮</span>
                        No hay videojuegos en esta categoría. ¡Explora el catálogo y agrega uno!
                    </div>
                `;
                return;
            }

            res.data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'game-card';

                const statusLabels = {
                    pending: 'Pendiente',
                    playing: 'Jugando',
                    completed: 'Completado',
                    dropped: 'Abandonado'
                };

                const priorityBadges = {
                    high: '<span style="color: #ef4444; font-weight: bold;">🔥 Alta</span>',
                    medium: '<span style="color: #f59e0b;">⚖️ Media</span>',
                    low: '<span style="color: #9ca3af;">💤 Baja</span>'
                };

                // Stars display
                let starsHtml = '';
                if (item.rating) {
                    for (let s = 1; s <= 5; s++) {
                        starsHtml += `<span style="color: ${s <= item.rating ? 'var(--star-gold)' : '#4b5563'}">★</span>`;
                    }
                } else {
                    starsHtml = '<span style="color: var(--text-muted); font-size: 0.8rem;">Sin calificar</span>';
                }

                card.innerHTML = `
                    <div class="card-img-wrap">
                        <img src="${item.cover_url}" alt="${item.title}" class="card-img">
                        <span class="status-badge badge-${item.status}">${statusLabels[item.status] || item.status}</span>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h3 class="card-title">${item.title}</h3>
                            ${item.is_favorite ? '<span title="Favorito en tu perfil" style="font-size: 1.1rem;">⭐</span>' : ''}
                        </div>
                        <div class="card-meta">
                            <span>⏱️ ${item.hours_played} hs</span>
                            <span>${priorityBadges[item.priority] || item.priority}</span>
                            <span>${item.genre}</span>
                        </div>
                        <div style="margin-bottom: 0.8rem;">
                            ${starsHtml}
                        </div>
                        ${item.review ? `<p class="card-synopsis" style="font-style: italic; color: #94a3b8;">"${item.review}"</p>` : ''}
                        
                        <div class="card-footer" style="gap: 0.4rem; flex-wrap: wrap;">
                            <button class="btn btn-secondary btn-sm btn-session" title="Registrar horas de juego">
                                ⏱️ Bitácora
                            </button>
                            <button class="btn btn-secondary btn-sm btn-edit-entry" title="Modificar estado o reseña">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger btn-sm btn-delete-entry" title="Quitar de la biblioteca">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;

                // Event handlers
                card.querySelector('.btn-session').addEventListener('click', () => {
                    openSessionModal(item);
                });

                card.querySelector('.btn-edit-entry').addEventListener('click', () => {
                    openGameFormModal(
                        { id: item.game_id, title: item.title, cover_url: item.cover_url },
                        item
                    );
                });

                card.querySelector('.btn-delete-entry').addEventListener('click', async () => {
                    if (confirm(`¿Estás seguro de quitar "${item.title}" de tu biblioteca personal?`)) {
                        try {
                            await API.deleteLibraryEntry(item.library_id);
                            showToast(`"${item.title}" fue quitado de tu colección`);
                            loadLibrary();
                        } catch (err) {
                            showToast(err.message, true);
                        }
                    }
                });

                grid.appendChild(card);
            });
        } catch (err) {
            grid.innerHTML = `<div style="grid-column: 1/-1; color: #ef4444; text-align: center;">Error al cargar biblioteca: ${err.message}</div>`;
        }
    }

    // ==========================================
    // 5. GAME FORM MODAL (ADD / EDIT)
    // ==========================================
    let currentRatingValue = null;

    function openGameFormModal(game, libEntry = null) {
        document.getElementById('modal-game-title').textContent = libEntry
            ? `Editar "${game.title}"`
            : `Agregar "${game.title}"`;

        document.getElementById('form-game-id').value = game.id;
        document.getElementById('form-library-id').value = libEntry ? libEntry.library_id : '';
        document.getElementById('user-status').value = libEntry ? libEntry.status : 'pending';
        document.getElementById('user-priority').value = libEntry ? libEntry.priority : 'medium';
        document.getElementById('user-hours').value = libEntry ? libEntry.hours_played : 0;
        document.getElementById('user-review').value = (libEntry && libEntry.review) ? libEntry.review : '';
        document.getElementById('user-is-favorite').checked = libEntry ? (libEntry.is_favorite === 1) : false;

        currentRatingValue = libEntry ? libEntry.rating : null;
        updateStarRatingDisplay(currentRatingValue);

        openModal('modal-game-form');
    }

    // Star rating interactions
    const stars = document.querySelectorAll('#user-rating-stars .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.val);
            currentRatingValue = (currentRatingValue === val) ? null : val;
            updateStarRatingDisplay(currentRatingValue);
        });
    });

    function updateStarRatingDisplay(rating) {
        document.getElementById('user-rating').value = rating || '';
        stars.forEach(s => {
            const val = parseInt(s.dataset.val);
            s.classList.toggle('active', rating !== null && val <= rating);
        });
    }

    document.getElementById('form-user-game').addEventListener('submit', async (e) => {
        e.preventDefault();
        const gameId = document.getElementById('form-game-id').value;
        const libraryId = document.getElementById('form-library-id').value;

        const payload = {
            game_id: parseInt(gameId),
            status: document.getElementById('user-status').value,
            priority: document.getElementById('user-priority').value,
            hours_played: parseFloat(document.getElementById('user-hours').value) || 0,
            rating: currentRatingValue,
            review: document.getElementById('user-review').value.trim() || null,
            is_favorite: document.getElementById('user-is-favorite').checked ? 1 : 0
        };

        try {
            if (libraryId) {
                await API.updateLibraryEntry(libraryId, payload);
                showToast('Información de juego actualizada exitosamente');
            } else {
                await API.addToLibrary(payload);
                showToast('¡Juego añadido a tu biblioteca!');
            }
            closeModal('modal-game-form');
            if (currentView === 'library') loadLibrary();
            if (currentView === 'catalog') loadCatalog();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // ==========================================
    // 6. SESSION LOG MODAL (HU-05)
    // ==========================================
    async function openSessionModal(item) {
        document.getElementById('session-library-id').value = item.library_id;
        document.getElementById('session-game-name').textContent = item.title;
        document.getElementById('session-hours').value = 2.0;
        document.getElementById('session-notes').value = '';

        // Load past session history
        const historyContainer = document.getElementById('session-history-list');
        historyContainer.innerHTML = 'Cargando historial...';

        try {
            const res = await API.getSessionsByLibraryId(item.library_id);
            historyContainer.innerHTML = '';
            if (!res.data || res.data.length === 0) {
                historyContainer.innerHTML = '<em>Aún no has registrado partidas previas para este título.</em>';
            } else {
                res.data.forEach(s => {
                    const row = document.createElement('div');
                    row.style.padding = '0.4rem 0';
                    row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                    row.innerHTML = `
                        <strong>📅 ${s.session_date}</strong>: +${s.hours} hs
                        ${s.notes ? ` — <em>${s.notes}</em>` : ''}
                    `;
                    historyContainer.appendChild(row);
                });
            }
        } catch (err) {
            historyContainer.innerHTML = 'No se pudo cargar el historial.';
        }

        openModal('modal-session');
    }

    document.getElementById('form-session').addEventListener('submit', async (e) => {
        e.preventDefault();
        const libraryId = document.getElementById('session-library-id').value;
        const hours = parseFloat(document.getElementById('session-hours').value);
        const sessionDate = document.getElementById('session-date').value;
        const notes = document.getElementById('session-notes').value.trim();

        try {
            const res = await API.createSession({
                user_library_id: parseInt(libraryId),
                hours,
                session_date: sessionDate,
                notes
            });

            showToast(`¡Sesión guardada! Total acumulado: ${res.data.new_total_hours} hs`);
            closeModal('modal-session');
            if (currentView === 'library') loadLibrary();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // ==========================================
    // 7. DISCOVERY VIEW & RULETA (HU-07)
    // ==========================================
    async function loadDiscovery() {
        if (!API.getToken()) {
            views.discovery.innerHTML = `
                <div style="text-align: center; padding: 5rem 1rem;">
                    <h2>🔒 Asistente de Indecisión</h2>
                    <p style="color: var(--text-muted); margin: 1rem 0 1.5rem 0;">Inicia sesión para recibir sugerencias inteligentes y girar la Ruleta Gamer.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('btn-open-auth').click()">Iniciar Sesión</button>
                </div>
            `;
            return;
        }

        try {
            const res = await API.getRecommendations();
            const recs = res.data;

            // Genre recommendations
            document.getElementById('recom-genre-name').textContent = recs.dominant_genre || 'Acción';
            const genreGrid = document.getElementById('grid-recom-genre');
            genreGrid.innerHTML = '';

            if (!recs.genre_recommendations || recs.genre_recommendations.length === 0) {
                genreGrid.innerHTML = '<div style="color: var(--text-muted); padding: 1rem;">¡Ya tienes todos los títulos de tu género favorito catalogados!</div>';
            } else {
                recs.genre_recommendations.forEach(g => {
                    genreGrid.appendChild(createSimpleCard(g));
                });
            }

            // Community favorites
            const commGrid = document.getElementById('grid-recom-community');
            commGrid.innerHTML = '';
            if (recs.community_favorites) {
                recs.community_favorites.forEach(g => {
                    commGrid.appendChild(createSimpleCard(g, g.avg_rating ? `⭐ ${g.avg_rating}` : null));
                });
            }
        } catch (err) {
            console.error('Error cargando recomendaciones:', err);
        }
    }

    function createSimpleCard(game, extraBadge = null) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${game.cover_url}" alt="${game.title}" class="card-img">
                ${extraBadge ? `<span class="status-badge" style="background: var(--star-gold); color: #000;">${extraBadge}</span>` : ''}
            </div>
            <div class="card-body">
                <h3 class="card-title">${game.title}</h3>
                <div class="card-meta">
                    <span>🎮 ${game.genre}</span>
                    <span>💻 ${game.platform}</span>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm btn-quick-add" style="width: 100%;">
                        ➕ Añadir a mi Biblioteca
                    </button>
                </div>
            </div>
        `;
        card.querySelector('.btn-quick-add').addEventListener('click', () => {
            openGameFormModal(game);
        });
        return card;
    }

    // Spin Ruleta Gamer
    document.getElementById('btn-spin-ruleta').addEventListener('click', async () => {
        const btn = document.getElementById('btn-spin-ruleta');
        const resultBox = document.getElementById('ruleta-result-box');
        const onlyHigh = document.getElementById('check-ruleta-priority').checked;

        btn.disabled = true;
        btn.innerHTML = '<span>🔄</span> Girando la ruleta de pendientes...';
        resultBox.style.display = 'none';

        try {
            const res = await API.getRandomGame(onlyHigh);
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '<span>✨</span> Girar Ruleta Gamer';

                if (!res.data) {
                    resultBox.style.display = 'block';
                    resultBox.innerHTML = `
                        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); color: var(--text-muted);">
                            ${res.message}
                        </div>
                    `;
                    return;
                }

                const game = res.data;
                resultBox.style.display = 'block';
                resultBox.innerHTML = `
                    <div style="background: var(--bg-card); border: 2px solid var(--primary); border-radius: 14px; padding: 1.5rem; max-width: 450px; text-align: left; box-shadow: 0 0 25px var(--primary-glow);">
                        <div style="color: var(--primary); font-weight: 800; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem;">
                            🎯 Tu próximo juego elegido es:
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <img src="${game.cover_url}" style="width: 80px; height: 110px; object-fit: cover; border-radius: 8px;">
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.3rem;">${game.title}</h3>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${game.genre} · ${game.platform}</p>
                                <span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                                    Prioridad: ${game.priority}
                                </span>
                            </div>
                        </div>
                        <div style="margin-top: 1.25rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary btn-sm" id="btn-play-chosen" style="flex: 1;">
                                ▶️ Empezar a Jugar Ahora
                            </button>
                        </div>
                    </div>
                `;

                document.getElementById('btn-play-chosen').addEventListener('click', async () => {
                    try {
                        await API.updateLibraryEntry(game.library_id, { status: 'playing' });
                        showToast(`¡"${game.title}" ahora está en estado Jugando!`);
                        switchView('library');
                    } catch (err) {
                        showToast(err.message, true);
                    }
                });
            }, 800);
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = '<span>✨</span> Girar Ruleta Gamer';
            showToast(err.message, true);
        }
    });

    // ==========================================
    // 8. DASHBOARD VIEW (HU-06)
    // ==========================================
    async function loadDashboard() {
        if (!API.getToken()) {
            views.dashboard.innerHTML = `
                <div style="text-align: center; padding: 5rem 1rem;">
                    <h2>🔒 Métricas y Analíticas</h2>
                    <p style="color: var(--text-muted); margin: 1rem 0 1.5rem 0;">Inicia sesión para visualizar tu dashboard estadístico interactivo.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('btn-open-auth').click()">Iniciar Sesión</button>
                </div>
            `;
            return;
        }

        try {
            const res = await API.getDashboard();
            const stats = res.data;

            // KPIs
            document.getElementById('kpi-total-games').textContent = stats.summary.total_games;
            document.getElementById('kpi-completed-pct').textContent = `${stats.summary.completed_pct}%`;
            document.getElementById('kpi-total-hours').textContent = `${stats.summary.total_hours}h`;
            document.getElementById('kpi-dominant-genre').textContent = stats.summary.dominant_genre;

            // Chart 1: Status Doughnut Chart
            const ctxStatus = document.getElementById('chart-status-backlog');
            if (statusChartInstance) statusChartInstance.destroy();
            statusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: stats.charts.by_status.labels,
                    datasets: [{
                        data: stats.charts.by_status.data,
                        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#1a2232'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#f3f4f6' } }
                    }
                }
            });

            // Chart 2: Genres Bar Chart
            const ctxGenre = document.getElementById('chart-genre-distribution');
            if (genreChartInstance) genreChartInstance.destroy();
            genreChartInstance = new Chart(ctxGenre, {
                type: 'bar',
                data: {
                    labels: stats.charts.by_genre.labels,
                    datasets: [{
                        label: 'Cantidad de Videojuegos',
                        data: stats.charts.by_genre.data,
                        backgroundColor: '#00dfa2',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: '#2b384e' } },
                        x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            // Top Games List
            const topList = document.getElementById('top-games-list');
            topList.innerHTML = '';
            if (stats.top_games.length === 0) {
                topList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">No hay registros de horas jugadas aún.</div>';
            } else {
                stats.top_games.forEach((g, idx) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.justifyContent = 'space-between';
                    row.style.padding = '0.75rem 1rem';
                    row.style.background = 'rgba(255,255,255,0.03)';
                    row.style.borderRadius = '8px';
                    row.style.border = '1px solid var(--border-color)';

                    row.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-weight: 800; font-size: 1.1rem; color: var(--primary); width: 25px;">#${idx+1}</span>
                            <img src="${g.cover_url}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;">
                            <div>
                                <strong style="display: block; font-size: 0.95rem;">${g.title}</strong>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">${g.genre}</span>
                            </div>
                        </div>
                        <div style="font-size: 1rem; font-weight: 800; color: #fff;">
                            ${g.hours_played} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">horas</span>
                        </div>
                    `;
                    topList.appendChild(row);
                });
            }
        } catch (err) {
            console.error('Error cargando estadísticas:', err);
        }
    }

    // ==========================================
    // 9. MODALS & UTILITY FUNCTIONS
    // ==========================================
    function openModal(modalId) {
        document.getElementById(modalId)?.classList.add('open');
    }

    function closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('open');
    }

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.close;
            closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('open');
            }
        });
    });

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${isError ? 'error' : ''} show`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3500);
    }
});

