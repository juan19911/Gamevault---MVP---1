// ===================================================
// GameVault SPA Controller (Vanilla ES6+ Reactive App)
// TUDAI - Taller de Desarrollo de Aplicaciones
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // UNIFIED VECTOR ICONS & LIGHTBOX (SOBER & PROFESSIONAL)
    // ==========================================
    const ICONS = {
        zoom: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
        reviews: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        list: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        starSolid: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        starOutline: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        play: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
    };

    function openLightboxModal(game) {
        const modal = document.getElementById('modal-cover-preview');
        if (!modal) return;
        document.getElementById('lightbox-img').src = game.cover_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';
        document.getElementById('lightbox-title').textContent = game.title || 'Detalle del Juego';
        document.getElementById('lightbox-genre').textContent = game.genre || 'Género N/A';
        document.getElementById('lightbox-platform').textContent = game.platform || 'Multiplataforma';
        document.getElementById('lightbox-year').textContent = game.release_year ? `Lanzamiento: ${game.release_year}` : '';
        document.getElementById('lightbox-dev').textContent = game.developer ? `Desarrollador: ${game.developer}` : '';
        document.getElementById('lightbox-synopsis').textContent = game.synopsis || game.review || 'Sin sinopsis disponible.';
        openModal('modal-cover-preview');
    }

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
        lists: document.getElementById('view-lists'),
        discovery: document.getElementById('view-discovery'),
        dashboard: document.getElementById('view-dashboard'),
        admin: document.getElementById('view-admin')
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
    initListsUI();
    initFaqBot();
    initAdminUI();
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
        const navAdmin = document.getElementById('nav-admin');
        const bannerBanned = document.getElementById('banner-banned');

        if (user && API.getToken()) {
            userLoggedBox.style.display = 'flex';
            btnOpenAuth.style.display = 'none';
            navUserName.textContent = user.username;
            navUserAvatar.src = user.avatar || '/assets/avatars/pixel-knight.svg';

            if (user.role === 'admin' && navAdmin) {
                navAdmin.style.display = 'inline-flex';
            } else if (navAdmin) {
                navAdmin.style.display = 'none';
            }

            // Cartel en rojo si el usuario ha sido baneado
            if (user.status === 'banned') {
                if (bannerBanned) bannerBanned.style.display = 'flex';
            } else {
                if (bannerBanned) bannerBanned.style.display = 'none';
            }
        } else {
            userLoggedBox.style.display = 'none';
            btnOpenAuth.style.display = 'inline-flex';
            if (navAdmin) navAdmin.style.display = 'none';
            if (bannerBanned) bannerBanned.style.display = 'none';
        }
    }

    // Login & Register Tab Switcher
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    function setAuthTab(tab) {
        if (tab === 'login') {
            formLogin.style.display = 'block';
            formRegister.style.display = 'none';
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
        } else {
            formLogin.style.display = 'none';
            formRegister.style.display = 'block';
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
        }
    }

    tabLogin.addEventListener('click', () => setAuthTab('login'));
    tabRegister.addEventListener('click', () => setAuthTab('register'));

    btnOpenAuth.addEventListener('click', () => {
        setAuthTab('login');
        openModal('modal-auth');
    });

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

    // Profile Modal & Profile Edition (HU-02)
    let currentProfileUser = null;

    document.getElementById('btn-open-profile')?.addEventListener('click', async () => {
        try {
            const res = await API.getProfile();
            currentProfileUser = res.user;
            const user = res.user;

            // Reset views to summary
            const summaryView = document.getElementById('profile-view-summary');
            const editView = document.getElementById('profile-view-edit');
            if (summaryView) summaryView.style.display = 'block';
            if (editView) editView.style.display = 'none';

            document.getElementById('profile-avatar').src = user.avatar || '/assets/avatars/pixel-knight.svg';
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

    // Selector de Avatares Rápidos Pixel Art
    function selectPixelAvatar(avatarUrl, avatarName) {
        const input = document.getElementById('edit-profile-avatar');
        const preview = document.getElementById('edit-avatar-preview');
        const titleEl = document.getElementById('edit-avatar-title');

        if (input) input.value = avatarUrl;
        if (preview) preview.src = avatarUrl;
        if (titleEl && avatarName) titleEl.textContent = avatarName;

        // Resaltar visualmente el botón seleccionado
        document.querySelectorAll('.btn-avatar-preset').forEach(b => {
            if (b.dataset.avatar === avatarUrl) {
                b.style.borderColor = 'var(--primary)';
                b.style.background = 'rgba(34, 197, 94, 0.15)';
                b.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.3)';
            } else {
                b.style.borderColor = 'var(--border-color)';
                b.style.background = 'var(--bg-card)';
                b.style.boxShadow = 'none';
            }
        });
    }

    document.querySelectorAll('.btn-avatar-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            selectPixelAvatar(btn.dataset.avatar, btn.dataset.name);
        });
    });

    // Cambiar a vista de edición de perfil
    document.getElementById('btn-open-edit-profile')?.addEventListener('click', () => {
        if (!currentProfileUser) return;
        const summaryView = document.getElementById('profile-view-summary');
        const editView = document.getElementById('profile-view-edit');
        if (summaryView) summaryView.style.display = 'none';
        if (editView) editView.style.display = 'block';

        const currentAvatar = currentProfileUser.avatar || '/assets/avatars/pixel-knight.svg';
        const matchingBtn = Array.from(document.querySelectorAll('.btn-avatar-preset')).find(b => b.dataset.avatar === currentAvatar);
        const avatarName = matchingBtn ? matchingBtn.dataset.name : 'Avatar Personalizado';
        selectPixelAvatar(currentAvatar, avatarName);

        const emailInput = document.getElementById('edit-profile-email');
        const platformSelect = document.getElementById('edit-profile-platform');
        const bioTextarea = document.getElementById('edit-profile-bio');
        const currentPassInput = document.getElementById('edit-profile-current-pass');
        const newPassInput = document.getElementById('edit-profile-new-pass');
        const confirmPassInput = document.getElementById('edit-profile-confirm-pass');

        if (emailInput) emailInput.value = currentProfileUser.email || '';
        if (platformSelect) platformSelect.value = currentProfileUser.platform || 'PC';
        if (bioTextarea) bioTextarea.value = currentProfileUser.bio || '';

        if (currentPassInput) currentPassInput.value = '';
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';
    });

    // Cancelar edición y regresar a resumen
    const switchBackToProfileSummary = () => {
        const summaryView = document.getElementById('profile-view-summary');
        const editView = document.getElementById('profile-view-edit');
        if (editView) editView.style.display = 'none';
        if (summaryView) summaryView.style.display = 'block';
    };

    document.getElementById('btn-cancel-edit-profile')?.addEventListener('click', switchBackToProfileSummary);
    document.getElementById('btn-cancel-edit-profile-2')?.addEventListener('click', switchBackToProfileSummary);

    // Guardar cambios del perfil (HU-02)
    document.getElementById('form-edit-profile')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const avatar = document.getElementById('edit-profile-avatar')?.value.trim();
        const platform = document.getElementById('edit-profile-platform')?.value;
        const bio = document.getElementById('edit-profile-bio')?.value.trim();
        const current_password = document.getElementById('edit-profile-current-pass')?.value;
        const new_password = document.getElementById('edit-profile-new-pass')?.value;
        const confirm_password = document.getElementById('edit-profile-confirm-pass')?.value;

        // Validaciones de contraseñas
        if (new_password || confirm_password) {
            if (!current_password) {
                showToast('Debes ingresar tu contraseña actual para autorizar el cambio', true);
                return;
            }
            if (new_password.length < 6) {
                showToast('La nueva contraseña debe tener al menos 6 caracteres', true);
                return;
            }
            if (new_password !== confirm_password) {
                showToast('Las nuevas contraseñas no coinciden', true);
                return;
            }
        } else if (current_password) {
            showToast('Ingresa una nueva contraseña para actualizarla', true);
            return;
        }

        try {
            const payload = { avatar, platform, bio };
            if (new_password) {
                payload.current_password = current_password;
                payload.new_password = new_password;
            }

            const res = await API.updateProfile(payload);
            
            // Actualizar datos de usuario en memoria y almacenamiento local
            currentProfileUser = res.user;
            API.setUser(res.user);
            initAuthUI();

            // Actualizar campos de la vista resumen
            document.getElementById('profile-avatar').src = res.user.avatar || '/assets/avatars/pixel-knight.svg';
            document.getElementById('profile-username').textContent = res.user.username;
            document.getElementById('profile-email').textContent = res.user.email;
            document.getElementById('profile-platform-badge').textContent = res.user.platform || 'PC';
            document.getElementById('profile-bio').textContent = res.user.bio || 'Sin biografía.';

            switchBackToProfileSummary();
            showToast(res.message || 'Perfil y datos personales actualizados exitosamente');
        } catch (err) {
            showToast(err.message || 'Error al actualizar el perfil', true);
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
        if (viewName === 'lists') loadCustomLists();
        if (viewName === 'discovery') loadDiscovery();
        if (viewName === 'dashboard') loadDashboard();
        if (viewName === 'admin') loadAdminDashboard();
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
                        <button class="card-zoom-btn btn-zoom-preview" title="Ampliar portada" aria-label="Ampliar portada">
                            ${ICONS.zoom}
                        </button>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${game.title}</h3>
                        <div class="card-meta">
                            <span>${game.genre}</span>
                            <span>${game.release_year || 'N/A'}</span>
                            <span>${game.platform}</span>
                        </div>
                        <p class="card-synopsis">${game.synopsis || 'Sin descripción disponible.'}</p>
                        <div class="card-footer" style="gap: 0.4rem; flex-wrap: wrap;">
                            <button class="btn btn-secondary btn-sm btn-view-reviews" title="Ver opiniones de la comunidad">
                                ${ICONS.reviews} <span>Reseñas</span>
                            </button>
                            <button class="btn btn-secondary btn-sm btn-add-list" title="Añadir a lista temática">
                                ${ICONS.list} <span>Lista</span>
                            </button>
                            <button class="btn btn-primary btn-sm btn-action-game" data-id="${game.id}">
                                ${libEntry ? ICONS.edit + ' <span>Modificar</span>' : ICONS.plus + ' <span>Añadir</span>'}
                            </button>
                        </div>
                    </div>
                `;

                card.querySelector('.btn-zoom-preview').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightboxModal(game);
                });

                card.querySelector('.btn-view-reviews').addEventListener('click', () => {
                    openReviewsModal(game);
                });

                card.querySelector('.btn-add-list').addEventListener('click', () => {
                    if (!API.getToken()) {
                        showToast('Inicia sesión para añadir a tus listas temáticas', true);
                        openModal('modal-auth');
                        return;
                    }
                    openAddToListModal(game);
                });

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
                    high: '<span style="color: #ef4444; font-weight: 600;">Alta</span>',
                    medium: '<span style="color: #f59e0b; font-weight: 600;">Media</span>',
                    low: '<span style="color: #94a3b8; font-weight: 500;">Baja</span>'
                };

                // Stars display
                let starsHtml = '';
                if (item.rating) {
                    for (let s = 1; s <= 5; s++) {
                        starsHtml += `<span style="color: ${s <= item.rating ? 'var(--star-gold)' : '#334155'}">★</span>`;
                    }
                } else {
                    starsHtml = '<span style="color: var(--text-muted); font-size: 0.8rem;">Sin calificar</span>';
                }

                card.innerHTML = `
                    <div class="card-img-wrap">
                        <img src="${item.cover_url}" alt="${item.title}" class="card-img">
                        <span class="status-badge badge-${item.status}">${statusLabels[item.status] || item.status}</span>
                        <button class="card-zoom-btn btn-zoom-preview" title="Ampliar portada" aria-label="Ampliar portada">
                            ${ICONS.zoom}
                        </button>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                            <h3 class="card-title">${item.title}</h3>
                            ${item.is_favorite ? `<span title="Destacado en perfil" style="display: inline-flex; align-items: center;">${ICONS.starSolid}</span>` : ''}
                        </div>
                        <div class="card-meta">
                            <span>${item.hours_played} hs</span>
                            <span>${priorityBadges[item.priority] || item.priority}</span>
                            <span>${item.genre}</span>
                        </div>
                        <div style="margin-bottom: 0.8rem;">
                            ${starsHtml}
                        </div>
                        ${item.review ? `<p class="card-synopsis" style="font-style: italic; color: #94a3b8;">"${item.review}"</p>` : ''}
                        
                        <div class="card-footer" style="gap: 0.4rem; flex-wrap: wrap;">
                            <button class="btn ${item.is_favorite ? 'btn-primary' : 'btn-secondary'} btn-sm btn-fav-toggle" title="${item.is_favorite ? 'Quitar de destacados' : 'Fijar en perfil (máx 4)'}">
                                ${item.is_favorite ? ICONS.starSolid : ICONS.starOutline} <span>${item.is_favorite ? 'Favorito' : 'Fijar'}</span>
                            </button>
                            <button class="btn btn-secondary btn-sm btn-session" title="Registrar horas de juego">
                                ${ICONS.clock} <span>Bitácora</span>
                            </button>
                            <button class="btn btn-secondary btn-sm btn-edit-entry" title="Modificar estado o reseña">
                                ${ICONS.edit} <span>Editar</span>
                            </button>
                            <button class="btn btn-danger btn-sm btn-delete-entry" title="Quitar de la biblioteca">
                                ${ICONS.trash}
                            </button>
                        </div>
                    </div>
                `;

                card.querySelector('.btn-zoom-preview').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightboxModal(item);
                });

                // Event handlers
                card.querySelector('.btn-fav-toggle').addEventListener('click', async () => {
                    try {
                        const newFav = item.is_favorite ? 0 : 1;
                        await API.updateLibraryEntry(item.library_id, { is_favorite: newFav });
                        showToast(newFav ? `"${item.title}" fijado en tus favoritos (perfil)` : `"${item.title}" quitado de favoritos`);
                        loadLibrary();
                        loadProfile();
                    } catch (err) {
                        showToast(err.message, true);
                    }
                });

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
                ${extraBadge ? `<span class="status-badge" style="background: rgba(251, 191, 36, 0.9); color: #090d16;">${extraBadge}</span>` : ''}
                <button class="card-zoom-btn btn-zoom-preview" title="Ampliar portada" aria-label="Ampliar portada">
                    ${ICONS.zoom}
                </button>
            </div>
            <div class="card-body">
                <h3 class="card-title">${game.title}</h3>
                <div class="card-meta">
                    <span>${game.genre}</span>
                    <span>${game.platform}</span>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm btn-quick-add" style="width: 100%; gap: 0.4rem;">
                        ${ICONS.plus} <span>Añadir a mi Biblioteca</span>
                    </button>
                </div>
            </div>
        `;
        card.querySelector('.btn-zoom-preview').addEventListener('click', (e) => {
            e.stopPropagation();
            openLightboxModal(game);
        });
        card.querySelector('.btn-quick-add').addEventListener('click', () => {
            openGameFormModal(game);
        });
        return card;
    }

    // Spin Ruleta Gamer (HU-07 con animacion y barajado)
    document.getElementById('btn-spin-ruleta').addEventListener('click', async () => {
        const btn = document.getElementById('btn-spin-ruleta');
        const resultBox = document.getElementById('ruleta-result-box');
        const onlyHigh = document.getElementById('check-ruleta-priority').checked;

        btn.disabled = true;
        btn.innerHTML = `<svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Barajando biblioteca de pendientes...</span>`;

        resultBox.style.display = 'block';
        resultBox.innerHTML = `
            <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px dashed var(--border-color); color: var(--text-muted); text-align: center;">
                <div style="font-size: 1.05rem; color: var(--primary); font-weight: 700; margin-bottom: 0.35rem;">Sorteando título...</div>
                <div style="font-size: 0.85rem;">Consultando backlog y ponderando prioridades de juego</div>
            </div>
        `;

        try {
            const res = await API.getRandomGame(onlyHigh);
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg> <span>Seleccionar Juego Aleatorio</span>`;

                if (!res.data) {
                    resultBox.innerHTML = `
                        <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); color: var(--text-muted); text-align: center;">
                            ${res.message}
                        </div>
                    `;
                    return;
                }

                const game = res.data;
                const priorityBadge = game.priority === 'high'
                    ? '<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">Prioridad Alta</span>'
                    : '<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">Prioridad Media</span>';

                resultBox.innerHTML = `
                    <div style="background: var(--bg-card); border: 1px solid var(--primary); border-radius: 14px; padding: 1.5rem; max-width: 480px; margin: 0 auto; text-align: left; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                        <div style="color: var(--primary); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 6 12 12 16 14"></polygon></svg>
                            <span>Tu Próxima Partida Recomendada</span>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: flex-start;">
                            <div style="position: relative; flex-shrink: 0;">
                                <img src="${game.cover_url}" alt="${game.title}" style="width: 85px; height: 115px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
                                <button class="card-zoom-btn btn-zoom-preview" id="btn-zoom-roulette" title="Ampliar portada" style="opacity: 1; top: 4px; left: 4px; width: 28px; height: 28px;">
                                    ${ICONS.zoom}
                                </button>
                            </div>
                            <div style="flex: 1;">
                                <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; color: #fff;">${game.title}</h3>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${game.genre} · ${game.platform}</p>
                                <div>${priorityBadge}</div>
                            </div>
                        </div>
                        <div style="margin-top: 1.25rem; display: flex; gap: 0.6rem;">
                            <button class="btn btn-primary btn-sm" id="btn-play-chosen" style="flex: 1; gap: 0.5rem;">
                                ${ICONS.play} <span>Empezar a Jugar Ahora</span>
                            </button>
                        </div>
                    </div>
                `;

                document.getElementById('btn-zoom-roulette')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightboxModal(game);
                });

                document.getElementById('btn-play-chosen').addEventListener('click', async () => {
                    try {
                        await API.updateLibraryEntry(game.library_id, { status: 'playing' });
                        showToast(`¡"${game.title}" ahora está en estado Jugando!`);
                        switchView('library');
                    } catch (err) {
                        showToast(err.message, true);
                    }
                });
            }, 900);
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line></svg> <span>Seleccionar Juego Aleatorio</span>`;
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
    // 8.5. CUSTOM LISTS & REVIEWS (HU-05)
    // ==========================================
    let currentSelectedListId = null;

    function initListsUI() {
        const btnOpenCreate = document.getElementById('btn-open-create-list');
        if (btnOpenCreate) {
            btnOpenCreate.addEventListener('click', () => {
                if (!API.getToken()) {
                    showToast('Inicia sesión para crear listas temáticas', true);
                    openModal('modal-auth');
                    return;
                }
                document.getElementById('form-create-list').reset();
                openModal('modal-create-list');
            });
        }

        const formCreate = document.getElementById('form-create-list');
        if (formCreate) {
            formCreate.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('new-list-name').value.trim();
                const description = document.getElementById('new-list-desc').value.trim();
                try {
                    await API.createList({ name, description });
                    closeModal('modal-create-list');
                    showToast(`Lista "${name}" creada con éxito`);
                    loadCustomLists();
                } catch (err) {
                    showToast(err.message, true);
                }
            });
        }

        const formAddToList = document.getElementById('form-add-to-list');
        if (formAddToList) {
            formAddToList.addEventListener('submit', async (e) => {
                e.preventDefault();
                const gameId = document.getElementById('add-to-list-gameid').value;
                const listId = document.getElementById('select-user-lists').value;
                if (!listId) {
                    showToast('Selecciona una lista válida', true);
                    return;
                }
                try {
                    await API.addGameToList(listId, gameId);
                    closeModal('modal-add-to-list');
                    showToast('¡Videojuego añadido a la lista temática!');
                } catch (err) {
                    showToast(err.message, true);
                }
            });
        }

        const btnDeleteList = document.getElementById('btn-delete-current-list');
        if (btnDeleteList) {
            btnDeleteList.addEventListener('click', async () => {
                if (!currentSelectedListId) return;
                if (confirm('¿Estás seguro de eliminar esta lista temática?')) {
                    try {
                        await API.deleteList(currentSelectedListId);
                        closeModal('modal-list-details');
                        showToast('Lista temática eliminada');
                        loadCustomLists();
                    } catch (err) {
                        showToast(err.message, true);
                    }
                }
            });
        }
    }

    async function loadCustomLists() {
        const grid = document.getElementById('grid-custom-lists');
        if (!grid) return;

        if (!API.getToken()) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">🔒</span>
                    Inicia sesión para crear y consultar tus listas temáticas personalizadas.
                </div>
            `;
            return;
        }

        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Cargando tus listas...</div>';

        try {
            const res = await API.getMyLists();
            const lists = res.data || [];
            grid.innerHTML = '';

            if (lists.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📑</span>
                        Aún no tienes listas temáticas creadas. ¡Crea tu primera lista con el botón superior!
                    </div>
                `;
                return;
            }

            lists.forEach(item => {
                const card = document.createElement('div');
                card.className = 'kpi-card';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'stretch';
                card.style.gap = '1rem';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="font-size: 1.15rem; color: var(--primary); font-weight: 700; margin-bottom: 0.25rem;">${item.name}</h3>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">📅 Creada: ${item.created_at ? item.created_at.split(' ')[0] : 'Reciente'}</span>
                        </div>
                        <span class="status-badge" style="background: rgba(99, 102, 241, 0.2); color: var(--primary); border: 1px solid var(--primary);">${item.total_games} juegos</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.4; flex-grow: 1;">
                        ${item.description || '<em>Sin descripción definida.</em>'}
                    </p>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                        <button class="btn btn-secondary btn-sm btn-view-list" data-id="${item.id}">
                            👁️ Ver Colección
                        </button>
                    </div>
                `;

                card.querySelector('.btn-view-list').addEventListener('click', () => {
                    openMemberListModal(item.id);
                });

                grid.appendChild(card);
            });
        } catch (err) {
            grid.innerHTML = `<div style="grid-column: 1/-1; color: #ef4444; text-align: center;">Error al cargar listas: ${err.message}</div>`;
        }
    }

    async function openMemberListModal(listId) {
        currentSelectedListId = listId;
        try {
            const res = await API.getListDetails(listId);
            const list = res.data;

            document.getElementById('detail-list-title').textContent = list.name;
            document.getElementById('detail-list-desc').textContent = list.description || 'Sin descripción';

            const container = document.getElementById('detail-list-games');
            container.innerHTML = '';

            if (!list.games || list.games.length === 0) {
                container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">Esta lista no tiene juegos todavía. Puedes agregarlos desde el Catálogo usando el botón 📑 Lista.</div>';
            } else {
                list.games.forEach(g => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.justifyContent = 'space-between';
                    row.style.padding = '0.5rem 0.75rem';
                    row.style.background = 'var(--bg-card)';
                    row.style.borderRadius = '6px';
                    row.style.border = '1px solid var(--border-color)';

                    row.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <img src="${g.cover_url}" alt="${g.title}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;">
                            <div>
                                <div style="font-weight: 700; font-size: 0.9rem;">${g.title}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${g.genre} · ${g.platform}</div>
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm btn-remove-from-list" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Quitar de la lista">❌</button>
                    `;

                    row.querySelector('.btn-remove-from-list').addEventListener('click', async () => {
                        try {
                            await API.removeGameFromList(listId, g.game_id);
                            showToast(`"${g.title}" quitado de la lista`);
                            openMemberListModal(listId);
                        } catch (err) {
                            showToast(err.message, true);
                        }
                    });

                    container.appendChild(row);
                });
            }

            openModal('modal-list-details');
        } catch (err) {
            showToast(err.message, true);
        }
    }

    async function openAddToListModal(game) {
        document.getElementById('add-to-list-gameid').value = game.id;
        document.getElementById('add-to-list-gamename').textContent = `Videojuego: ${game.title}`;
        const select = document.getElementById('select-user-lists');
        select.innerHTML = '<option value="">Cargando listas...</option>';

        openModal('modal-add-to-list');

        try {
            const res = await API.getMyLists();
            const lists = res.data || [];
            select.innerHTML = '';
            if (lists.length === 0) {
                select.innerHTML = '<option value="">No tienes listas creadas (crea una primero en "Listas Temáticas")</option>';
            } else {
                select.innerHTML = '<option value="">-- Elige una lista --</option>';
                lists.forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = l.id;
                    opt.textContent = `${l.name} (${l.total_games} juegos)`;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            select.innerHTML = '<option value="">Error al cargar listas</option>';
        }
    }

    async function openReviewsModal(game) {
        document.getElementById('reviews-game-title').textContent = `Opiniones sobre "${game.title}"`;
        const container = document.getElementById('reviews-container');
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">Cargando opiniones de la comunidad...</div>';
        openModal('modal-reviews');

        try {
            const res = await API.getGameReviews(game.id);
            const reviews = res.data || [];
            container.innerHTML = '';

            if (reviews.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.9rem;">
                        <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📝</span>
                        Todavía no hay reseñas escritas para este videojuego.<br>
                        ¡Sé el primero de la comunidad en dejar tu reseña desde tu biblioteca personal!
                    </div>
                `;
                return;
            }

            reviews.forEach(r => {
                const item = document.createElement('div');
                item.style.padding = '0.85rem';
                item.style.background = 'var(--bg-card)';
                item.style.borderRadius = '8px';
                item.style.border = '1px solid var(--border-color)';

                const stars = r.rating ? '⭐'.repeat(r.rating) : 'Sin calificación';

                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <img src="${r.avatar || '/assets/avatars/pixel-knight.svg'}" alt="${r.username}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
                            <strong style="font-size: 0.85rem; color: #f1f5f9;">${r.username}</strong>
                        </div>
                        <span style="font-size: 0.85rem;">${stars}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.4; margin: 0; font-style: italic;">
                        "${r.review}"
                    </p>
                    <div style="font-size: 0.7rem; color: var(--text-muted); text-align: right; margin-top: 0.3rem;">
                        ${r.updated_at ? r.updated_at.split(' ')[0] : ''}
                    </div>
                `;
                container.appendChild(item);
            });
        } catch (err) {
            container.innerHTML = `<div style="color: #ef4444; font-size: 0.85rem;">Error al cargar reseñas: ${err.message}</div>`;
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

    document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.dataset.close;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // El modal de autenticación (login/registro) no debe cerrarse al hacer clic afuera, sólo con el botón X
                if (overlay.id === 'modal-auth') {
                    return;
                }
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

    // ==========================================
    // 10. FAQ BOT ASSISTANT (USER ONBOARDING & SUPPORT)
    // ==========================================
    const FAQ_KNOWLEDGE_BASE = [
        {
            keywords: ['favorito', 'favoritos', 'tope', 'limite', 'perfil', 'destacado', 'destacados', '4'],
            answer: '⭐ <strong>Tope de 4 Favoritos (HU-02):</strong> Puedes destacar un máximo de 4 videojuegos en la cabecera de tu perfil para lucir tus títulos predilectos. Para marcar uno, haz clic en el botón de estrella de la tarjeta en tu biblioteca. Si ya tienes 4, el sistema te pedirá desmarcar uno antes de fijar otro.'
        },
        {
            keywords: ['lista', 'listas', 'tematica', 'tematicas', 'coleccion', 'colecciones', 'custom'],
            answer: '📑 <strong>Listas Temáticas (HU-05):</strong> Te permiten agrupar juegos bajo conceptos personalizados (ej. "Joyas de PS2", "Pendientes de terror"). Puedes crearlas en la pestaña <em>Listas Temáticas</em> y luego añadir títulos desde el Catálogo usando el botón <strong>📑 Lista</strong>.'
        },
        {
            keywords: ['bitacora', 'hora', 'horas', 'sesion', 'sesiones', 'partida', 'tiempo'],
            answer: '⏱️ <strong>Bitácora de Sesiones (HU-04):</strong> En cada tarjeta de tu biblioteca tienes el botón <strong>⏱️ Bitácora</strong>. Al pulsarlo puedes ingresar las horas jugadas en una fecha concreta y notas de progreso. El sistema acumula automáticamente las horas totales.'
        },
        {
            keywords: ['ruleta', 'aleatorio', 'azar', 'indeciso', 'indecision', 'sorteo', 'prioridad'],
            answer: '🎲 <strong>Asistente de Indecisión / Ruleta (HU-07):</strong> Diseñado para superar la parálisis de elección. Ingresa a <em>Descubrir</em> y presiona <em>Seleccionar Juego Aleatorio</em>. Puedes filtrar exclusivamente juegos con prioridad alta marcando la casilla correspondiente.'
        },
        {
            keywords: ['portada', 'ampliar', 'lupa', 'zoom', 'imagen', 'ver grande'],
            answer: '🔍 <strong>Visor de Portada (Lightbox):</strong> Pasa el cursor por encima de cualquier portada de juego en el catálogo o biblioteca y presiona el botón de la <strong>lupa con +</strong> para ver la imagen en alta resolución con toda su ficha técnica.'
        },
        {
            keywords: ['demo', 'login', 'iniciar sesion', 'usuario', 'cuenta', 'clave', 'password'],
            answer: '🔑 <strong>Cuenta de Prueba Demo:</strong><br>• Correo: <code>gamer@tudai.edu.ar</code><br>• Contraseña: <code>gamer123</code><br>También puedes registrarte con una cuenta nueva desde el modal de autenticación.'
        },
        {
            keywords: ['estadisticas', 'kpi', 'dashboard', 'grafico', 'graficos', 'chart'],
            answer: '📊 <strong>Dashboard y Métricas (HU-06):</strong> En la sección <em>Estadísticas</em> puedes ver en tiempo real el porcentaje de backlog completado, horas totales invertidas, género predilecto y gráficos interactivos generados con Chart.js.'
        },
        {
            keywords: ['resena', 'resenas', 'opinion', 'opiniones', 'comentario', 'calificacion'],
            answer: '💬 <strong>Reseñas Comunitarias (HU-05):</strong> En el catálogo puedes pulsar <strong>💬 Reseñas</strong> en cualquier juego para consultar calificaciones por estrellas y comentarios dejados por otros gamers de la comunidad.'
        }
    ];

    function initFaqBot() {
        const toggleBtn = document.getElementById('btn-bot-toggle');
        const panel = document.getElementById('faq-bot-panel');
        const closeBtn = document.getElementById('btn-bot-close');
        const chatBody = document.getElementById('faq-bot-chat');
        const form = document.getElementById('form-bot-input');
        const input = document.getElementById('bot-input-text');

        if (!toggleBtn || !panel) return;

        toggleBtn.addEventListener('click', () => {
            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
                input.focus();
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        });

        closeBtn?.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        function appendBotMessage(text, isIncoming = true) {
            const msg = document.createElement('div');
            msg.className = `bot-msg ${isIncoming ? 'incoming' : 'outgoing'}`;
            msg.innerHTML = text;
            chatBody.appendChild(msg);
            chatBody.scrollTop = chatBody.scrollHeight;
        }

        // Click on FAQ pills
        document.querySelectorAll('.faq-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const qKey = pill.dataset.q;
                appendBotMessage(pill.textContent, false);

                setTimeout(() => {
                    let ans = null;
                    if (qKey === 'favoritos') ans = FAQ_KNOWLEDGE_BASE[0].answer;
                    else if (qKey === 'listas') ans = FAQ_KNOWLEDGE_BASE[1].answer;
                    else if (qKey === 'bitacora') ans = FAQ_KNOWLEDGE_BASE[2].answer;
                    else if (qKey === 'ruleta') ans = FAQ_KNOWLEDGE_BASE[3].answer;
                    else if (qKey === 'portada') ans = FAQ_KNOWLEDGE_BASE[4].answer;
                    else if (qKey === 'demo') ans = FAQ_KNOWLEDGE_BASE[5].answer;
                    appendBotMessage(ans || 'No tengo respuesta para esa opción.', true);
                }, 300);
            });
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = input.value.trim().toLowerCase();
            if (!query) return;

            appendBotMessage(input.value.trim(), false);
            input.value = '';

            setTimeout(() => {
                let match = FAQ_KNOWLEDGE_BASE.find(item => 
                    item.keywords.some(kw => query.includes(kw))
                );

                if (match) {
                    appendBotMessage(match.answer, true);
                } else {
                    appendBotMessage(`No estoy seguro de entender tu pregunta sobre "${query}". ¿Quizás te refieras a alguna de estas opciones?<br>• Escribe <strong>"favoritos"</strong> para conocer el límite de 4 títulos.<br>• Escribe <strong>"listas"</strong> para organizar colecciones.<br>• Escribe <strong>"bitacora"</strong> para saber cómo registrar horas.<br>• Escribe <strong>"ruleta"</strong> para ver el selector aleatorio.`, true);
                }
            }, 350);
        });
    }


    // ==========================================
    // 8. ADMINISTRATIVE PANEL (RBAC & CATALOG CRUD)
    // ==========================================
    let activeAdminTab = 'catalog';
    let adminCatalogDebounce = null;

    function initAdminUI() {
        // Tab switching
        const adminTabBtns = document.querySelectorAll('#admin-tabs .tab-btn');
        adminTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                adminTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeAdminTab = btn.dataset.adminTab;

                document.getElementById('admin-tab-content-catalog').style.display = (activeAdminTab === 'catalog') ? 'block' : 'none';
                document.getElementById('admin-tab-content-users').style.display = (activeAdminTab === 'users') ? 'block' : 'none';
                document.getElementById('admin-tab-content-stats').style.display = (activeAdminTab === 'stats') ? 'block' : 'none';

                if (activeAdminTab === 'catalog') loadAdminCatalog();
                if (activeAdminTab === 'users') loadAdminUsers();
                if (activeAdminTab === 'stats') loadAdminStats();
            });
        });

        // Search & genre filter in admin catalog
        // Search and filter for users in admin panel
        const adminSearchUsers = document.getElementById('admin-search-users');
        if (adminSearchUsers) {
            adminSearchUsers.addEventListener('input', () => {
                clearTimeout(adminUsersDebounce);
                adminUsersDebounce = setTimeout(() => {
                    loadAdminUsers();
                }, 300);
            });
        }

        const adminFilterStatus = document.getElementById('admin-filter-user-status');
        if (adminFilterStatus) {
            adminFilterStatus.addEventListener('change', () => loadAdminUsers());
        }

        // Add User Button
        const btnAddUser = document.getElementById('btn-admin-add-user');
        if (btnAddUser) {
            btnAddUser.addEventListener('click', () => {
                document.getElementById('form-admin-user').reset();
                document.getElementById('admin-user-id').value = '';
                document.getElementById('admin-user-password').setAttribute('required', 'true');
                document.getElementById('admin-user-pass-label').textContent = 'Contraseña *';
                document.getElementById('admin-user-pass-hint').style.display = 'none';
                document.getElementById('modal-admin-user-title').innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    <span>Crear Nuevo Usuario</span>
                `;
                openModal('modal-admin-user');
            });
        }

        const btnCancelAdminUser = document.getElementById('btn-cancel-admin-user');
        if (btnCancelAdminUser) {
            btnCancelAdminUser.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal('modal-admin-user');
            });
        }

        // Form Submit Admin User (Create / Update)
        const formAdminUser = document.getElementById('form-admin-user');
        if (formAdminUser) {
            formAdminUser.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userId = document.getElementById('admin-user-id').value;
                const username = document.getElementById('admin-user-username').value.trim();
                const email = document.getElementById('admin-user-email').value.trim();
                const password = document.getElementById('admin-user-password').value;
                const role = document.getElementById('admin-user-role').value;
                const status = document.getElementById('admin-user-status').value;
                const platform = document.getElementById('admin-user-platform').value;

                const payload = { username, email, role, status, platform };
                if (password) payload.password = password;

                const btnSave = document.getElementById('btn-save-admin-user');
                btnSave.disabled = true;
                btnSave.textContent = 'Guardando...';

                try {
                    if (userId) {
                        await API.updateAdminUser(userId, payload);
                        showToast(`Usuario "${username}" actualizado exitosamente.`);
                    } else {
                        await API.createAdminUser(payload);
                        showToast(`¡Usuario "${username}" creado exitosamente!`);
                    }
                    closeModal('modal-admin-user');
                    loadAdminUsers();
                    loadAdminStats();
                } catch (err) {
                    showToast(err.message || 'Error al guardar usuario', 'error');
                } finally {
                    btnSave.disabled = false;
                    btnSave.textContent = 'Guardar Usuario';
                }
            });
        }

        const adminSearch = document.getElementById('admin-search-catalog');
        if (adminSearch) {
            adminSearch.addEventListener('input', () => {
                clearTimeout(adminCatalogDebounce);
                adminCatalogDebounce = setTimeout(() => {
                    loadAdminCatalog();
                }, 300);
            });
        }

        const adminGenreFilter = document.getElementById('admin-filter-genre');
        if (adminGenreFilter) {
            adminGenreFilter.addEventListener('change', () => loadAdminCatalog());
        }

        // Add Game Button
        const btnAddGame = document.getElementById('btn-admin-add-game');
        if (btnAddGame) {
            btnAddGame.addEventListener('click', () => {
                const user = API.getUser();
                if (!user || user.role !== 'admin') {
                    showToast('Se requieren permisos de administrador.', 'error');
                    return;
                }
                document.getElementById('form-admin-game').reset();
                document.getElementById('admin-game-id').value = '';
                document.getElementById('modal-admin-game-title').innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>Añadir Videojuego al Catálogo</span>
                `;
                document.getElementById('admin-game-cover').value = '/assets/covers/cs2.webp';
                document.getElementById('admin-cover-preview').src = '/assets/covers/cs2.webp';
                const uploadBadge = document.getElementById('admin-upload-badge');
                if (uploadBadge) uploadBadge.style.display = 'none';
                const fileInput = document.getElementById('admin-game-file');
                if (fileInput) fileInput.value = '';
                const fileNameLabel = document.getElementById('admin-file-name');
                if (fileNameLabel) {
                    fileNameLabel.textContent = 'Formatos soportados: JPG, PNG, WEBP, GIF (Máx. 10MB)';
                    fileNameLabel.style.color = 'var(--text-muted)';
                }
                openModal('modal-admin-game');
            });
        }

        // Cover preset, file upload and live preview
        const coverInput = document.getElementById('admin-game-cover');
        const coverPreset = document.getElementById('admin-game-preset-cover');
        const coverPreview = document.getElementById('admin-cover-preview');
        const btnTriggerUpload = document.getElementById('btn-trigger-upload-cover');
        const fileInput = document.getElementById('admin-game-file');
        const uploadBadge = document.getElementById('admin-upload-badge');
        const fileNameLabel = document.getElementById('admin-file-name');

        if (btnTriggerUpload && fileInput) {
            btnTriggerUpload.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', () => {
                if (!fileInput.files || !fileInput.files[0]) return;
                const file = fileInput.files[0];

                if (!file.type.startsWith('image/')) {
                    showToast('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, GIF).', 'error');
                    fileInput.value = '';
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    showToast('La imagen es demasiado grande. El límite máximo es de 10 MB.', 'error');
                    fileInput.value = '';
                    return;
                }

                const reader = new FileReader();
                if (fileNameLabel) {
                    fileNameLabel.textContent = `Subiendo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`;
                    fileNameLabel.style.color = '#fbbf24';
                }

                reader.onload = async (e) => {
                    const base64Data = e.target.result;
                    if (coverPreview) coverPreview.src = base64Data;

                    try {
                        const uploadRes = await API.uploadAdminCover(base64Data, file.name);
                        if (uploadRes && uploadRes.url) {
                            if (coverInput) coverInput.value = uploadRes.url;
                            if (fileNameLabel) {
                                fileNameLabel.textContent = `✓ Archivo cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                                fileNameLabel.style.color = '#00dfa2';
                            }
                            if (uploadBadge) uploadBadge.style.display = 'inline';
                            showToast('¡Imagen de carátula cargada exitosamente!');
                        }
                    } catch (err) {
                        if (fileNameLabel) {
                            fileNameLabel.textContent = `Error al subir: ${err.message}`;
                            fileNameLabel.style.color = '#ef4444';
                        }
                        showToast(err.message || 'Error al subir la imagen', 'error');
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        if (coverPreset && coverInput && coverPreview) {
            coverPreset.addEventListener('change', () => {
                if (coverPreset.value) {
                    coverInput.value = coverPreset.value;
                    coverPreview.src = coverPreset.value;
                    if (uploadBadge) uploadBadge.style.display = 'none';
                    if (fileNameLabel) {
                        fileNameLabel.textContent = 'Formatos soportados: JPG, PNG, WEBP, GIF (Máx. 10MB)';
                        fileNameLabel.style.color = 'var(--text-muted)';
                    }
                }
            });

            coverInput.addEventListener('input', () => {
                coverPreview.src = coverInput.value || '/assets/covers/cs2.webp';
            });
            coverPreview.addEventListener('error', () => {
                coverPreview.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';
            });
        }

        // Cancel / Close modal button in admin modal
        const btnCancelAdminGame = document.getElementById('btn-cancel-admin-game');
        if (btnCancelAdminGame) {
            btnCancelAdminGame.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal('modal-admin-game');
            });
        }

        // Form submit (Create or Update Game)
        const formAdminGame = document.getElementById('form-admin-game');
        if (formAdminGame) {
            formAdminGame.addEventListener('submit', async (e) => {
                e.preventDefault();
                const gameId = document.getElementById('admin-game-id').value;
                const title = document.getElementById('admin-game-title').value.trim();
                const genre = document.getElementById('admin-game-genre').value.trim();
                const platform = document.getElementById('admin-game-platform').value.trim();
                const release_year = document.getElementById('admin-game-year').value;
                const developer = document.getElementById('admin-game-dev').value.trim();
                const synopsis = document.getElementById('admin-game-synopsis').value.trim();
                const cover_url = document.getElementById('admin-game-cover').value.trim();

                const payload = {
                    title,
                    genre,
                    platform,
                    release_year: release_year ? parseInt(release_year, 10) : null,
                    developer,
                    synopsis,
                    cover_url
                };

                const btnSave = document.getElementById('btn-save-admin-game');
                btnSave.disabled = true;
                btnSave.textContent = 'Guardando...';

                try {
                    if (gameId) {
                        await API.updateAdminGame(gameId, payload);
                        showToast(`Videojuego "${title}" actualizado correctamente.`);
                    } else {
                        await API.createAdminGame(payload);
                        showToast(`¡Videojuego "${title}" añadido al catálogo oficial!`);
                    }
                    closeModal('modal-admin-game');
                    loadAdminCatalog();
                    loadCatalog(); // Refresh public catalog too
                    loadAdminStats();
                } catch (err) {
                    showToast(err.message || 'Error guardando videojuego', 'error');
                } finally {
                    btnSave.disabled = false;
                    btnSave.textContent = 'Guardar Videojuego';
                }
            });
        }
    }

    async function loadAdminDashboard() {
        const user = API.getUser();
        if (!user || user.role !== 'admin') {
            showToast('Acceso restringido: Se requieren credenciales de administrador.', 'error');
            switchView('catalog');
            return;
        }

        if (activeAdminTab === 'catalog') {
            await loadAdminCatalog();
        } else if (activeAdminTab === 'users') {
            await loadAdminUsers();
        } else if (activeAdminTab === 'stats') {
            await loadAdminStats();
        }
    }

    async function loadAdminCatalog() {
        const tbody = document.getElementById('admin-catalog-tbody');
        if (!tbody) return;

        const search = document.getElementById('admin-search-catalog')?.value || '';
        const genre = document.getElementById('admin-filter-genre')?.value || '';

        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Cargando catálogo oficial...</td></tr>`;

        try {
            const res = await API.getGames({ search, genre });
            const games = res.data || [];

            // Populate admin genre filter if empty
            const genreSelect = document.getElementById('admin-filter-genre');
            if (genreSelect && genreSelect.options.length <= 1) {
                const filterRes = await API.getFilters();
                (filterRes.genres || []).forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g;
                    opt.textContent = g;
                    genreSelect.appendChild(opt);
                });
            }

            if (games.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron videojuegos en el catálogo.</td></tr>`;
                return;
            }

            tbody.innerHTML = games.map(g => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 0.75rem 1rem;">
                        <img src="${g.cover_url || '/assets/covers/cs2.webp'}" alt="${g.title}" style="width: 38px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'">
                    </td>
                    <td style="padding: 0.75rem 1rem;">
                        <strong style="color: #fff; display: block; font-size: 0.92rem;">${g.title}</strong>
                        <span style="color: var(--text-muted); font-size: 0.78rem;">${g.developer || 'Estudio N/A'}</span>
                    </td>
                    <td style="padding: 0.75rem 1rem;">
                        <span class="badge-tag" style="background: rgba(0, 223, 162, 0.12); color: var(--primary); border: 1px solid rgba(0, 223, 162, 0.3);">${g.genre}</span>
                    </td>
                    <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${g.platform}</td>
                    <td style="padding: 0.75rem 1rem; color: var(--text-muted); font-weight: 600;">${g.release_year || 'N/A'}</td>
                    <td style="padding: 0.75rem 1rem; text-align: right;">
                        <div style="display: inline-flex; gap: 0.4rem;">
                            <button class="btn btn-secondary btn-sm btn-edit-game" data-id="${g.id}" title="Editar Videojuego" style="padding: 0.35rem 0.65rem;">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger btn-sm btn-del-game" data-id="${g.id}" data-title="${g.title}" title="Eliminar del Catálogo" style="padding: 0.35rem 0.65rem;">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Attach event listeners to Edit and Delete buttons
            tbody.querySelectorAll('.btn-edit-game').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    try {
                        const gameRes = await API.getGameById(id);
                        const game = gameRes.data;
                        document.getElementById('admin-game-id').value = game.id;
                        document.getElementById('admin-game-title').value = game.title;
                        document.getElementById('admin-game-genre').value = game.genre;
                        document.getElementById('admin-game-platform').value = game.platform;
                        document.getElementById('admin-game-year').value = game.release_year || '';
                        document.getElementById('admin-game-dev').value = game.developer || '';
                        document.getElementById('admin-game-synopsis').value = game.synopsis || '';
                        document.getElementById('admin-game-cover').value = game.cover_url || '';
                        document.getElementById('admin-cover-preview').src = game.cover_url || '/assets/covers/cs2.webp';
                        const editUploadBadge = document.getElementById('admin-upload-badge');
                        if (editUploadBadge) editUploadBadge.style.display = 'none';
                        const editFileInput = document.getElementById('admin-game-file');
                        if (editFileInput) editFileInput.value = '';
                        const editFileNameLabel = document.getElementById('admin-file-name');
                        if (editFileNameLabel) {
                            editFileNameLabel.textContent = 'Formatos soportados: JPG, PNG, WEBP, GIF (Máx. 10MB)';
                            editFileNameLabel.style.color = 'var(--text-muted)';
                        }
                        document.getElementById('modal-admin-game-title').innerHTML = `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <span>Editar Videojuego #${game.id}</span>
                        `;
                        openModal('modal-admin-game');
                    } catch (err) {
                        showToast('Error cargando datos del juego', 'error');
                    }
                });
            });

            tbody.querySelectorAll('.btn-del-game').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const title = btn.dataset.title;
                    if (confirm(`¿Confirma que desea eliminar el videojuego "${title}" del catálogo? Se borrará de todas las bibliotecas de usuarios.`)) {
                        try {
                            await API.deleteAdminGame(id);
                            showToast(`Videojuego "${title}" eliminado.`);
                            loadAdminCatalog();
                            loadCatalog();
                            loadAdminStats();
                        } catch (err) {
                            showToast(err.message || 'Error eliminando juego', 'error');
                        }
                    }
                });
            });

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #ef4444;">Error cargando catálogo: ${err.message}</td></tr>`;
        }
    }

    let cachedAdminUsers = [];
    let adminUsersDebounce = null;

    async function loadAdminUsers() {
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;

        const search = (document.getElementById('admin-search-users')?.value || '').toLowerCase().trim();
        const filterStatus = document.getElementById('admin-filter-user-status')?.value || '';

        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Cargando usuarios registrados...</td></tr>`;

        try {
            const res = await API.getAdminUsers();
            cachedAdminUsers = res.data || [];

            let filtered = cachedAdminUsers;

            if (search) {
                filtered = filtered.filter(u => 
                    (u.username && u.username.toLowerCase().includes(search)) ||
                    (u.email && u.email.toLowerCase().includes(search))
                );
            }

            if (filterStatus === 'active') {
                filtered = filtered.filter(u => u.status !== 'banned');
            } else if (filterStatus === 'banned') {
                filtered = filtered.filter(u => u.status === 'banned');
            } else if (filterStatus === 'admin') {
                filtered = filtered.filter(u => u.role === 'admin');
            }

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron usuarios coincidentes.</td></tr>`;
                return;
            }

            tbody.innerHTML = filtered.map(u => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s; ${u.status === 'banned' ? 'background: rgba(239, 68, 68, 0.05);' : ''}" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='${u.status === 'banned' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}'">
                    <td style="padding: 0.75rem 1rem; color: var(--text-muted); font-weight: 700;">#${u.id}</td>
                    <td style="padding: 0.75rem 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <img src="${u.avatar || '/assets/avatars/pixel-knight.svg'}" alt="${u.username}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border-color);">
                            <span style="font-weight: 700; color: #fff;">${u.username}</span>
                        </div>
                    </td>
                    <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${u.email}</td>
                    <td style="padding: 0.75rem 1rem; color: var(--text-muted);">${u.platform || 'PC'}</td>
                    <td style="padding: 0.75rem 1rem;">
                        ${u.role === 'admin' 
                            ? '<span class="badge-tag" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4); font-weight: 700;">🛡️ ADMIN</span>' 
                            : '<span class="badge-tag" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">👤 USER</span>'}
                    </td>
                    <td style="padding: 0.75rem 1rem;">
                        ${u.status === 'banned'
                            ? '<span class="badge-tag" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5); font-weight: 800;">🚫 BANEADO</span>'
                            : '<span class="badge-tag" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 700;">🟢 ACTIVO</span>'}
                    </td>
                    <td style="padding: 0.75rem 1rem; font-weight: 700; color: #00dfa2;">${u.total_games || 0}</td>
                    <td style="padding: 0.75rem 1rem; text-align: right;">
                        <div style="display: inline-flex; gap: 0.35rem; flex-wrap: wrap; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${u.id}" title="Modificar Usuario" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-secondary btn-sm btn-toggle-role" data-id="${u.id}" data-role="${u.role}" title="Cambiar Rol" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">
                                ${u.role === 'admin' ? 'Hacer User' : 'Hacer Admin'}
                            </button>
                            <button class="btn btn-sm btn-toggle-ban ${u.status === 'banned' ? 'btn-secondary' : 'btn-danger'}" data-id="${u.id}" data-status="${u.status || 'active'}" data-username="${u.username}" title="${u.status === 'banned' ? 'Desbanear Usuario' : 'Banear Usuario'}" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">
                                ${u.status === 'banned' ? '🟢 Desbanear' : '⛔ Banear'}
                            </button>
                            <button class="btn btn-danger btn-sm btn-del-user" data-id="${u.id}" data-username="${u.username}" title="Eliminar Usuario" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Listeners for CRUD actions
            tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.dataset.id);
                    const user = cachedAdminUsers.find(u => u.id === id);
                    if (!user) return;

                    document.getElementById('admin-user-id').value = user.id;
                    document.getElementById('admin-user-username').value = user.username;
                    document.getElementById('admin-user-email').value = user.email;
                    document.getElementById('admin-user-password').value = '';
                    document.getElementById('admin-user-password').removeAttribute('required');
                    document.getElementById('admin-user-pass-label').textContent = 'Nueva Contraseña (Opcional)';
                    document.getElementById('admin-user-pass-hint').style.display = 'block';
                    document.getElementById('admin-user-role').value = user.role || 'user';
                    document.getElementById('admin-user-status').value = user.status || 'active';
                    document.getElementById('admin-user-platform').value = user.platform || 'PC';

                    document.getElementById('modal-admin-user-title').innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Modificar Usuario #${user.id}</span>
                    `;
                    openModal('modal-admin-user');
                });
            });

            tbody.querySelectorAll('.btn-toggle-role').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const currentRole = btn.dataset.role;
                    const newRole = currentRole === 'admin' ? 'user' : 'admin';

                    if (confirm(`¿Desea cambiar el rol del usuario #${id} a "${newRole}"?`)) {
                        try {
                            await API.updateAdminUserRole(id, newRole);
                            showToast(`Rol del usuario actualizado a ${newRole}.`);
                            loadAdminUsers();
                            loadAdminStats();
                        } catch (err) {
                            showToast(err.message || 'Error actualizando rol', 'error');
                        }
                    }
                });
            });

            tbody.querySelectorAll('.btn-toggle-ban').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const currentStatus = btn.dataset.status;
                    const username = btn.dataset.username;
                    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
                    const actionLabel = newStatus === 'banned' ? 'BANEAR' : 'DESBANEAR';

                    if (confirm(`¿Confirma que desea ${actionLabel} la cuenta de "${username}"? ${newStatus === 'banned' ? 'El usuario no podrá realizar ninguna acción en la plataforma.' : 'Se le devolverá el acceso normal.'}`)) {
                        try {
                            await API.updateAdminUserStatus(id, newStatus);
                            showToast(`Usuario "${username}" ${newStatus === 'banned' ? 'baneado' : 'desbaneado'} exitosamente.`);
                            loadAdminUsers();
                        } catch (err) {
                            showToast(err.message || 'Error al modificar estado', 'error');
                        }
                    }
                });
            });

            tbody.querySelectorAll('.btn-del-user').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const username = btn.dataset.username;

                    if (confirm(`¿ATENCIÓN: Desea ELIMINAR permanentemente la cuenta de "${username}"? Se borrarán todos sus datos y juegos.`)) {
                        try {
                            await API.deleteAdminUser(id);
                            showToast(`Cuenta de "${username}" eliminada correctamente.`);
                            loadAdminUsers();
                            loadAdminStats();
                        } catch (err) {
                            showToast(err.message || 'Error eliminando usuario', 'error');
                        }
                    }
                });
            });

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #ef4444;">Error cargando usuarios: ${err.message}</td></tr>`;
        }
    }

    async function loadAdminStats() {
        try {
            const res = await API.getAdminStats();
            const stats = res.data || {};
            const elUsers = document.getElementById('admin-stat-users');
            const elGames = document.getElementById('admin-stat-games');
            const elLibrary = document.getElementById('admin-stat-library');
            const elHours = document.getElementById('admin-stat-hours');

            if (elUsers) elUsers.textContent = stats.total_users || 0;
            if (elGames) elGames.textContent = stats.total_games || 0;
            if (elLibrary) elLibrary.textContent = stats.total_library_entries || 0;
            if (elHours) elHours.textContent = `${Number(stats.total_hours_logged || 0).toFixed(1)}h`;
        } catch (err) {
            console.error('Error cargando stats de admin:', err);
        }
    }

});