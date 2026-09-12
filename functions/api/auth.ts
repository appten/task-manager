type KVNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

interface Env {
  Task_KV: KVNamespace;
  DEV_ADMIN_EMAIL?: string;
  DEV_ADMIN_PASSWORD?: string;
  DEV_ADMIN_NAME?: string;
  TEN_CLIENT_ID?: string;
  TEN_CLIENT_SECRET?: string;
  TEN_ISSUER?: string;
}

type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      action:
        | 'register'
        | 'login'
        | 'verify-recovery'
        | 'reset-password'
        | 'update-profile'
        | 'get-users'
        | 'update-role'
        | 'ten-sso-callback';
      email?: string;
      password?: string;
      name?: string;
      recoveryPin?: string;
      newPassword?: string;
      oldPassword?: string;
      targetRole?: 'user' | 'admin';
      initialTasks?: any[];
      userGoal?: string;
      requesterEmail?: string;
      code?: string;
      redirectUri?: string;
    };

    const {
      action,
      email,
      password,
      name,
      recoveryPin,
      newPassword,
      oldPassword,
      targetRole,
      initialTasks,
      userGoal,
      requesterEmail,
      code,
      redirectUri,
    } = body;

    if (!env.Task_KV) {
      return new Response(JSON.stringify({ error: 'Task_KV binding tidak tersedia' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Helper untuk membaca email pengembang dari environment variable Cloudflare / local env
    const configuredAdminEmail = (
      env.DEV_ADMIN_EMAIL ||
      (typeof process !== 'undefined' && process.env?.DEV_ADMIN_EMAIL) ||
      ''
    ).trim().toLowerCase();

    // Helper untuk mengelola indeks seluruh pengguna terdaftar
    const USERS_INDEX_KEY = 'system:users_index';
    const addToUsersIndex = async (userEmail: string) => {
      try {
        const rawIndex = await env.Task_KV.get(USERS_INDEX_KEY);
        const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : [];
        if (!indexList.includes(userEmail)) {
          indexList.push(userEmail);
          await env.Task_KV.put(USERS_INDEX_KEY, JSON.stringify(indexList));
        }
      } catch (err) {
        console.warn('Gagal memperbarui users_index:', err);
      }
    };

    // Auto-seed akun pengembang pertama jika diset di environment variable dan belum ada di Task_KV
    if (configuredAdminEmail) {
      try {
        const existingAdmin = await env.Task_KV.get(`user:${configuredAdminEmail}`);
        if (!existingAdmin) {
          const devAdminData = {
            name: env.DEV_ADMIN_NAME || (typeof process !== 'undefined' && process.env?.DEV_ADMIN_NAME) || 'Pengelola Utama',
            email: configuredAdminEmail,
            passwordHash: env.DEV_ADMIN_PASSWORD || (typeof process !== 'undefined' && process.env?.DEV_ADMIN_PASSWORD) || 'admin123',
            role: 'admin',
            recoveryPin: '999999',
            createdAt: new Date().toISOString(),
          };
          await env.Task_KV.put(`user:${configuredAdminEmail}`, JSON.stringify(devAdminData));
          await addToUsersIndex(configuredAdminEmail);
        }
      } catch (e) {
        console.warn('Gagal inisialisasi dev admin dari env:', e);
      }
    }

    // Helper untuk memverifikasi apakah akun pemohon adalah Admin / Pengelola sah
    const checkIsAdmin = async (checkEmail?: string): Promise<boolean> => {
      if (!checkEmail) return false;
      const normalized = checkEmail.trim().toLowerCase();
      if (configuredAdminEmail && normalized === configuredAdminEmail) return true;
      if (normalized.startsWith('admin') || normalized.startsWith('dev')) return true;
      try {
        const raw = await env.Task_KV.get(`user:${normalized}`);
        if (!raw) return false;
        const u = JSON.parse(raw);
        return u.role === 'admin';
      } catch {
        return false;
      }
    };

    // Penanganan Login SSO TEN (OIDC Token Exchange & Sinkronisasi Akun KV)
    if (action === 'ten-sso-callback') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'Kode otorisasi tidak ditemukan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const clientId =
        env.TEN_CLIENT_ID ||
        (typeof process !== 'undefined' && process.env?.TEN_CLIENT_ID) ||
        'ten_app_eaffqk';
      const clientSecret =
        env.TEN_CLIENT_SECRET ||
        (typeof process !== 'undefined' && process.env?.TEN_CLIENT_SECRET) ||
        'sec_live_256rmh7fj21qcc6mbp3gkf';
      const redirectUriParam = redirectUri || 'https://task.ten.my.id/auth/callback';

      try {
        // 1. Tukar authorization code dengan access token ke SSO TEN
        const tokenRes = await fetch('https://account.ten.my.id/api/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUriParam,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          return new Response(
            JSON.stringify({ error: `Gagal menukar token SSO TEN: ${errText}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const tokenData = (await tokenRes.json()) as any;
        const accessToken = tokenData.access_token;

        // 2. Ambil profil pengguna dari userinfo endpoint
        let profile: any = {};
        if (accessToken) {
          const userinfoRes = await fetch('https://account.ten.my.id/api/oauth/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (userinfoRes.ok) {
            profile = await userinfoRes.json();
          }
        }

        const userEmail = (profile.email || tokenData.email || '').trim().toLowerCase();
        if (!userEmail) {
          return new Response(
            JSON.stringify({ error: 'Email pengguna tidak tersedia dari SSO TEN' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const rawUsername = profile.username || profile.preferred_username || '';
        const formattedUsername = rawUsername
          ? rawUsername.startsWith('@')
            ? rawUsername
            : `@${rawUsername}`
          : undefined;
        const userName = profile.name || profile.username || userEmail.split('@')[0];
        const userRole =
          profile.role ||
          (configuredAdminEmail && userEmail === configuredAdminEmail ? 'admin' : 'user');
        const userAvatar = profile.picture || profile.avatar || null;

        // 3. Simpan atau perbarui di Task_KV
        const existingUserRaw = await env.Task_KV.get(`user:${userEmail}`);
        let userData: any;
        if (existingUserRaw) {
          userData = JSON.parse(existingUserRaw);
          userData.name = userName;
          userData.username = formattedUsername;
          userData.avatar = userAvatar;
          userData.lastLoginAt = new Date().toISOString();
        } else {
          userData = {
            name: userName,
            username: formattedUsername,
            email: userEmail,
            role: userRole,
            avatar: userAvatar,
            authProvider: 'sso_ten',
            ssoId: profile.sub || tokenData.sub || '',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          await addToUsersIndex(userEmail);
        }
        await env.Task_KV.put(`user:${userEmail}`, JSON.stringify(userData));

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: profile.sub || tokenData.sub || userEmail,
              email: userEmail,
              name: userName,
              username: formattedUsername,
              role: userData.role || userRole,
              avatar: userAvatar,
            },
            token: tokenData,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (exchangeErr: any) {
        return new Response(
          JSON.stringify({
            error: exchangeErr.message || 'Terjadi kesalahan komunikasi dengan server SSO TEN',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Aksi yang tidak wajib menyertakan email di body utama: get-users
    if (action === 'get-users') {
      const isAuthorized = await checkIsAdmin(requesterEmail || email);
      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ error: 'Akses ditolak: Hanya pengelola yang dapat mengakses daftar pengguna' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const rawIndex = await env.Task_KV.get(USERS_INDEX_KEY);
      const indexList: string[] = rawIndex ? JSON.parse(rawIndex) : [];

      const usersList: any[] = [];
      for (const mail of indexList) {
        try {
          const raw = await env.Task_KV.get(`user:${mail}`);
          if (raw) {
            const u = JSON.parse(raw);
            // Cek jumlah task jika ada
            let taskCount = 0;
            const rawTasks = await env.Task_KV.get(`tasks:${mail}`);
            if (rawTasks) {
              const tParsed = JSON.parse(rawTasks);
              if (Array.isArray(tParsed?.tasks)) {
                taskCount = tParsed.tasks.length;
              }
            }

            const isAdmin = Boolean(
              (configuredAdminEmail && mail.toLowerCase() === configuredAdminEmail) ||
              u.role === 'admin' ||
              mail.startsWith('admin') ||
              mail.startsWith('dev')
            );

            usersList.push({
              name: u.name,
              email: u.email,
              role: isAdmin ? 'admin' : 'user',
              createdAt: u.createdAt,
              recoveryPinSet: Boolean(u.recoveryPin),
              taskCount,
            });
          }
        } catch {}
      }

      return new Response(JSON.stringify({ success: true, users: usersList }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userKey = `user:${normalizedEmail}`;

    // 1. REGISTER
    if (action === 'register') {
      if (!password) {
        return new Response(JSON.stringify({ error: 'Kata sandi wajib diisi' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existingUser = await env.Task_KV.get(userKey);
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Akun dengan email ini sudah terdaftar' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Deteksi role pengembang dari environment variable atau awalan admin
      const isInitialAdmin = Boolean(
        (configuredAdminEmail && normalizedEmail === configuredAdminEmail) ||
        normalizedEmail.startsWith('admin') ||
        normalizedEmail.startsWith('dev')
      );
      const userRole = isInitialAdmin ? 'admin' : 'user';

      const userData = {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: password,
        recoveryPin: recoveryPin || '',
        role: userRole,
        createdAt: new Date().toISOString(),
      };

      await env.Task_KV.put(userKey, JSON.stringify(userData));
      await addToUsersIndex(normalizedEmail);

      // Jika ada initial tasks yang diunggah saat registrasi
      if (initialTasks && Array.isArray(initialTasks)) {
        const tasksKey = `tasks:${normalizedEmail}`;
        const syncPayload = {
          tasks: initialTasks,
          userGoal: userGoal || '',
          updatedAt: new Date().toISOString(),
        };
        await env.Task_KV.put(tasksKey, JSON.stringify(syncPayload));
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            createdAt: userData.createdAt,
            recoveryPinSet: Boolean(userData.recoveryPin),
          },
          message: 'Registrasi berhasil dan akun tersimpan di Task_KV Cloudflare',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. LOGIN
    if (action === 'login') {
      if (!password) {
        return new Response(JSON.stringify({ error: 'Kata sandi wajib diisi' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existingUserRaw = await env.Task_KV.get(userKey);
      if (!existingUserRaw) {
        return new Response(JSON.stringify({ error: 'Email atau kata sandi tidak sesuai' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = JSON.parse(existingUserRaw);
      if (userData.passwordHash !== password) {
        return new Response(JSON.stringify({ error: 'Email atau kata sandi tidak sesuai' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Pastikan email ada di index pengguna
      await addToUsersIndex(normalizedEmail);

      // Ambil data tugas tersimpan di cloud jika ada
      const tasksKey = `tasks:${normalizedEmail}`;
      const cloudTasksRaw = await env.Task_KV.get(tasksKey);
      let cloudData = null;
      if (cloudTasksRaw) {
        try {
          cloudData = JSON.parse(cloudTasksRaw);
        } catch (e) {
          // ignore parsing error
        }
      }

      const userRole = (configuredAdminEmail && normalizedEmail === configuredAdminEmail)
        ? 'admin'
        : (userData.role || (normalizedEmail.startsWith('admin') || normalizedEmail.startsWith('dev') ? 'admin' : 'user'));

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            name: userData.name,
            email: userData.email,
            role: userRole,
            createdAt: userData.createdAt,
            recoveryPinSet: Boolean(userData.recoveryPin),
          },
          cloudData,
          message: 'Login berhasil',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. VERIFY RECOVERY PIN
    if (action === 'verify-recovery') {
      const existingUserRaw = await env.Task_KV.get(userKey);
      if (!existingUserRaw) {
        return new Response(JSON.stringify({ error: 'Akun dengan email ini tidak ditemukan' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = JSON.parse(existingUserRaw);
      if (!userData.recoveryPin) {
        return new Response(
          JSON.stringify({
            error: 'Akun ini belum memiliki PIN pemulihan. Silakan hubungi pengelola aplikasi.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (userData.recoveryPin !== recoveryPin) {
        return new Response(JSON.stringify({ error: 'PIN Pemulihan salah. Silakan periksa kembali.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          name: userData.name,
          message: 'PIN Pemulihan valid. Silakan buat kata sandi baru.',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. RESET PASSWORD
    if (action === 'reset-password') {
      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Kata sandi baru minimal 6 karakter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const existingUserRaw = await env.Task_KV.get(userKey);
      if (!existingUserRaw) {
        return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = JSON.parse(existingUserRaw);
      if (userData.recoveryPin && userData.recoveryPin !== recoveryPin) {
        return new Response(JSON.stringify({ error: 'PIN Pemulihan tidak valid' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      userData.passwordHash = newPassword;
      userData.passwordResetAt = new Date().toISOString();
      await env.Task_KV.put(userKey, JSON.stringify(userData));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru.',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. UPDATE PROFILE
    if (action === 'update-profile') {
      const existingUserRaw = await env.Task_KV.get(userKey);
      if (!existingUserRaw) {
        return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = JSON.parse(existingUserRaw);

      if (newPassword) {
        if (!oldPassword || userData.passwordHash !== oldPassword) {
          return new Response(JSON.stringify({ error: 'Kata sandi saat ini salah' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (newPassword.length < 6) {
          return new Response(JSON.stringify({ error: 'Kata sandi baru minimal 6 karakter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        userData.passwordHash = newPassword;
      }

      if (name && name.trim()) {
        userData.name = name.trim();
      }

      if (recoveryPin && recoveryPin.trim()) {
        userData.recoveryPin = recoveryPin.trim();
      }

      userData.updatedAt = new Date().toISOString();
      await env.Task_KV.put(userKey, JSON.stringify(userData));

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            name: userData.name,
            email: userData.email,
            role: userData.role || 'user',
            createdAt: userData.createdAt,
            recoveryPinSet: Boolean(userData.recoveryPin),
          },
          message: 'Profil berhasil diperbarui',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. UPDATE ROLE
    if (action === 'update-role') {
      const isAuthorized = await checkIsAdmin(requesterEmail);
      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ error: 'Akses ditolak: Hanya pengelola yang dapat mengubah role pengguna' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const existingUserRaw = await env.Task_KV.get(userKey);
      if (!existingUserRaw) {
        return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = JSON.parse(existingUserRaw);
      userData.role = targetRole || (userData.role === 'admin' ? 'user' : 'admin');
      userData.roleUpdatedAt = new Date().toISOString();
      await env.Task_KV.put(userKey, JSON.stringify(userData));

      return new Response(
        JSON.stringify({
          success: true,
          email: userData.email,
          role: userData.role,
          message: `Role akun berhasil diubah menjadi ${userData.role === 'admin' ? 'Pengelola' : 'User'}`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Action tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
